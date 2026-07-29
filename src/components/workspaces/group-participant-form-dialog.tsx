"use client";

import { UserPlus } from "lucide-react";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GroupRecord, ParticipantRecord } from "@/types/app";

export type ParticipantFormValues = {
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  email: string;
  active: boolean;
};

export const emptyParticipantForm: ParticipantFormValues = {
  firstName: "",
  lastName: "",
  position: "",
  phone: "",
  email: "",
  active: true,
};

export function participantToForm(person: ParticipantRecord): ParticipantFormValues {
  return {
    firstName: person.firstName,
    lastName: person.lastName,
    position: person.position,
    phone: person.phone || "",
    email: person.email || "",
    active: person.active,
  };
}

export function GroupParticipantFormDialog({
  open,
  onOpenChange,
  group,
  participant,
  values,
  onValuesChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupRecord | null;
  participant: ParticipantRecord | null;
  values: ParticipantFormValues;
  onValuesChange: (values: ParticipantFormValues) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={participant ? "แก้ไขรายชื่อ" : `เพิ่มรายชื่อใน ${group?.name || ""}`}
      footer={<Button form="participant-form" type="submit" className="action-save"><UserPlus /> บันทึก</Button>}
    >
      <form id="participant-form" className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label>ชื่อ <span className="required-mark">*</span></Label>
          <Input required value={values.firstName} onChange={(event) => onValuesChange({ ...values, firstName: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>นามสกุล <span className="required-mark">*</span></Label>
          <Input required value={values.lastName} onChange={(event) => onValuesChange({ ...values, lastName: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>ตำแหน่ง <span className="required-mark">*</span></Label>
          <Input required value={values.position} onChange={(event) => onValuesChange({ ...values, position: event.target.value })} />
        </div>
        <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 sm:col-span-2">
          <p className="text-xs text-cyan-200">หน่วยงาน/สังกัด</p>
          <p className="font-bold text-white">{group?.name || "-"}</p>
          <p className="text-xs text-slate-400">ระบบใช้ชื่อกลุ่มเป็นหน่วยงาน/สังกัดอัตโนมัติ</p>
        </div>
        <div className="space-y-2">
          <Label>โทรศัพท์</Label>
          <Input value={values.phone} onChange={(event) => onValuesChange({ ...values, phone: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input type="email" value={values.email} onChange={(event) => onValuesChange({ ...values, email: event.target.value })} />
        </div>
      </form>
    </AdaptiveDialog>
  );
}
