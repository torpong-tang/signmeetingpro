"use client";

import type { FormEvent } from "react";
import { CalendarPlus } from "lucide-react";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  allowedRegistrationLimits,
  meetingDurationMinutes,
} from "@/lib/meeting-time";
import type {
  GroupRecord,
  MeetingRecord,
  ProjectRecord,
} from "@/types/app";
import { MeetingChannelsEditor } from "./meeting-channels-editor";
import type { MeetingForm } from "./meeting-form-model";
import {
  MeetingQrImagesEditor,
  type QrChannelImageFiles,
} from "./meeting-qr-images-editor";

export function MeetingFormDialog({
  open,
  editing,
  copying,
  form,
  projects,
  groups,
  qrImageFiles,
  error,
  onOpenChange,
  onFormChange,
  onTimeChange,
  onFileChange,
  onDeleteExistingImage,
  onError,
  onSubmit,
}: {
  open: boolean;
  editing: MeetingRecord | null;
  copying: boolean;
  form: MeetingForm;
  projects: ProjectRecord[];
  groups: GroupRecord[];
  qrImageFiles: QrChannelImageFiles;
  error: string;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: MeetingForm) => void;
  onTimeChange: (
    patch: Pick<Partial<MeetingForm>, "startTime" | "endTime">,
  ) => void;
  onFileChange: (channelNo: 1 | 2, file: File | null) => void;
  onDeleteExistingImage: (channelNo: 1 | 2) => void;
  onError: (message: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const selectedProject = projects.find(
    (project) => project.id === form.projectId,
  );
  const availableGroups = groups.filter((group) => group.active);
  const meetingDuration = meetingDurationMinutes(
    form.startTime,
    form.endTime,
  );
  const registrationLimits = allowedRegistrationLimits(
    form.startTime,
    form.endTime,
    form.registerLimitMinutes,
  );
  const minDate = new Date().toISOString().slice(0, 10);
  const locked = Boolean(editing?._count.attendances);

  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        editing
          ? `แก้ไข ${editing.meetingCode}`
          : "สร้างการประชุมใหม่"
      }
      description={
        locked
          ? "มีผู้ลงทะเบียนแล้ว ระบบอนุญาตให้แก้เฉพาะข้อกำหนดเวลาลงทะเบียน"
          : copying
            ? "สร้างการประชุมซ้ำภายในโครงการเดิม โดยกำหนดวันที่และเวลาใหม่"
          : "รหัสการประชุมจะถูกสร้างหลังบันทึกฐานข้อมูลสำเร็จ"
      }
      className="sm:max-w-5xl"
      footer={
        <Button
          type="submit"
          form="meeting-form"
          className="action-save"
        >
          <CalendarPlus /> บันทึก
        </Button>
      }
    >
      <form
        id="meeting-form"
        className="space-y-6"
        onSubmit={onSubmit}
      >
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>
              โครงการ <span className="required-mark">*</span>
            </Label>
            <Select
              value={form.projectId}
              disabled={locked || copying}
              onValueChange={(projectId) =>
                onFormChange({ ...form, projectId: projectId || "" })
              }
            >
              <SelectTrigger
                aria-label="เลือกโครงการ"
                title={
                  copying
                    ? "การสร้างซ้ำต้องใช้โครงการเดียวกับรายการต้นฉบับ"
                    : undefined
                }
              >
                <span className="flex-1 truncate text-left">
                  {selectedProject
                    ? `${selectedProject.code} - ${selectedProject.name}`
                    : "เลือกโครงการ"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {copying && (
              <p className="text-xs font-medium text-amber-300">
                ล็อกตามโครงการของการประชุมต้นฉบับ
              </p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>
              หัวข้อการประชุม <span className="required-mark">*</span>
            </Label>
            <Input
              required
              disabled={locked}
              value={form.title}
              onChange={(event) =>
                onFormChange({ ...form, title: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>
              วันที่ <span className="required-mark">*</span>
            </Label>
            <DatePickerField
              value={form.meetingDate}
              min={editing ? undefined : minDate}
              required
              disabled={locked}
              onChange={(meetingDate) =>
                onFormChange({ ...form, meetingDate })
              }
              ariaLabel="เลือกวันที่ประชุม"
            />
          </div>
          <div className="space-y-2">
            <Label>
              เวลาเริ่ม <span className="required-mark">*</span>
            </Label>
            <Input
              type="time"
              required
              disabled={locked}
              value={form.startTime}
              max={form.endTime || undefined}
              aria-invalid={!meetingDuration}
              onChange={(event) =>
                onTimeChange({ startTime: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>
              เวลาสิ้นสุด <span className="required-mark">*</span>
            </Label>
            <Input
              type="time"
              required
              disabled={locked}
              value={form.endTime}
              min={form.startTime || undefined}
              aria-invalid={!meetingDuration}
              onChange={(event) =>
                onTimeChange({ endTime: event.target.value })
              }
            />
            {!meetingDuration && (
              <p className="text-xs text-rose-300">
                เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>เวลาลงทะเบียน (นาที)</Label>
            <Select
              disabled={!meetingDuration || !registrationLimits.length}
              value={String(form.registerLimitMinutes)}
              onValueChange={(value) =>
                onFormChange({
                  ...form,
                  registerLimitMinutes: Number(value),
                })
              }
            >
              <SelectTrigger>
                <span className="flex-1 text-left">
                  {meetingDuration
                    ? `${form.registerLimitMinutes} นาที`
                    : "กำหนดช่วงเวลาก่อน"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {registrationLimits.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} นาที
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              {meetingDuration
                ? `ระยะเวลาประชุม ${meetingDuration} นาที เลือกได้สูงสุด ${registrationLimits.at(-1)} นาที`
                : "กรุณากำหนดเวลาเริ่มและเวลาสิ้นสุดให้ถูกต้อง"}
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>
              สถานที่ <span className="required-mark">*</span>
            </Label>
            <Input
              required
              disabled={locked}
              value={form.location}
              onChange={(event) =>
                onFormChange({ ...form, location: event.target.value })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>วาระ/รายละเอียด</Label>
            <Textarea
              disabled={locked}
              value={form.agenda}
              onChange={(event) =>
                onFormChange({ ...form, agenda: event.target.value })
              }
            />
          </div>
        </section>

        <MeetingChannelsEditor
          channels={form.channels}
          groups={availableGroups}
          disabled={locked}
          onChange={(channels) => onFormChange({ ...form, channels })}
        />
        <MeetingQrImagesEditor
          channels={form.channels}
          meeting={editing}
          files={qrImageFiles}
          onFileChange={onFileChange}
          onDeleteExisting={onDeleteExistingImage}
          onError={onError}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.allowLateRegistration}
            onChange={(event) =>
              onFormChange({
                ...form,
                allowLateRegistration: event.target.checked,
              })
            }
          />
          อนุญาตลงทะเบียนเกินเวลา
        </label>
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </form>
    </AdaptiveDialog>
  );
}
