"use client";

import { useMemo } from "react";
import {
  CalendarPlus,
  Copy,
  Paperclip,
  Pencil,
  QrCode,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import {
  DataTableControls,
  SortableTableHead,
} from "@/components/shared/data-table-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useDataTable } from "@/hooks/use-data-table";
import { formatThaiDate } from "@/lib/format";
import type { MeetingRecord, ProjectRecord } from "@/types/app";

type MeetingSortKey =
  | "meetingCode"
  | "createdAt"
  | "attendanceCount";

export type MeetingAction =
  | "detail"
  | "attendance"
  | "media"
  | "copy"
  | "edit"
  | "delete";

export function MeetingListSection({
  meetings,
  projects,
  search,
  projectFilter,
  error,
  onSearchChange,
  onProjectFilterChange,
  onCreate,
  onAction,
}: {
  meetings: MeetingRecord[];
  projects: ProjectRecord[];
  search: string;
  projectFilter: string;
  error: string;
  onSearchChange: (value: string) => void;
  onProjectFilterChange: (value: string) => void;
  onCreate: () => void;
  onAction: (action: MeetingAction, record: MeetingRecord) => void;
}) {
  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return meetings.filter(
      (meeting) =>
        (projectFilter === "all" ||
          meeting.projectId === projectFilter) &&
        `${meeting.meetingCode} ${meeting.title} ${meeting.project.name} ${meeting.location}`
          .toLowerCase()
          .includes(query),
    );
  }, [meetings, projectFilter, search]);
  const table = useDataTable<MeetingRecord, MeetingSortKey>({
    items: filtered,
    initialSortKey: "meetingCode",
    initialDirection: "desc",
    getSortValue: (record, key) => {
      if (key === "attendanceCount") {
        return record._count.attendances;
      }
      return record[key];
    },
  });
  const filteredProject = projects.find(
    (project) => project.id === projectFilter,
  );

  return (
    <section aria-labelledby="meetings-heading">
      <div className="mb-5">
        <p className="text-sm font-bold uppercase text-cyan-300">
          Meeting workspace
        </p>
        <h1
          id="meetings-heading"
          className="text-2xl font-bold text-amber-300 sm:text-3xl"
        >
          รายการการประชุม
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          แสดงเฉพาะโครงการที่บัญชีนี้ได้รับสิทธิ์
        </p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
        <Select
          value={projectFilter}
          onValueChange={(value) =>
            onProjectFilterChange(value || "all")
          }
        >
          <SelectTrigger>
            <span className="flex-1 truncate text-left">
              {projectFilter === "all"
                ? "ทุกโครงการ"
                : filteredProject?.code || "ทุกโครงการ"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกโครงการ</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-10 pl-10"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Live Search รหัส หัวข้อ โครงการ หรือสถานที่..."
          />
        </div>
        <Button className="action-add h-10" onClick={onCreate}>
          <CalendarPlus /> สร้างการประชุม
        </Button>
      </div>

      {error && (
        <p className="mb-3 rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <DesktopMeetingTable
        records={table.pageItems}
        sortKey={table.sortKey}
        sortDirection={table.sortDirection}
        onSort={table.toggleSort}
        onAction={onAction}
      />
      <MobileMeetingCards
        records={table.pageItems}
        onAction={onAction}
      />
      <DataTableControls
        totalItems={table.totalItems}
        pageSize={table.pageSize}
        currentPage={table.currentPage}
        totalPages={table.totalPages}
        onPageSizeChange={table.setPageSize}
        onPageChange={table.setPage}
      />
    </section>
  );
}

function DesktopMeetingTable({
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
  onAction: (action: MeetingAction, record: MeetingRecord) => void;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-slate-600/40 lg:block">
      <table className="w-full min-w-[1050px] text-sm">
        <colgroup>
          <col className="w-[150px]" />
          <col className="w-[190px]" />
          <col className="w-[140px]" />
          <col />
          <col className="w-[140px]" />
        </colgroup>
        <thead className="bg-[#071426] text-left text-slate-300">
          <tr>
            <th className="p-3">จัดการ</th>
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
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-t border-slate-700/50 align-top"
            >
              <td className="w-[150px] p-3">
                <MeetingActionButtons
                  record={record}
                  compact
                  onAction={onAction}
                />
              </td>
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
              <td className="p-3">
                {formatThaiDate(record.createdAt)}
              </td>
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
                  {formatThaiDate(record.meetingDate)} ·{" "}
                  {record.startTime}-{record.endTime} · {record.location}
                </p>
                <p className="text-xs text-slate-500">
                  ผู้จัด: {record.organizer.firstName}{" "}
                  {record.organizer.lastName}
                </p>
              </td>
              <td className="w-[140px] p-3">
                <AttendanceCountButton
                  record={record}
                  onAction={onAction}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileMeetingCards({
  records,
  onAction,
}: {
  records: MeetingRecord[];
  onAction: (action: MeetingAction, record: MeetingRecord) => void;
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
            {formatThaiDate(record.meetingDate)} · {record.startTime}-
            {record.endTime}
          </p>
          <p className="text-sm text-slate-400">{record.location}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <span>ผู้ลงทะเบียน</span>
            <AttendanceCountButton
              record={record}
              onAction={onAction}
            />
          </div>
          <MeetingActionButtons
            record={record}
            onAction={onAction}
          />
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
  onAction: (action: MeetingAction, record: MeetingRecord) => void;
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
      <UsersRound
        className="ml-1 inline size-3.5 opacity-70"
        strokeWidth={1.5}
      />
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
  onAction: (action: MeetingAction, record: MeetingRecord) => void;
}) {
  const size = compact ? "icon-sm" : "default";
  return (
    <div
      className={
        compact
          ? "grid w-fit grid-cols-4 gap-1.5"
          : "mt-3 flex flex-wrap gap-2"
      }
    >
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
        onClick={() => onAction("delete", record)}
      >
        <Trash2 /> {!compact && "ลบ"}
      </Button>
    </div>
  );
}
