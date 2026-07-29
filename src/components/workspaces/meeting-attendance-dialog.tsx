"use client";

import { Download, LoaderCircle, UsersRound } from "lucide-react";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { Button } from "@/components/ui/button";
import type { MeetingRecord } from "@/types/app";
import { AttendanceChannelSection } from "./attendance-channel-section";
import { orderedChannelAttendances } from "./attendance-dialog-utils";
import { useMeetingAttendance } from "./use-meeting-attendance";

export function MeetingAttendanceDialog({
  meeting,
  onOpenChange,
}: {
  meeting: MeetingRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const attendance = useMeetingAttendance(meeting);

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
          disabled={attendance.loading || attendance.reordering}
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
                disabled={attendance.reordering}
                onMove={(attendanceId, direction) =>
                  attendance.moveAttendance(
                    channel.id,
                    attendanceId,
                    direction,
                  )
                }
              />
            ))}
          </div>
        </>
      )}
    </AdaptiveDialog>
  );
}
