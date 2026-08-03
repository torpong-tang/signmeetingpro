"use client";

import { useState } from "react";
import { Download, LoaderCircle, UsersRound } from "lucide-react";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { ConfirmActionDialog, type ConfirmAction } from "@/components/shared/confirm-action-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { Button } from "@/components/ui/button";
import type { AttendanceRecord, MeetingRecord } from "@/types/app";
import { AttendanceEditDialog, type AttendanceEditValues } from "./attendance-edit-dialog";
import { AttendanceChannelSection } from "./attendance-channel-section";
import type { AttendanceChannel } from "./attendance-dialog-types";
import { orderedChannelAttendances } from "./attendance-dialog-utils";
import { useMeetingAttendance } from "./use-meeting-attendance";

export function MeetingAttendanceDialog({
  meeting,
  onOpenChange,
  onChanged,
}: {
  meeting: MeetingRecord | null;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => Promise<void>;
}) {
  const attendance = useMeetingAttendance(meeting);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [editingChannel, setEditingChannel] = useState<AttendanceChannel | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction>({ open: false, title: "", description: "" });
  const [pending, setPending] = useState<null | (() => Promise<void>)>(null);

  function ask(state: ConfirmAction, action: () => Promise<void>) {
    setPending(() => action);
    setConfirm(state);
  }

  async function runPending() {
    setConfirm((current) => ({ ...current, open: false }));
    await pending?.();
  }

  function openEdit(record: AttendanceRecord, channel: AttendanceChannel) {
    setEditing(record);
    setEditingChannel(channel);
  }

  function requestUpdate(values: AttendanceEditValues) {
    if (!editing) return;
    ask({
      open: true,
      title: "ยืนยันการแก้ไขผู้ลงทะเบียน",
      description: `${values.firstName} ${values.lastName} · ข้อมูลการลงทะเบียนลำดับ ${editing.personNo}`,
      kind: "save",
      confirmLabel: "บันทึกการแก้ไข",
    }, async () => {
      const updated = await attendance.updateAttendance(editing.id, values);
      if (updated) {
        setEditing(null);
        setEditingChannel(null);
      }
    });
  }

  function requestDelete(record: AttendanceRecord) {
    ask({
      open: true,
      title: "ยืนยันการลบผู้ลงทะเบียน",
      description: `ลำดับ ${record.personNo} · ${record.firstNameSnapshot} ${record.lastNameSnapshot} รายการและลายเซ็นจะถูกลบถาวร`,
      kind: "delete",
      confirmLabel: "ลบผู้ลงทะเบียน",
    }, async () => {
      const deleted = await attendance.deleteAttendance(record);
      if (deleted) await onChanged?.();
    });
  }

  return (
    <AdaptiveDialog
      open={Boolean(meeting)}
      onOpenChange={onOpenChange}
      title={
        meeting
          ? `ผู้ลงทะเบียน ${meeting.meetingCode}`
          : "ผู้ลงทะเบียน"
      }
      description={meeting?.title}
      className="sm:max-w-6xl"
      footer={
        <Button
          type="button"
          className="action-document"
          disabled={attendance.loading || attendance.reordering || attendance.mutating}
          onClick={attendance.exportPortraitPdf}
        >
          <Download />
          Export PDF
        </Button>
      }
    >
      {attendance.reordering && (
        <LoadingOverlay label="กำลังบันทึกลำดับรายชื่อสำหรับ PDF..." />
      )}
      {attendance.mutating && (
        <LoadingOverlay label="กำลังบันทึกข้อมูลผู้ลงทะเบียน..." />
      )}

      {attendance.loading && (
        <div className="flex min-h-40 items-center justify-center gap-3 text-slate-300">
          <LoaderCircle className="size-5 animate-spin text-cyan-300" />
          กำลังโหลดรายชื่อ...
        </div>
      )}

      {!attendance.loading && attendance.error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 p-4 text-rose-200"
        >
          {attendance.error}
        </div>
      )}

      {!attendance.loading && attendance.data && (
        <>
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
            <UsersRound className="size-4 text-emerald-300" />
            พบผู้ลงทะเบียนทั้งหมด{" "}
            <strong className="text-amber-300">
              {attendance.data.attendances.length}
            </strong>{" "}
            คน
          </div>

          <div className="space-y-5">
            {attendance.channels.map((channel) => (
              <AttendanceChannelSection
                key={channel.id}
                channel={channel}
                attendances={orderedChannelAttendances(
                  attendance.data!.attendances,
                  channel.id,
                )}
                disabled={attendance.reordering || attendance.mutating}
                onMove={(attendanceId, direction) =>
                  attendance.moveAttendance(
                    channel.id,
                    attendanceId,
                    direction,
                  )
                }
                onEdit={openEdit}
                onDelete={requestDelete}
              />
            ))}
          </div>
        </>
      )}

      <AttendanceEditDialog
        attendance={editing}
        channel={editingChannel}
        disabled={attendance.mutating}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setEditingChannel(null);
          }
        }}
        onSubmit={requestUpdate}
      />
      <ConfirmActionDialog
        state={confirm}
        onOpenChange={(open) => setConfirm((current) => ({ ...current, open }))}
        onConfirm={runPending}
      />
    </AdaptiveDialog>
  );
}
