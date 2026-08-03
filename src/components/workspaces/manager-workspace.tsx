"use client";

import { useEffect, useState } from "react";
import { Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { ConfirmActionDialog, type ConfirmAction } from "@/components/shared/confirm-action-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { PasswordInput } from "@/components/shared/password-input";
import {
  DataTableControls,
  SortableTableHead,
} from "@/components/shared/data-table-controls";
import { apiMutation } from "@/hooks/use-bootstrap";
import { useDataTable } from "@/hooks/use-data-table";
import type { ManagerRecord, ProjectRecord } from "@/types/app";
import { appPath } from "@/lib/app-path";

type ManagerForm = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "ADMIN" | "MEETING_MANAGER";
  active: boolean;
  projectIds: string[];
};

type ManagerSortKey = "name" | "email" | "role" | "projects" | "active";

const empty: ManagerForm = { email: "", password: "", firstName: "", lastName: "", phone: "", role: "MEETING_MANAGER", active: true, projectIds: [] };

export function ManagerWorkspace({ open, onOpenChange, projects }: { open: boolean; onOpenChange: (open: boolean) => void; projects: ProjectRecord[] }) {
  const [records, setRecords] = useState<ManagerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagerRecord | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction>({ open: false, title: "", description: "" });
  const [pending, setPending] = useState<null | (() => Promise<void>)>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(appPath("/api/managers"), { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "โหลดผู้ใช้ไม่สำเร็จ");
      setRecords(json);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "โหลดไม่สำเร็จ"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  function openCreate() { setEditing(null); setForm(empty); setError(""); setFormOpen(true); }
  function openEdit(record: ManagerRecord) {
    setEditing(record);
    setForm({ email: record.email, password: "", firstName: record.firstName, lastName: record.lastName, phone: record.phone || "", role: record.role, active: record.active, projectIds: record.projects.map((item) => item.projectId) });
    setError(""); setFormOpen(true);
  }
  function ask(state: ConfirmAction, action: () => Promise<void>) { setPending(() => action); setConfirm(state); }
  async function runPending() { setConfirm((value) => ({ ...value, open: false })); await pending?.(); }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editing && form.password.length < 12) { setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 12 ตัวอักษร"); return; }
    ask({ open: true, title: editing ? "ยืนยันการแก้ไขผู้จัดการ" : "ยืนยันการเพิ่มผู้จัดการ", description: `${form.firstName} ${form.lastName} (${form.email})`, kind: "save" }, async () => {
      setLoading(true);
      try {
        await apiMutation(editing ? `/api/managers/${editing.id}` : "/api/managers", editing ? "PUT" : "POST", { ...form, phone: form.phone || null, password: form.password || undefined });
        setFormOpen(false); await load();
      } catch (caught) { setError(caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ"); }
      finally { setLoading(false); }
    });
  }

  function remove(record: ManagerRecord) {
    ask({ open: true, title: "ยืนยันการลบบัญชี", description: `${record.firstName} ${record.lastName} (${record.email})`, kind: "delete" }, async () => {
      setLoading(true);
      try { await apiMutation(`/api/managers/${record.id}`, "DELETE"); await load(); }
      catch (caught) { setError(caught instanceof Error ? caught.message : "ลบไม่สำเร็จ"); }
      finally { setLoading(false); }
    });
  }

  const filtered = records.filter((record) => `${record.firstName} ${record.lastName} ${record.email} ${record.projects.map((item) => item.project.code).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const table = useDataTable<ManagerRecord, ManagerSortKey>({
    items: filtered,
    initialSortKey: "name",
    getSortValue: (record, key) => {
      if (key === "name") return `${record.firstName} ${record.lastName}`;
      if (key === "projects") return record.projects.map((item) => item.project.code).join(" ");
      return record[key];
    },
  });

  return (
    <>
      {loading && <LoadingOverlay label="กำลังจัดการบัญชีและสิทธิ์..." />}
      <AdaptiveDialog open={open} onOpenChange={onOpenChange} title="ผู้จัดการประชุม" description="บัญชี Login และ Project Assignment" className="sm:max-w-6xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="h-10 pl-10" placeholder="Live Search ผู้ใช้หรือโครงการ..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><Button className="action-add h-10" onClick={openCreate}><UserPlus /> เพิ่มผู้จัดการ</Button></div>
        {error && <p className="mb-3 rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <div className="overflow-x-auto rounded-lg border border-slate-600/40">
          <table className="min-w-[850px] w-full text-sm">
            <thead className="bg-[#071426] text-left text-slate-300"><tr>
              <SortableTableHead label="ชื่อ" sortKey="name" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead label="E-mail" sortKey="email" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead label="Role" sortKey="role" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead label="โครงการที่รับผิดชอบ" sortKey="projects" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <SortableTableHead label="สถานะ" sortKey="active" activeSortKey={table.sortKey} direction={table.sortDirection} onSort={table.toggleSort} />
              <th className="p-3">จัดการ</th>
            </tr></thead>
            <tbody>{table.pageItems.map((record) => <tr key={record.id} className="border-t border-slate-700/50"><td className="p-3 font-bold">{record.firstName} {record.lastName}</td><td className="p-3">{record.email}</td><td className="p-3">{record.role}</td><td className="p-3">{record.projects.map((item) => item.project.code).join(", ") || "-"}</td><td className="p-3">{record.active ? "ใช้งาน" : "ปิดใช้งาน"}</td><td className="p-3"><div className="flex gap-2"><Button size="icon-sm" className="action-edit" title="แก้ไข" onClick={() => openEdit(record)}><Pencil /></Button><Button size="icon-sm" className="action-delete" title="ลบ" onClick={() => remove(record)}><Trash2 /></Button></div></td></tr>)}</tbody>
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
      </AdaptiveDialog>
      <AdaptiveDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? "แก้ไขผู้จัดการประชุม" : "เพิ่มผู้จัดการประชุม"} description="กำหนดโครงการอย่างน้อยหนึ่งรายการสำหรับ Meeting Manager" footer={<Button type="submit" form="manager-form" className="action-save"><UserPlus /> บันทึก</Button>}>
        <form id="manager-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>ชื่อ <span className="required-mark">*</span></Label><Input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></div>
          <div className="space-y-2"><Label>นามสกุล <span className="required-mark">*</span></Label><Input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></div>
          <div className="space-y-2"><Label>E-mail <span className="required-mark">*</span></Label><Input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
          <div className="space-y-2"><Label>โทรศัพท์</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
          <div className="space-y-2"><Label>{editing ? "รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)" : "รหัสผ่าน"} {!editing && <span className="required-mark">*</span>}</Label><PasswordInput required={!editing} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div>
          <div className="space-y-2"><Label>Role</Label><Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as "ADMIN" | "MEETING_MANAGER" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEETING_MANAGER">Meeting Manager</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></SelectContent></Select></div>
          <fieldset className="space-y-2 sm:col-span-2"><legend className="mb-2 font-bold">Project Assignment</legend><div className="grid gap-2 sm:grid-cols-2">{projects.map((project) => <label key={project.id} className="glass-card flex items-center gap-3 rounded-md p-3"><input type="checkbox" checked={form.projectIds.includes(project.id)} onChange={(event) => setForm({ ...form, projectIds: event.target.checked ? [...form.projectIds, project.id] : form.projectIds.filter((id) => id !== project.id) })} /><span>{project.code} - {project.name}</span></label>)}</div></fieldset>
          {error && <p className="text-sm text-rose-300 sm:col-span-2">{error}</p>}
        </form>
      </AdaptiveDialog>
      <ConfirmActionDialog state={confirm} onOpenChange={(value) => setConfirm((current) => ({ ...current, open: value }))} onConfirm={runPending} />
    </>
  );
}
