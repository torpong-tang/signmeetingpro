"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, UserPlus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { ConfirmActionDialog, type ConfirmAction } from "@/components/shared/confirm-action-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import {
  emptyParticipantForm,
  GroupParticipantFormDialog,
  participantToForm,
} from "@/components/workspaces/group-participant-form-dialog";
import { GroupParticipantTable } from "@/components/workspaces/group-participant-table";
import { apiMutation } from "@/hooks/use-bootstrap";
import type { GroupRecord, ParticipantRecord } from "@/types/app";

export function GroupWorkspace({
  open,
  onOpenChange,
  groups,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: GroupRecord[];
  onChanged: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupRecord | null>(null);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupRecord | null>(null);
  const [participantFormOpen, setParticipantFormOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantRecord | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", description: "", active: true });
  const [personForm, setPersonForm] = useState(emptyParticipantForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction>({ open: false, title: "", description: "" });
  const [pending, setPending] = useState<null | (() => Promise<void>)>(null);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return groups.filter((group) => `${group.name} ${group.description || ""}`.toLowerCase().includes(query));
  }, [groups, search]);

  function ask(state: ConfirmAction, action: () => Promise<void>) {
    setPending(() => action);
    setConfirm(state);
  }

  async function runPending() {
    setConfirm((value) => ({ ...value, open: false }));
    await pending?.();
  }

  function openGroupCreate() {
    setEditingGroup(null);
    setGroupForm({ name: "", description: "", active: true });
    setGroupFormOpen(true);
  }

  function openGroupEdit(group: GroupRecord) {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || "",
      active: group.active,
    });
    setGroupFormOpen(true);
  }

  function saveGroup(event: React.FormEvent) {
    event.preventDefault();
    ask({
      open: true,
      title: editingGroup ? "ยืนยันการแก้ไขกลุ่ม" : "ยืนยันการเพิ่มกลุ่ม",
      description: groupForm.name,
      kind: "save",
    }, async () => {
      setLoading(true);
      try {
        await apiMutation(
          editingGroup ? `/api/groups/${editingGroup.id}` : "/api/groups",
          editingGroup ? "PUT" : "POST",
          groupForm,
        );
        setGroupFormOpen(false);
        setEditingGroup(null);
        await onChanged();
      } catch (caught) { setError(caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ"); }
      finally { setLoading(false); }
    });
  }

  function openPerson(group: GroupRecord, person?: ParticipantRecord) {
    setSelectedGroup(group);
    setEditingParticipant(person || null);
    setPersonForm(person ? participantToForm(person) : emptyParticipantForm);
    setParticipantFormOpen(true);
  }

  function savePerson(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedGroup) return;
    ask({ open: true, title: editingParticipant ? "ยืนยันการแก้ไขรายชื่อ" : "ยืนยันการเพิ่มรายชื่อ", description: `${personForm.firstName} ${personForm.lastName}`, kind: "save" }, async () => {
      setLoading(true);
      try {
        await apiMutation(editingParticipant ? `/api/participants/${editingParticipant.id}` : `/api/groups/${selectedGroup.id}/participants`, editingParticipant ? "PUT" : "POST", {
          ...personForm,
          department: selectedGroup.name,
          phone: personForm.phone || null,
          email: personForm.email || null,
        });
        setParticipantFormOpen(false);
        await onChanged();
      } catch (caught) { setError(caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ"); }
      finally { setLoading(false); }
    });
  }

  function deletePerson(group: GroupRecord, person: ParticipantRecord) {
    ask({ open: true, title: "ยืนยันการลบรายชื่อ", description: `${person.firstName} ${person.lastName} จากกลุ่ม ${group.name}`, kind: "delete" }, async () => {
      setLoading(true);
      try { await apiMutation(`/api/participants/${person.id}`, "DELETE"); await onChanged(); }
      catch (caught) { setError(caught instanceof Error ? caught.message : "ลบไม่สำเร็จ"); }
      finally { setLoading(false); }
    });
  }

  return (
    <>
      {loading && <LoadingOverlay label="กำลังปรับปรุงกลุ่มผู้เข้าร่วม..." />}
      <AdaptiveDialog open={open} onOpenChange={onOpenChange} title="กลุ่มและผู้เข้าร่วมประชุม" description="Master data สำหรับ QR แบบเลือกชื่อ" className="sm:max-w-6xl">
        <div className="mb-4 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          กลุ่มผู้เข้าร่วมเป็นข้อมูลกลาง ใช้ได้กับทุกโครงการและทุกการประชุม
        </div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="h-10 pl-10" placeholder="Live Search กลุ่มหรือรายชื่อ..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <Button className="action-add h-10" onClick={openGroupCreate}><UsersRound /> เพิ่มกลุ่ม</Button>
        </div>
        {error && <p className="mb-3 rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <div className="grid gap-3">
          {filtered.map((group) => (
            <article key={group.id} className="glass-card rounded-lg p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><p className="text-xs font-bold uppercase text-cyan-300">Global participant group</p><h3 className="text-lg font-bold">{group.name}</h3><p className="text-sm text-slate-400">{group._count.participants} รายชื่อ</p></div>
                <div className="flex flex-wrap gap-2">
                  <Button className="action-edit" onClick={() => openGroupEdit(group)} title={`แก้ไขกลุ่ม ${group.name}`}>
                    <Pencil /> แก้ไขกลุ่ม
                  </Button>
                  <Button className="action-add" onClick={() => openPerson(group)}><UserPlus /> เพิ่มรายชื่อ</Button>
                </div>
              </div>
              <GroupParticipantTable group={group} onEdit={openPerson} onDelete={deletePerson} />
            </article>
          ))}
        </div>
      </AdaptiveDialog>

      <AdaptiveDialog
        open={groupFormOpen}
        onOpenChange={(nextOpen) => {
          setGroupFormOpen(nextOpen);
          if (!nextOpen) setEditingGroup(null);
        }}
        title={editingGroup ? `แก้ไขกลุ่ม ${editingGroup.name}` : "เพิ่มกลุ่มผู้เข้าร่วม"}
        footer={
          <Button form="group-form" type="submit" className="action-save">
            {editingGroup ? <Pencil /> : <UsersRound />} บันทึก
          </Button>
        }
      >
        <form id="group-form" className="space-y-4" onSubmit={saveGroup}>
          <div className="space-y-2"><Label>ชื่อกลุ่ม <span className="required-mark">*</span></Label><Input required value={groupForm.name} onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })} /></div>
          <div className="space-y-2"><Label>รายละเอียด</Label><Input value={groupForm.description} onChange={(event) => setGroupForm({ ...groupForm, description: event.target.value })} /></div>
        </form>
      </AdaptiveDialog>

      <GroupParticipantFormDialog
        open={participantFormOpen}
        onOpenChange={setParticipantFormOpen}
        group={selectedGroup}
        participant={editingParticipant}
        values={personForm}
        onValuesChange={setPersonForm}
        onSubmit={savePerson}
      />
      <ConfirmActionDialog state={confirm} onOpenChange={(value) => setConfirm((current) => ({ ...current, open: value }))} onConfirm={runPending} />
    </>
  );
}
