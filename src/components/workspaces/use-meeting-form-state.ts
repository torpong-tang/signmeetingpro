"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useSearchParams } from "next/navigation";
import { clampRegistrationLimit } from "@/lib/meeting-time";
import type { GroupRecord, MeetingRecord, ProjectRecord } from "@/types/app";
import {
  makeEmptyMeetingForm,
  meetingRecordToForm,
  type MeetingForm,
} from "./meeting-form-model";
import type { QrChannelImageFiles } from "./meeting-qr-images-editor";

export function useMeetingFormState({
  meetings,
  projects,
  groups,
  setError,
}: {
  meetings: MeetingRecord[];
  projects: ProjectRecord[];
  groups: GroupRecord[];
  setError: Dispatch<SetStateAction<string>>;
}) {
  const searchParams = useSearchParams();
  const handledEditId = useRef("");
  const [formOpen, setFormOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [editing, setEditing] = useState<MeetingRecord | null>(null);
  const [form, setForm] = useState<MeetingForm>(() =>
    makeEmptyMeetingForm(projects, groups),
  );
  const [qrImageFiles, setQrImageFiles] = useState<QrChannelImageFiles>({});

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
  }, [meetings, searchParams, setError]);

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

  function changeQrImageFile(channelNo: 1 | 2, file: File | null) {
    setQrImageFiles((current) => {
      const next = { ...current };
      if (file) next[channelNo] = file;
      else delete next[channelNo];
      return next;
    });
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setQrImageFiles({});
      setCopying(false);
    }
  }

  return {
    formOpen,
    copying,
    editing,
    setEditing,
    form,
    setForm,
    qrImageFiles,
    setQrImageFiles,
    setFormOpen,
    setCopying,
    openCreate,
    openEdit,
    openCopy,
    updateTime,
    changeQrImageFile,
    handleFormOpenChange,
  };
}
