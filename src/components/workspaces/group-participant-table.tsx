"use client";

import { Pencil, Trash2 } from "lucide-react";
import { DataTableControls, SortableTableHead } from "@/components/shared/data-table-controls";
import { Button } from "@/components/ui/button";
import { useDataTable } from "@/hooks/use-data-table";
import type { GroupRecord, ParticipantRecord } from "@/types/app";

type ParticipantSortKey = "name" | "position" | "department" | "contact";

export function GroupParticipantTable({
  group,
  onEdit,
  onDelete,
}: {
  group: GroupRecord;
  onEdit: (group: GroupRecord, person: ParticipantRecord) => void;
  onDelete: (group: GroupRecord, person: ParticipantRecord) => void;
}) {
  const table = useDataTable<ParticipantRecord, ParticipantSortKey>({
    items: group.participants,
    initialSortKey: "name",
    getSortValue: (person, key) => {
      if (key === "name") return `${person.firstName} ${person.lastName}`;
      if (key === "department") return group.name;
      if (key === "contact") return person.email || person.phone;
      return person.position;
    },
  });

  return (
    <>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <SortableTableHead className="p-0 pb-2" label="ชื่อ-นามสกุล" sortKey="name" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead className="p-0 pb-2" label="ตำแหน่ง" sortKey="position" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead className="p-0 pb-2" label="หน่วยงาน" sortKey="department" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead className="p-0 pb-2" label="ติดต่อ" sortKey="contact" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <th className="pb-2">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {table.pageItems.map((person) => (
              <tr key={person.id} className="border-t border-slate-700/50">
                <td className="py-2 font-bold">{person.firstName} {person.lastName}</td>
                <td>{person.position}</td>
                <td>{group.name}</td>
                <td>{person.email || person.phone || "-"}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Button size="icon-sm" className="action-edit" title="แก้ไข" onClick={() => onEdit(group, person)}><Pencil /></Button>
                    <Button size="icon-sm" className="action-delete" title="ลบ" onClick={() => onDelete(group, person)}><Trash2 /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {table.totalItems === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">ยังไม่มีรายชื่อในกลุ่ม</td>
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
    </>
  );
}
