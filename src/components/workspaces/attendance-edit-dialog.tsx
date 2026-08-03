"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLocalizedBuddhistDateTime } from "@/lib/format";
import { useUiPreferences } from "@/components/app/ui-preferences-provider";
import type { AttendanceRecord } from "@/types/app";
import type { AttendanceChannel } from "./attendance-dialog-types";

export type AttendanceEditValues = {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  phone: string;
  email: string;
};

export function AttendanceEditDialog({
  attendance,
  channel,
  disabled,
  onOpenChange,
  onSubmit,
}: {
  attendance: AttendanceRecord | null;
  channel: AttendanceChannel | null;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AttendanceEditValues) => void;
}) {
  return (
    <AdaptiveDialog
      open={Boolean(attendance)}
      onOpenChange={onOpenChange}
      title="แก้ไขผู้ลงทะเบียน"
      description="แก้ไขเฉพาะข้อมูลที่ใช้แสดงและออกรายงาน โดยไม่เปลี่ยน QR Channel เลขลำดับ หรือเวลาลงทะเบียน"
      footer={
        <Button type="submit" form="attendance-edit-form" className="action-save" disabled={disabled}>
          <Pencil /> บันทึกการแก้ไข
        </Button>
      }
    >
      {attendance && channel && (
        <AttendanceEditForm
          key={attendance.id}
          attendance={attendance}
          channel={channel}
          onSubmit={onSubmit}
        />
      )}
    </AdaptiveDialog>
  );
}

function AttendanceEditForm({
  attendance,
  channel,
  onSubmit,
}: {
  attendance: AttendanceRecord;
  channel: AttendanceChannel;
  onSubmit: (values: AttendanceEditValues) => void;
}) {
  const { locale } = useUiPreferences();
  const [values, setValues] = useState<AttendanceEditValues>(() => ({
    firstName: attendance.firstNameSnapshot,
    lastName: attendance.lastNameSnapshot,
    position: attendance.positionSnapshot,
    department: attendance.departmentSnapshot || "",
    phone: attendance.phoneSnapshot || "",
    email: attendance.emailSnapshot || "",
  }));
  const groupRegistration = channel.mode === "GROUP";

  return (
    <form
      id="attendance-edit-form"
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100 sm:col-span-2">
        QR Channel {channel.channelNo} · ลำดับลงทะเบียน {attendance.personNo} · {formatLocalizedBuddhistDateTime(attendance.registeredAt, locale)}
      </div>
      <Field id="attendance-first-name" label="ชื่อ" required>
        <Input id="attendance-first-name" required maxLength={100} value={values.firstName} onChange={(event) => setValues({ ...values, firstName: event.target.value })} />
      </Field>
      <Field id="attendance-last-name" label="นามสกุล" required>
        <Input id="attendance-last-name" required maxLength={100} value={values.lastName} onChange={(event) => setValues({ ...values, lastName: event.target.value })} />
      </Field>
      <Field id="attendance-position" label="ตำแหน่ง" required>
        <Input id="attendance-position" required maxLength={150} value={values.position} onChange={(event) => setValues({ ...values, position: event.target.value })} />
      </Field>
      <Field id="attendance-department" label="หน่วยงาน/สังกัด" required>
        <Input
          id="attendance-department"
          required
          disabled={groupRegistration}
          maxLength={200}
          value={groupRegistration ? channel.aliasName : values.department}
          onChange={(event) => setValues({ ...values, department: event.target.value })}
        />
        {groupRegistration && <p className="text-xs text-slate-400">กำหนดอัตโนมัติตามชื่อหน่วยงาน/สังกัดของ QR Channel</p>}
      </Field>
      <Field id="attendance-phone" label="โทรศัพท์">
        <Input id="attendance-phone" type="tel" maxLength={50} value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
      </Field>
      <Field id="attendance-email" label="E-mail">
        <Input id="attendance-email" type="email" maxLength={200} value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
      </Field>
      <div className="rounded-lg border border-slate-600/40 bg-slate-900/30 p-3 text-xs text-slate-400 sm:col-span-2">
        ลายเซ็นเดิม, การประชุม, QR Channel, ลำดับ PDF และเวลาลงทะเบียนจะไม่ถูกแก้ไข
      </div>
    </form>
  );
}

function Field({ id, label, required, children }: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} {required && <span className="required-mark">*</span>}</Label>
      {children}
    </div>
  );
}
