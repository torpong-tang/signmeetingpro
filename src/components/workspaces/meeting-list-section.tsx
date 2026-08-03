"use client";

import { useMemo } from "react";
import {
  CalendarPlus,
  Search,
} from "lucide-react";
import { DataTableControls } from "@/components/shared/data-table-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useDataTable } from "@/hooks/use-data-table";
import type { MeetingRecord, ProjectRecord } from "@/types/app";
import {
  DesktopMeetingTable,
  MobileMeetingCards,
} from "./meeting-list-views";
import type { MeetingAction, MeetingSortKey } from "./meeting-list-types";

export type { MeetingAction } from "./meeting-list-types";

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
