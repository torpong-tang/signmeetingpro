"use client";

import { useState, type FormEvent } from "react";
import { apiMutation } from "@/hooks/use-bootstrap";
import { appPath } from "@/lib/app-path";
import { formatThaiDate } from "@/lib/format";
import { hasDuplicateParticipantGroups } from "@/lib/meeting-channel-policy";
import { meetingDurationMinutes } from "@/lib/meeting-time";
import type {
  GroupRecord,
  MeetingRecord,
  ProjectRecord,
} from "@/types/app";
import type { MeetingAction } from "./meeting-list-section";
import { useConfirmedAction } from "./use-confirmed-action";
import { useMeetingFilters } from "./use-meeting-filters";
import { useMeetingFormState } from "./use-meeting-form-state";

export function useMeetingWorkspace({
  meetings,
  projects,
  groups,
  onChanged,
}: {
  meetings: MeetingRecord[];
  projects: ProjectRecord[];
  groups: GroupRecord[];
  onChanged: () => Promise<void>;
}) {
  const filters = useMeetingFilters();
  const [attendanceMeeting, setAttendanceMeeting] =
    useState<MeetingRecord | null>(null);
  const [mediaMeeting, setMediaMeeting] =
    useState<MeetingRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const confirmedAction = useConfirmedAction();
  const formState = useMeetingFormState({
    meetings,
    projects,
    groups,
    setError,
  });
  const {
    formOpen,
    setFormOpen,
    copying,
    setCopying,
    editing,
    setEditing,
    form,
    setForm,
    qrImageFiles,
    setQrImageFiles,
    openCreate,
    updateTime,
    changeQrImageFile,
  } = formState;
  const {
    search,
    setSearch,
    projectFilter,
    setProjectFilter,
  } = filters;
  const { confirm, setConfirm, ask, runPending } = confirmedAction;

  function openMedia(record: MeetingRecord) {
    setMediaMeeting(record);
  }

  function handleListAction(
    action: MeetingAction,
    record: MeetingRecord,
  ) {
    if (action === "detail") {
      filters.router.push(`/meetings/${record.id}`);
    } else if (action === "attendance") {
      setAttendanceMeeting(record);
    } else if (action === "media") {
      openMedia(record);
    } else if (action === "copy") {
      formState.openCopy(record);
    } else if (action === "edit") {
      formState.openEdit(record);
    } else {
      requestDelete(record);
    }
  }

  async function uploadQrImages(meetingId: string) {
    for (const channelNo of [1, 2] as const) {
      const file = formState.qrImageFiles[channelNo];
      if (!file) continue;
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(
        appPath(
          `/api/meetings/${meetingId}/channels/${channelNo}/image`,
        ),
        { method: "POST", body: formData },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          result.error ||
            `อัปโหลดรูป QR Channel ${channelNo} ไม่สำเร็จ`,
        );
      }
      formState.changeQrImageFile(channelNo, null);
    }
  }

  function requestDeleteQrImage(channelNo: 1 | 2) {
    if (!formState.editing) return;
    confirmedAction.ask(
      {
        open: true,
        title: `ยืนยันการลบรูป QR Channel ${channelNo}`,
        description: `รูปประกอบของ ${formState.form.channels[channelNo - 1].aliasName} จะถูกลบออก`,
        kind: "delete",
        confirmLabel: "ลบรูป",
      },
      async () => {
        setLoading(true);
        setError("");
        try {
          const response = await fetch(
            appPath(
              `/api/meetings/${formState.editing!.id}/channels/${channelNo}/image`,
            ),
            { method: "DELETE" },
          );
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(result.error || "ลบรูปไม่สำเร็จ");
          }
          formState.setEditing((current) =>
            current
              ? {
                  ...current,
                  channels: current.channels.map((channel) =>
                    channel.channelNo === channelNo
                      ? { ...channel, hasImage: false }
                      : channel,
                  ),
                }
              : null,
          );
          await onChanged();
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "ลบรูปไม่สำเร็จ",
          );
        } finally {
          setLoading(false);
        }
      },
    );
  }

  function requestSave(event: FormEvent) {
    event.preventDefault();
    const meetingDuration = meetingDurationMinutes(
      form.startTime,
      form.endTime,
    );
    if (
      !form.projectId ||
      !form.title ||
      !form.meetingDate ||
      !form.location ||
      !form.channels[0].groupId
    ) {
      setError(
        "กรุณากรอกข้อมูลบังคับและเลือกกลุ่มสำหรับ QR ช่องที่ 1",
      );
      return;
    }
    if (hasDuplicateParticipantGroups(form.channels)) {
      setError(
        "QR Channel 1 และ QR Channel 2 ต้องเลือกกลุ่มผู้เข้าร่วมคนละกลุ่ม",
      );
      return;
    }
    if (form.endTime <= form.startTime) {
      setError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม");
      return;
    }
    if (form.registerLimitMinutes > meetingDuration) {
      setError(
        `เวลาลงทะเบียนต้องไม่เกินระยะเวลาประชุม ${meetingDuration} นาที`,
      );
      return;
    }
    ask(
      {
        open: true,
        title: editing
          ? "ยืนยันการแก้ไขการประชุม"
          : "ยืนยันการสร้างการประชุม",
        description: `${form.title} วันที่ ${formatThaiDate(form.meetingDate)} เวลา ${form.startTime}-${form.endTime}`,
        kind: "save",
        confirmLabel: editing
          ? "บันทึกการแก้ไข"
          : "สร้างการประชุม",
      },
      saveMeeting,
    );
  }

  async function saveMeeting() {
    setLoading(true);
    let savedMeeting: MeetingRecord | null = null;
    try {
      savedMeeting = (await apiMutation(
        editing ? `/api/meetings/${editing.id}` : "/api/meetings",
        editing ? "PUT" : "POST",
        {
          ...form,
          agenda: form.agenda || null,
          channels: form.channels.map((channel) => ({
            ...channel,
            groupId: channel.groupId || null,
          })),
        },
      )) as MeetingRecord;
      if (!editing) setEditing(savedMeeting);
      await uploadQrImages(savedMeeting.id);
      setQrImageFiles({});
      setFormOpen(false);
      setCopying(false);
      await onChanged();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "บันทึกไม่สำเร็จ",
      );
      if (savedMeeting) {
        await onChanged().catch(() => undefined);
      }
    } finally {
      setLoading(false);
    }
  }

  function requestDelete(record: MeetingRecord) {
    ask(
      {
        open: true,
        title:
          record._count.attendances > 0
            ? "ยืนยันการเก็บถาวร"
            : "ยืนยันการลบการประชุม",
        description: `${record.meetingCode} - ${record.title}${
          record._count.attendances > 0
            ? " มีผู้ลงทะเบียนแล้ว ระบบจะเก็บรายการนี้ถาวรโดยไม่แสดงในรายการประชุม"
            : ""
        }`,
        kind: "delete",
      },
      async () => {
        setLoading(true);
        try {
          await apiMutation(
            `/api/meetings/${record.id}`,
            "DELETE",
          );
          await onChanged();
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "ลบไม่สำเร็จ",
          );
        } finally {
          setLoading(false);
        }
      },
    );
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setQrImageFiles({});
      setCopying(false);
    }
  }

  return {
    search,
    setSearch,
    projectFilter,
    setProjectFilter,
    formOpen,
    copying,
    handleFormOpenChange,
    attendanceMeeting,
    setAttendanceMeeting,
    mediaMeeting,
    setMediaMeeting,
    editing,
    form,
    setForm,
    qrImageFiles,
    loading,
    error,
    setError,
    confirm,
    setConfirm,
    runPending,
    openCreate,
    handleListAction,
    updateTime,
    changeQrImageFile,
    requestDeleteQrImage,
    requestSave,
  };
}
