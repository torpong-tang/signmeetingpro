"use client";

import {
  Copy,
  Paperclip,
  Pencil,
  QrCode,
  Trash2,
  UsersRound,
} from "lucide-react";
import { SortableTableHead } from "@/components/shared/data-table-controls";
import { Button } from "@/components/ui/button";
import { formatThaiDate } from "@/lib/format";
import type { MeetingRecord } from "@/types/app";
import type { MeetingAction, MeetingSortKey } from "./meeting-list-types";

type MeetingActionHandler = (
  action: MeetingAction,
  record: MeetingRecord,
) => void;

export function DesktopMeetingTable({
  records,
  sortKey,
  sortDirection,
  onSort,
  onAction,
}: {
  records: MeetingRecord[];
  sortKey: MeetingSortKey;
  sortDirection: "asc" | "desc";
  onSort: (key: MeetingSortKey) => void;
  onAction: MeetingActionHandler;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-slate-600/40 lg:block">
      <table className="w-full min-w-[1050px] text-sm">
        <colgroup>
          <col className="w-[190px]" />
          <col className="w-[140px]" />
          <col />
          <col className="w-[140px]" />
          <col className="w-[150px]" />
        </colgroup>
        <thead className="bg-[#071426] text-left text-slate-300">
          <tr>
            <SortableTableHead
              label="รหัส"
              sortKey="meetingCode"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={onSort}
            />
            <SortableTableHead
              label="สร้างเมื่อ"
              sortKey="createdAt"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={onSort}
            />
            <th className="p-3 font-bold">รายการการประชุม</th>
            <SortableTableHead
              label="ผู้ลงทะเบียน"
              sortKey="attendanceCount"
              activeSortKey={sortKey}
              direction={sortDirection}
              onSort={onSort}
              className="w-[140px]"
            />
            <th className="w-[150px] p-3">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-t border-slate-700/50 align-top"
            >
              <td className="w-[190px] whitespace-nowrap p-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap font-bold text-cyan-300 hover:text-cyan-100 hover:underline"
                  onClick={() => onAction("detail", record)}
                >
                  <span>{record.meetingCode}</span>
                  <QrCode className="size-3.5 opacity-70" strokeWidth={1.5} />
                </button>
              </td>
              <td className="p-3">{formatThaiDate(record.createdAt)}</td>
              <td className="p-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-left hover:text-amber-200 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  title="แก้ไขรายการการประชุม"
                  aria-label={`แก้ไข ${record.meetingCode}`}
                  onClick={() => onAction("edit", record)}
                >
                  <strong className="hover:underline">
                    {record.project.name}
                  </strong>
                  <Pencil className="size-3.5 opacity-70" strokeWidth={1.5} />
                </button>
                <p className="mt-1">{record.title}</p>
                <p className="mt-1 text-slate-400">
                  {formatThaiDate(record.meetingDate)} · {record.startTime}-
                  {record.endTime} · {record.location}
                </p>
                <p className="text-xs text-slate-500">
                  ผู้จัด: {record.organizer.firstName} {record.organizer.lastName}
                </p>
              </td>
              <td className="w-[140px] p-3">
                <AttendanceCountButton record={record} onAction={onAction} />
              </td>
              <td className="w-[150px] p-3">
                <MeetingActionButtons record={record} compact onAction={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MobileMeetingCards({
  records,
  onAction,
}: {
  records: MeetingRecord[];
  onAction: MeetingActionHandler;
}) {
  return (
    <div className="grid gap-3 lg:hidden">
      {records.map((record) => (
        <article key={record.id} className="glass-card rounded-lg p-4">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-left text-sm font-bold text-cyan-300 hover:text-cyan-100 hover:underline"
            onClick={() => onAction("detail", record)}
          >
            <span>{record.meetingCode}</span>
            <QrCode className="size-3.5 opacity-70" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="mt-1 inline-flex items-center gap-1.5 text-left font-bold hover:text-amber-200 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            title="แก้ไขรายการการประชุม"
            aria-label={`แก้ไข ${record.meetingCode}`}
            onClick={() => onAction("edit", record)}
          >
            <span>{record.project.name}</span>
            <Pencil className="size-3.5 opacity-70" strokeWidth={1.5} />
          </button>
          <h3>{record.title}</h3>
          <p className="mt-2 text-sm text-slate-400">
            {formatThaiDate(record.meetingDate)} · {record.startTime}-{record.endTime}
          </p>
          <p className="text-sm text-slate-400">{record.location}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <span>ผู้ลงทะเบียน</span>
            <AttendanceCountButton record={record} onAction={onAction} />
          </div>
          <MeetingActionButtons record={record} onAction={onAction} />
        </article>
      ))}
    </div>
  );
}

function AttendanceCountButton({
  record,
  onAction,
}: {
  record: MeetingRecord;
  onAction: MeetingActionHandler;
}) {
  const attendanceCount = record._count.attendances;
  return (
    <button
      type="button"
      className="font-bold text-cyan-300 hover:text-cyan-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      title="เปิดรายชื่อผู้ลงทะเบียน"
      aria-label={`เปิดผู้ลงทะเบียน ${attendanceCount} คน`}
      onClick={() => onAction("attendance", record)}
    >
      <span>{attendanceCount}</span>
      <UsersRound className="ml-1 inline size-3.5 opacity-70" strokeWidth={1.5} />
    </button>
  );
}

function MeetingActionButtons({
  record,
  compact = false,
  onAction,
}: {
  record: MeetingRecord;
  compact?: boolean;
  onAction: MeetingActionHandler;
}) {
  const size = compact ? "icon-sm" : "default";
  return (
    <div className={compact ? "grid w-fit grid-cols-3 gap-1.5" : "mt-3 flex flex-wrap gap-2"}>
      <Button
        size={size}
        className="action-document"
        title="ไฟล์ประกอบ"
        aria-label="จัดการไฟล์ประกอบ"
        onClick={() => onAction("media", record)}
      >
        <Paperclip /> {!compact && "ไฟล์ประกอบ"}
      </Button>
      <Button
        size={size}
        className="action-copy"
        title="สร้างซ้ำ"
        aria-label="สร้างการประชุมซ้ำ"
        onClick={() => onAction("copy", record)}
      >
        <Copy /> {!compact && "สร้างซ้ำ"}
      </Button>
      <Button
        size={size}
        className="action-delete"
        title="ลบ"
        aria-label="ลบการประชุม"
        onClick={() => onAction("delete", record)}
      >
        <Trash2 /> {!compact && "ลบ"}
      </Button>
    </div>
  );
}
