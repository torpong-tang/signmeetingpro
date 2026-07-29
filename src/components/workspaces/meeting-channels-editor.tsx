"use client";

import { QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isGroupAvailableForChannel } from "@/lib/meeting-channel-policy";
import type { GroupRecord } from "@/types/app";

export type MeetingChannelForm = {
  channelNo: 1 | 2;
  mode: "GROUP" | "OPEN";
  groupId: string;
  aliasName: string;
};

export function MeetingChannelsEditor({
  channels,
  groups,
  disabled,
  onChange,
}: {
  channels: [MeetingChannelForm, MeetingChannelForm];
  groups: GroupRecord[];
  disabled: boolean;
  onChange: (channels: [MeetingChannelForm, MeetingChannelForm]) => void;
}) {
  function updateChannel(index: 0 | 1, patch: Partial<MeetingChannelForm>) {
    const next = [...channels] as [MeetingChannelForm, MeetingChannelForm];
    next[index] = { ...next[index], ...patch };
    if (next[index].mode === "OPEN") next[index].groupId = "";
    onChange(next);
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {channels.map((channel, rawIndex) => {
        const index = rawIndex as 0 | 1;
        const selectableGroups = groups.filter((group) =>
          isGroupAvailableForChannel(group.id, channels, index),
        );
        const selectedGroup = groups.find((group) => group.id === channel.groupId);

        return (
          <div key={channel.channelNo} className="glass-card rounded-lg p-4">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-cyan-300">
              <QrCode /> QR Channel {channel.channelNo}
            </h3>
            <div className="space-y-4">
              {index === 1 && (
                <div className="space-y-2">
                  <Label>รูปแบบการลงทะเบียน</Label>
                  <Select
                    disabled={disabled}
                    value={channel.mode}
                    onValueChange={(value) => {
                      const mode = value as "GROUP" | "OPEN";
                      if (mode === channel.mode) return;
                      updateChannel(1, {
                        mode,
                        groupId: "",
                        aliasName: "",
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GROUP">ระบุกลุ่ม</SelectItem>
                      <SelectItem value="OPEN">กรอกข้อมูลเอง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {channel.mode === "GROUP" && (
                <div className="space-y-2">
                  <Label>กลุ่มผู้เข้าร่วม <span className="required-mark">*</span></Label>
                  <Select
                    disabled={disabled}
                    value={channel.groupId}
                    onValueChange={(value) => {
                      const group = groups.find((item) => item.id === value);
                      updateChannel(index, {
                        groupId: value || "",
                        aliasName: group?.name || channel.aliasName,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <span className="flex-1 truncate text-left">
                        {selectedGroup?.name || "เลือกกลุ่ม"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {selectableGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {channel.mode === "GROUP" ? (
                <div className="space-y-2">
                  <Label>ชื่อหน่วยงาน/สังกัด <span className="required-mark">*</span></Label>
                  <Input
                    required
                    disabled={disabled || !channel.groupId}
                    value={channel.aliasName}
                    placeholder={
                      !channel.groupId
                        ? "เลือกกลุ่มผู้เข้าร่วมก่อน"
                        : "ระบุชื่อหน่วยงาน/สังกัด"
                    }
                    onChange={(event) => updateChannel(index, { aliasName: event.target.value })}
                  />
                  <p className="text-xs text-slate-400">
                    ใช้เป็นหน่วยงาน/สังกัดของผู้ลงทะเบียนผ่าน QR Channel นี้
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-cyan-400/25 bg-cyan-400/5 p-3 text-sm text-slate-300">
                  ผู้ลงทะเบียนแบบ OPEN จะกรอกชื่อหน่วยงาน/สังกัดด้วยตนเองในหน้าลงทะเบียน
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
