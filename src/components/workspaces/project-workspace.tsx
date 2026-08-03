"use client";

import { useMemo, useState } from "react";
import { CalendarDays, FolderPlus, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { ConfirmActionDialog, type ConfirmAction } from "@/components/shared/confirm-action-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { DatePickerField } from "@/components/shared/date-picker-field";
import {
  DataTableControls,
  SortableTableHead,
} from "@/components/shared/data-table-controls";
import { apiMutation } from "@/hooks/use-bootstrap";
import { useDataTable } from "@/hooks/use-data-table";
import { formatThaiDate } from "@/lib/format";
import type { ProjectRecord } from "@/types/app";

type FormState = {
  code: string;
  name: string;
  contractNumber: string;
  contractStart: string;
  contractEnd: string;
  active: boolean;
};

type ProjectSortKey = "code" | "name" | "contractNumber" | "contractStart" | "active";

const emptyForm: FormState = { code: "", name: "", contractNumber: "", contractStart: "", contractEnd: "", active: true };

export function ProjectWorkspace({
  open,
  onOpenChange,
  projects,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectRecord[];
  onChanged: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction>({ open: false, title: "", description: "" });
  const [pendingAction, setPendingAction] = useState<null | (() => Promise<void>)>(null);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return projects.filter((item) => `${item.code} ${item.name} ${item.contractNumber || ""}`.toLowerCase().includes(query));
  }, [projects, search]);
  const table = useDataTable<ProjectRecord, ProjectSortKey>({
    items: filtered,
    initialSortKey: "code",
    getSortValue: (record, key) => {
      if (key === "contractNumber") return record.contractNumber;
      if (key === "contractStart") return record.contractStart;
      return record[key];
    },
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  }

  function openEdit(record: ProjectRecord) {
    setEditingId(record.id);
    setForm({
      code: record.code,
      name: record.name,
      contractNumber: record.contractNumber || "",
      contractStart: record.contractStart?.slice(0, 10) || "",
      contractEnd: record.contractEnd?.slice(0, 10) || "",
      active: record.active,
    });
    setError("");
    setFormOpen(true);
  }

  function requestSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setError("กรุณากรอกรหัสและชื่อโครงการ");
      return;
    }
    setPendingAction(() => async () => {
      setLoading(true);
      try {
        await apiMutation(editingId ? `/api/projects/${editingId}` : "/api/projects", editingId ? "PUT" : "POST", {
          ...form,
          contractNumber: form.contractNumber || null,
          contractStart: form.contractStart || null,
          contractEnd: form.contractEnd || null,
        });
        setFormOpen(false);
        await onChanged();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    });
    setConfirm({
      open: true,
      title: editingId ? "ยืนยันการแก้ไขโครงการ" : "ยืนยันการเพิ่มโครงการ",
      description: `${form.code} - ${form.name}`,
      kind: "save",
      confirmLabel: editingId ? "บันทึกการแก้ไข" : "เพิ่มโครงการ",
    });
  }

  function requestDelete(record: ProjectRecord) {
    setPendingAction(() => async () => {
      setLoading(true);
      try {
        await apiMutation(`/api/projects/${record.id}`, "DELETE");
        await onChanged();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "ลบไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    });
    setConfirm({ open: true, title: "ยืนยันการลบโครงการ", description: `${record.code} - ${record.name}`, kind: "delete", confirmLabel: "ลบโครงการ" });
  }

  async function confirmAction() {
    setConfirm((value) => ({ ...value, open: false }));
    await pendingAction?.();
  }

  return (
    <>
      {loading && <LoadingOverlay label="กำลังบันทึกข้อมูลโครงการ..." />}
      <AdaptiveDialog open={open} onOpenChange={onOpenChange} title="กำหนดโครงการ" description="จัดการโครงการและช่วงสัญญา" className="sm:max-w-5xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Live Search โครงการ..." className="h-10 pl-10" />
          </div>
          <Button type="button" className="action-add h-10" onClick={openCreate}><FolderPlus /> เพิ่มโครงการ</Button>
        </div>
        {error && <p className="mb-3 rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <div className="hidden overflow-hidden rounded-lg border border-slate-600/40 md:block">
          <table className="w-full text-sm">
            <thead className="bg-[#071426] text-left text-slate-300"><tr>
              <SortableTableHead label="รหัส" sortKey="code" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead label="โครงการ" sortKey="name" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead label="สัญญา" sortKey="contractNumber" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead label="ระยะเวลา" sortKey="contractStart" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead label="สถานะ" sortKey="active" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <th className="p-3">จัดการ</th>
            </tr></thead>
            <tbody>
              {table.pageItems.map((record) => (
                <tr key={record.id} className="border-t border-slate-700/50">
                  <td className="p-3 font-bold text-cyan-300">{record.code}</td>
                  <td className="p-3">{record.name}</td>
                  <td className="p-3">{record.contractNumber || "-"}</td>
                  <td className="p-3">{formatThaiDate(record.contractStart)} - {formatThaiDate(record.contractEnd)}</td>
                  <td className="p-3">{record.active ? "ใช้งาน" : "ปิดใช้งาน"}</td>
                  <td className="p-3"><div className="flex gap-2"><Button size="icon-sm" className="action-edit" title="แก้ไข" onClick={() => openEdit(record)}><Pencil /></Button><Button size="icon-sm" className="action-delete" title="ลบ" onClick={() => requestDelete(record)}><Trash2 /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 md:hidden">
          {table.pageItems.map((record) => (
            <article key={record.id} className="glass-card rounded-lg p-4">
              <div className="flex justify-between gap-3"><div><strong className="text-cyan-300">{record.code}</strong><p>{record.name}</p></div><CalendarDays className="text-amber-300" /></div>
              <p className="mt-2 text-sm text-slate-400">{formatThaiDate(record.contractStart)} - {formatThaiDate(record.contractEnd)}</p>
              <div className="mt-3 flex gap-2"><Button className="action-edit" onClick={() => openEdit(record)}><Pencil /> แก้ไข</Button><Button className="action-delete" onClick={() => requestDelete(record)}><Trash2 /> ลบ</Button></div>
            </article>
          ))}
        </div>
        <DataTableControls
          totalItems={table.totalItems}
          pageSize={table.pageSize}
          currentPage={table.currentPage}
          totalPages={table.totalPages}
          onPageSizeChange={table.setPageSize}
          onPageChange={table.setPage}
        />
      </AdaptiveDialog>

      <AdaptiveDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingId ? "แก้ไขโครงการ" : "เพิ่มโครงการ"}
        description="ช่องที่มี * จำเป็นต้องกรอก"
        footer={<Button type="submit" form="project-form" className="action-save"><FolderPlus /> บันทึก</Button>}
      >
        <form id="project-form" className="grid gap-4 sm:grid-cols-2" onSubmit={requestSave}>
          <div className="space-y-2"><Label>รหัสโครงการ <span className="required-mark">*</span></Label><Input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /></div>
          <div className="space-y-2"><Label>ชื่อโครงการ <span className="required-mark">*</span></Label><Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>เลขที่สัญญา</Label><Input value={form.contractNumber} onChange={(event) => setForm({ ...form, contractNumber: event.target.value })} /></div>
          <div className="space-y-2">
            <Label>วันเริ่มสัญญา</Label>
            <DatePickerField
              value={form.contractStart}
              max={form.contractEnd || undefined}
              onChange={(value) => setForm({ ...form, contractStart: value })}
              ariaLabel="เลือกวันเริ่มสัญญา"
            />
          </div>
          <div className="space-y-2">
            <Label>วันสิ้นสุดสัญญา</Label>
            <DatePickerField
              value={form.contractEnd}
              min={form.contractStart || undefined}
              onChange={(value) => setForm({ ...form, contractEnd: value })}
              ariaLabel="เลือกวันสิ้นสุดสัญญา"
            />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> ใช้งาน</label>
          {error && <p className="text-sm text-rose-300 sm:col-span-2">{error}</p>}
        </form>
      </AdaptiveDialog>
      <ConfirmActionDialog state={confirm} onOpenChange={(value) => setConfirm((current) => ({ ...current, open: value }))} onConfirm={confirmAction} />
    </>
  );
}
