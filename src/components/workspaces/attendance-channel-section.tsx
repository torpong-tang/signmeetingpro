"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp, Pencil, QrCode, Trash2 } from "lucide-react";
import { useUiPreferences } from "@/components/app/ui-preferences-provider";
import {
  DataTableControls,
  SortableTableHead,
} from "@/components/shared/data-table-controls";
import { Button } from "@/components/ui/button";
import { useDataTable } from "@/hooks/use-data-table";
import { formatLocalizedBuddhistDateTime } from "@/lib/format";
import type { AttendanceRecord } from "@/types/app";
import type {
  AttendanceChannel,
  AttendanceSortKey,
} from "./attendance-dialog-types";
import { effectiveAttendanceOrder } from "./attendance-dialog-utils";

export function AttendanceChannelSection({
  channel,
  attendances,
  disabled,
  onMove,
  onEdit,
  onDelete,
}: {
  channel: AttendanceChannel;
  attendances: AttendanceRecord[];
  disabled: boolean;
  onMove: (attendanceId: string, direction: -1 | 1) => void;
  onEdit: (attendance: AttendanceRecord, channel: AttendanceChannel) => void;
  onDelete: (attendance: AttendanceRecord) => void;
}) {
  const { locale } = useUiPreferences();
  const table = useDataTable<AttendanceRecord, AttendanceSortKey>({
    items: attendances,
    initialSortKey: "order",
    getSortValue: (attendance, key) => {
      if (key === "order") {
        return effectiveAttendanceOrder(attendance);
      }
      if (key === "name") {
        return `${attendance.firstNameSnapshot} ${attendance.lastNameSnapshot}`;
      }
      if (key === "position") {
        return `${attendance.positionSnapshot} ${attendance.departmentSnapshot || ""}`;
      }
      if (key === "channel") return attendance.channel.aliasName;
      return attendance.registeredAt;
    },
  });
  const manualPositions = useMemo(
    () =>
      new Map(
        attendances.map((attendance, index) => [
          attendance.id,
          index,
        ]),
      ),
    [attendances],
  );

  function move(attendanceId: string, direction: -1 | 1) {
    table.setSort("order", "asc");
    onMove(attendanceId, direction);
  }

  return (
    <section
      className="rounded-lg border border-cyan-400/20 bg-[#0b1930]/65 p-3 sm:p-4"
      aria-labelledby={`attendance-channel-${channel.channelNo}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase text-cyan-300">
            <QrCode className="size-4" />
            QR Channel {channel.channelNo}
          </p>
          <h3
            id={`attendance-channel-${channel.channelNo}`}
            className="mt-1 text-lg font-bold text-amber-300"
          >
            {channel.aliasName || `QR Channel ${channel.channelNo}`}
          </h3>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-bold text-cyan-100">
          {attendances.length} คน
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-600/40">
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="bg-[#071426] text-left text-slate-300">
            <tr>
              <th scope="col" className="p-3 text-center">
                จัดลำดับ PDF
              </th>
              <SortableTableHead
                className="text-center"
                label="ลำดับ"
                sortKey="order"
                activeSortKey={table.sortKey}
                direction={table.sortDirection}
                onSort={table.toggleSort}
              />
              <SortableTableHead
                label="ชื่อ-นามสกุล"
                sortKey="name"
                activeSortKey={table.sortKey}
                direction={table.sortDirection}
                onSort={table.toggleSort}
              />
              <SortableTableHead
                label="ตำแหน่ง / หน่วยงาน"
                sortKey="position"
                activeSortKey={table.sortKey}
                direction={table.sortDirection}
                onSort={table.toggleSort}
              />
              <SortableTableHead
                label="หน่วยงาน/สังกัด"
                sortKey="channel"
                activeSortKey={table.sortKey}
                direction={table.sortDirection}
                onSort={table.toggleSort}
              />
              <SortableTableHead
                label="ลงทะเบียนเมื่อ"
                sortKey="registeredAt"
                activeSortKey={table.sortKey}
                direction={table.sortDirection}
                onSort={table.toggleSort}
              />
              <th scope="col" className="p-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {table.pageItems.map((attendance) => {
              const manualIndex =
                manualPositions.get(attendance.id) ?? 0;
              return (
                <tr
                  key={attendance.id}
                  className="border-t border-slate-700/50"
                >
                  <td className="p-3">
                    <div className="flex justify-center gap-1.5">
                      <Button
                        type="button"
                        size="icon-sm"
                        className="action-edit"
                        title="เลื่อนขึ้น"
                        aria-label={`เลื่อน ${attendance.firstNameSnapshot} ${attendance.lastNameSnapshot} ขึ้น`}
                        disabled={disabled || manualIndex === 0}
                        onClick={() => move(attendance.id, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        className="action-neutral"
                        title="เลื่อนลง"
                        aria-label={`เลื่อน ${attendance.firstNameSnapshot} ${attendance.lastNameSnapshot} ลง`}
                        disabled={
                          disabled ||
                          manualIndex === attendances.length - 1
                        }
                        onClick={() => move(attendance.id, 1)}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold text-amber-300">
                    {manualIndex + 1}
                  </td>
                  <td className="p-3">
                    {attendance.firstNameSnapshot}{" "}
                    {attendance.lastNameSnapshot}
                  </td>
                  <td className="p-3">
                    <div>{attendance.positionSnapshot}</div>
                    <div className="text-xs text-slate-400">
                      {attendance.departmentSnapshot || "-"}
                    </div>
                  </td>
                  <td className="p-3">
                    {attendance.channel.aliasName}
                  </td>
                  <td className="p-3">
                    {formatLocalizedBuddhistDateTime(attendance.registeredAt, locale)}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        size="icon-sm"
                        className="action-edit"
                        title="แก้ไขผู้ลงทะเบียน"
                        aria-label={`แก้ไข ${attendance.firstNameSnapshot} ${attendance.lastNameSnapshot}`}
                        disabled={disabled}
                        onClick={() => onEdit(attendance, channel)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        className="action-delete"
                        title="ลบผู้ลงทะเบียน"
                        aria-label={`ลบ ${attendance.firstNameSnapshot} ${attendance.lastNameSnapshot}`}
                        disabled={disabled}
                        onClick={() => onDelete(attendance)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {attendances.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-slate-400"
                >
                  ยังไม่มีผู้ลงทะเบียนผ่าน QR Channel{" "}
                  {channel.channelNo}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
