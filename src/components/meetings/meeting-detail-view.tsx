"use client";

import { useState } from "react";
import {
  ArrowLeft,
  LoaderCircle,
  Paperclip,
  Pencil,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmActionDialog, type ConfirmAction } from "@/components/shared/confirm-action-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { Button } from "@/components/ui/button";
import { MeetingAttendanceDialog } from "@/components/workspaces/meeting-attendance-dialog";
import { MeetingMediaDialog } from "@/components/workspaces/meeting-media-dialog";
import { MeetingQrGallery } from "@/components/workspaces/meeting-qr-gallery";
import { apiMutation } from "@/hooks/use-bootstrap";
import { appPath } from "@/lib/app-path";
import { formatThaiDate } from "@/lib/format";
import type { MeetingRecord } from "@/types/app";

const emptyConfirm: ConfirmAction = {
  open: false,
  title: "",
  description: "",
};

export function MeetingDetailView({ meeting }: { meeting: MeetingRecord }) {
  const router = useRouter();
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction>(emptyConfirm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openEdit() {
    router.push(appPath(`/meetings?edit=${encodeURIComponent(meeting.id)}`));
  }

  function goBackToMeetings() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(appPath("/meetings"));
  }

  function requestDelete() {
    setConfirm({
      open: true,
      title: meeting._count.attendances > 0
        ? "ยืนยันการเก็บการประชุมเป็นรายการถาวร"
        : "ยืนยันการลบการประชุม",
      description: `${meeting.meetingCode} - ${meeting.title}`,
      kind: "delete",
      confirmLabel: meeting._count.attendances > 0 ? "เก็บถาวร" : "ลบการประชุม",
    });
  }

  async function deleteMeeting() {
    setConfirm((current) => ({ ...current, open: false }));
    setLoading(true);
    setError("");
    try {
      await apiMutation(`/api/meetings/${meeting.id}`, "DELETE");
      router.replace(appPath("/meetings"));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ลบการประชุมไม่สำเร็จ");
      setLoading(false);
    }
  }

  return (
    <>
      {loading && <LoadingOverlay label="กำลังประมวลผลการประชุม..." />}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" className="action-neutral" onClick={goBackToMeetings}>
          <ArrowLeft /> กลับรายการการประชุม
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="action-attendance" onClick={() => setAttendanceOpen(true)}>
            <UsersRound /> ผู้ลงทะเบียน ({meeting._count.attendances})
          </Button>
          <Button type="button" className="action-document" onClick={() => setMediaOpen(true)}>
            <Paperclip /> ไฟล์ประกอบ
          </Button>
          <Button type="button" className="action-edit" onClick={openEdit}>
            <Pencil /> แก้ไข
          </Button>
          <Button type="button" className="action-delete" onClick={requestDelete}>
            <Trash2 /> ลบ
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 p-4 text-rose-200">
          {error}
        </div>
      )}

      <section className="glass-panel mb-5 rounded-lg p-5 sm:p-7" aria-labelledby="meeting-detail-heading">
        <p className="font-bold text-cyan-300">{meeting.meetingCode} · {meeting.project.code}</p>
        <h1 id="meeting-detail-heading" className="mt-2 text-2xl font-bold sm:text-3xl">{meeting.title}</h1>
        {meeting.agenda && <p className="mt-2 text-slate-300">{meeting.agenda}</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="โครงการ" value={meeting.project.name} />
          <DetailItem label="วันและเวลา" value={`${formatThaiDate(meeting.meetingDate)} · ${meeting.startTime}-${meeting.endTime}`} />
          <DetailItem label="สถานที่" value={meeting.location} />
          <DetailItem label="ผู้จัดการประชุม" value={`${meeting.organizer.firstName} ${meeting.organizer.lastName}`} />
        </div>
      </section>

      <section className="glass-panel rounded-lg p-4 sm:p-6" aria-labelledby="meeting-qr-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase text-cyan-300">Registration channels</p>
            <h2 id="meeting-qr-heading" className="text-xl font-bold text-amber-300">QR Code สำหรับลงทะเบียน</h2>
          </div>
          {loading && <LoaderCircle className="animate-spin text-cyan-300" />}
        </div>
        <MeetingQrGallery meeting={meeting} />
      </section>

      <MeetingAttendanceDialog
        meeting={attendanceOpen ? meeting : null}
        onOpenChange={(open) => setAttendanceOpen(open)}
      />
      <MeetingMediaDialog
        meeting={mediaOpen ? meeting : null}
        onOpenChange={setMediaOpen}
        onChanged={async () => {
          router.refresh();
        }}
      />
      <ConfirmActionDialog
        state={confirm}
        onOpenChange={(open) => setConfirm((current) => ({ ...current, open }))}
        onConfirm={deleteMeeting}
      />
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-cyan-400/15 bg-[#071426]/80 p-3">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-100">{value}</p>
    </div>
  );
}
