import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type {
  RegistrationContext,
  RegistrationFormState,
  RegistrationParticipant,
} from "@/components/registration/registration-types";

export function RegistrationParticipantFields({
  context,
  manual,
  participantId,
  selectedParticipant,
  form,
  onToggleManual,
  onParticipantChange,
  onUpdate,
}: {
  context: RegistrationContext;
  manual: boolean;
  participantId: string;
  selectedParticipant?: RegistrationParticipant;
  form: RegistrationFormState;
  onToggleManual: () => void;
  onParticipantChange: (value: string) => void;
  onUpdate: <Key extends keyof RegistrationFormState>(
    key: Key,
    value: RegistrationFormState[Key],
  ) => void;
}) {
  return (
    <>
      {context.channel.mode === "GROUP" && context.channel.group && (
        <section className="space-y-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold">
                เลือกรายชื่อจาก {context.channel.group.name}
              </p>
              <p className="text-xs text-slate-400">
                ค้นหาชื่อด้วยรายการด้านล่าง
              </p>
            </div>
            <Button
              type="button"
              className="action-switch"
              size="sm"
              onClick={onToggleManual}
            >
              <Search /> {manual ? "เลือกจากรายชื่อ" : "ไม่มีชื่อ เพิ่มเอง"}
            </Button>
          </div>
          {!manual && (
            <Select
              value={participantId}
              onValueChange={(value) =>
                onParticipantChange(value || "")
              }
            >
              <SelectTrigger aria-label="เลือกชื่อ-นามสกุล">
                <span className="flex-1 truncate text-left">
                  {selectedParticipant
                    ? `${selectedParticipant.firstName} ${selectedParticipant.lastName} · ${selectedParticipant.position}`
                    : "เลือกชื่อ-นามสกุล"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {context.channel.group.participants.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.firstName} {person.lastName} ·{" "}
                    {person.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </section>
      )}

      {manual && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ชื่อ" required>
            <Input
              aria-label="ชื่อ"
              required
              value={form.firstName}
              onChange={(event) =>
                onUpdate("firstName", event.target.value)
              }
            />
          </Field>
          <Field label="นามสกุล" required>
            <Input
              aria-label="นามสกุล"
              required
              value={form.lastName}
              onChange={(event) =>
                onUpdate("lastName", event.target.value)
              }
            />
          </Field>
          <Field label="ตำแหน่ง" required>
            <Input
              aria-label="ตำแหน่ง"
              required
              value={form.position}
              onChange={(event) =>
                onUpdate("position", event.target.value)
              }
            />
          </Field>
          {context.channel.mode === "OPEN" && (
            <Field label="หน่วยงาน/สังกัด" required>
              <Input
                aria-label="หน่วยงาน/สังกัด"
                required
                value={form.department}
                onChange={(event) =>
                  onUpdate("department", event.target.value)
                }
              />
            </Field>
          )}
          <Field label="โทรศัพท์">
            <Input
              aria-label="โทรศัพท์"
              inputMode="tel"
              value={form.phone}
              onChange={(event) =>
                onUpdate("phone", event.target.value)
              }
            />
          </Field>
          <Field label="E-mail">
            <Input
              aria-label="E-mail"
              type="email"
              value={form.email}
              onChange={(event) =>
                onUpdate("email", event.target.value)
              }
            />
          </Field>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="required-mark">*</span>}
      </Label>
      {children}
    </div>
  );
}
