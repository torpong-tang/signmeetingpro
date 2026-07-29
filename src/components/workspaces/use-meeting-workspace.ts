"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ConfirmAction } from "@/components/shared/confirm-action-dialog";
import { apiMutation } from "@/hooks/use-bootstrap";
import { appPath } from "@/lib/app-path";
import { formatThaiDate } from "@/lib/format";
import { hasDuplicateParticipantGroups } from "@/lib/meeting-channel-policy";
import {
  clampRegistrationLimit,
  meetingDurationMinutes,
} from "@/lib/meeting-time";
import type {
  GroupRecord,
  MeetingRecord,
  ProjectRecord,
} from "@/types/app";
import {
  makeEmptyMeetingForm,
  meetingRecordToForm,
  type MeetingForm,
} from "./meeting-form-model";
import type { MeetingAction } from "./meeting-list-section";
import type { QrChannelImageFiles } from "./meeting-qr-images-editor";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledEditId = useRef("");
  const [search, setSearch] = useState(
    () => searchParams.get("q") || "",
  );
  const [projectFilter, setProjectFilter] = useState(
    () => searchParams.get("project") || "all",
  );
  const [formOpen, setFormOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [attendanceMeeting, setAttendanceMeeting] =
    useState<MeetingRecord | null>(null);
  const [mediaMeeting, setMediaMeeting] =
    useState<MeetingRecord | null>(null);
  const [editing, setEditing] = useState<MeetingRecord | null>(null);
  const [form, setForm] = useState<MeetingForm>(() =>
    makeEmptyMeetingForm(projects, groups),
  );
  const [qrImageFiles, setQrImageFiles] =
    useState<QrChannelImageFiles>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction>({
    open: false,
    title: "",
    description: "",
  });
  const [pending, setPending] = useState<
    null | (() => Promise<void>)
  >(null);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    if (projectFilter !== "all") {
      params.set("project", projectFilter);
    } else {
      params.delete("project");
    }
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`${pathname}${next ? `?${next}` : ""}`, {
        scroll: false,
      });
    }
  }, [pathname, projectFilter, router, search, searchParams]);

  useEffect(() => {
    const editId = searchParams.get("edit") || "";
    if (!editId || handledEditId.current === editId) return;
    const record = meetings.find((meeting) => meeting.id === editId);
    if (!record) return;
    handledEditId.current = editId;
    const timer = window.setTimeout(() => {
      setCopying(false);
      setEditing(record);
      setForm(meetingRecordToForm(record));
      setQrImageFiles({});
      setError("");
      setFormOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [meetings, searchParams]);

  function ask(
    state: ConfirmAction,
    action: () => Promise<void>,
  ) {
    setPending(() => action);
    setConfirm(state);
  }

  async function runPending() {
    setConfirm((value) => ({ ...value, open: false }));
    await pending?.();
  }

  function resetFormUi() {
    setQrImageFiles({});
    setError("");
    setFormOpen(true);
  }

  function openCreate() {
    setCopying(false);
    setEditing(null);
    setForm(makeEmptyMeetingForm(projects, groups));
    resetFormUi();
  }

  function openEdit(record: MeetingRecord) {
    setCopying(false);
    setEditing(record);
    setForm(meetingRecordToForm(record));
    resetFormUi();
  }

  function openCopy(record: MeetingRecord) {
    setCopying(true);
    setEditing(null);
    setForm({
      ...meetingRecordToForm(record),
      meetingDate: "",
      allowLateRegistration: false,
    });
    resetFormUi();
  }

  function openMedia(record: MeetingRecord) {
    setMediaMeeting(record);
  }

  function handleListAction(
    action: MeetingAction,
    record: MeetingRecord,
  ) {
    if (action === "detail") {
      router.push(appPath(`/meetings/${record.id}`));
    } else if (action === "attendance") {
      setAttendanceMeeting(record);
    } else if (action === "media") {
      openMedia(record);
    } else if (action === "copy") {
      openCopy(record);
    } else if (action === "edit") {
      openEdit(record);
    } else {
      requestDelete(record);
    }
  }

  function updateTime(
    patch: Pick<Partial<MeetingForm>, "startTime" | "endTime">,
  ) {
    const nextForm = { ...form, ...patch };
    nextForm.registerLimitMinutes = clampRegistrationLimit(
      nextForm.registerLimitMinutes,
      nextForm.startTime,
      nextForm.endTime,
    );
    setForm(nextForm);
    setError("");
  }

  function changeQrImageFile(
    channelNo: 1 | 2,
    file: File | null,
  ) {
    setQrImageFiles((current) => {
      const next = { ...current };
      if (file) next[channelNo] = file;
      else delete next[channelNo];
      return next;
    });
  }

  async function uploadQrImages(meetingId: string) {
    for (const channelNo of [1, 2] as const) {
      const file = qrImageFiles[channelNo];
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
      changeQrImageFile(channelNo, null);
    }
  }

  function requestDeleteQrImage(channelNo: 1 | 2) {
    if (!editing) return;
    ask(
      {
        open: true,
        title: `ยืนยันการลบรูป QR Channel ${channelNo}`,
        description: `รูปประกอบของ ${form.channels[channelNo - 1].aliasName} จะถูกลบออก`,
        kind: "delete",
        confirmLabel: "ลบรูป",
      },
      async () => {
        setLoading(true);
        setError("");
        try {
          const response = await fetch(
            appPath(
              `/api/meetings/${editing.id}/channels/${channelNo}/image`,
            ),
            { method: "DELETE" },
          );
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(result.error || "ลบรูปไม่สำเร็จ");
          }
          setEditing((current) =>
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
