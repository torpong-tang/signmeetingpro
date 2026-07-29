"use client";

import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appPath } from "@/lib/app-path";
import { MAX_QR_CHANNEL_IMAGE_BYTES } from "@/lib/qr-channel-image";
import type { MeetingRecord } from "@/types/app";
import type { MeetingChannelForm } from "@/components/workspaces/meeting-channels-editor";

export type QrChannelImageFiles = Partial<Record<1 | 2, File>>;

export function MeetingQrImagesEditor({
  channels,
  meeting,
  files,
  onFileChange,
  onDeleteExisting,
  onError,
}: {
  channels: [MeetingChannelForm, MeetingChannelForm];
  meeting: MeetingRecord | null;
  files: QrChannelImageFiles;
  onFileChange: (channelNo: 1 | 2, file: File | null) => void;
  onDeleteExisting: (channelNo: 1 | 2) => void;
  onError: (message: string) => void;
}) {
  return (
    <section className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
      <div className="mb-4">
        <h3 className="font-bold text-cyan-100">รูปประกอบ QR Code ตาม Channel</h3>
        <p className="text-xs text-slate-400">
          รองรับ JPG, PNG และ WebP สูงสุด 2 MB ต่อ Channel
          รูปจะแสดงร่วมกับ QR Code และหน้าลงทะเบียน
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((channel) => {
          const existing = meeting?.channels.find(
            (item) => item.channelNo === channel.channelNo,
          );
          return (
            <QrChannelImagePicker
              key={channel.channelNo}
              channelNo={channel.channelNo}
              organizationName={
                channel.mode === "GROUP"
                  ? channel.aliasName
                  : "OPEN · ผู้ลงทะเบียนกรอกหน่วยงาน/สังกัดเอง"
              }
              meetingId={meeting?.id || ""}
              hasExistingImage={Boolean(existing?.hasImage)}
              file={files[channel.channelNo]}
              onFileChange={onFileChange}
              onDeleteExisting={onDeleteExisting}
              onError={onError}
            />
          );
        })}
      </div>
    </section>
  );
}

function QrChannelImagePicker({
  channelNo,
  organizationName,
  meetingId,
  hasExistingImage,
  file,
  onFileChange,
  onDeleteExisting,
  onError,
}: {
  channelNo: 1 | 2;
  organizationName: string;
  meetingId: string;
  hasExistingImage: boolean;
  file?: File;
  onFileChange: (channelNo: 1 | 2, file: File | null) => void;
  onDeleteExisting: (channelNo: 1 | 2) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const existingUrl = meetingId && hasExistingImage
    ? appPath(`/api/meetings/${meetingId}/channels/${channelNo}/image`)
    : "";
  const shownUrl = previewUrl || existingUrl;

  function selectFile(nextFile?: File) {
    if (!nextFile) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(nextFile.type)
      || nextFile.size > MAX_QR_CHANNEL_IMAGE_BYTES
      || nextFile.size === 0
    ) {
      onError("รูปประกอบ QR ต้องเป็น JPG, PNG หรือ WebP และมีขนาดไม่เกิน 2 MB");
      return;
    }
    onError("");
    onFileChange(channelNo, nextFile);
  }

  return (
    <article className="rounded-lg border border-slate-600/50 bg-[#08152a]/80 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-100">QR Channel {channelNo}</p>
          <p className="text-sm text-cyan-300">
            {organizationName || "ยังไม่ระบุหน่วยงาน/สังกัด"}
          </p>
        </div>
        <ImagePlus className="size-5 shrink-0 text-cyan-300" />
      </div>
      <div className="mx-auto mb-3 grid h-24 w-full max-w-52 place-items-center overflow-hidden rounded-lg border border-slate-600/60 bg-slate-950/70 p-2">
        {shownUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownUrl}
            alt={`รูปประกอบ QR Channel ${channelNo}`}
            className="block h-auto w-auto max-h-20 max-w-full rounded-md object-contain"
          />
        ) : (
          <p className="text-center text-sm text-slate-400">ยังไม่มีรูปประกอบ</p>
        )}
      </div>
      {file && (
        <p className="mb-3 truncate text-xs text-slate-300">{file.name}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label={`เลือกรูป QR Channel ${channelNo}`}
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="action-image"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus /> {shownUrl ? "เปลี่ยนรูป" : "เลือกรูป"}
        </Button>
        {file && (
          <Button
            type="button"
            className="action-neutral"
            onClick={() => onFileChange(channelNo, null)}
          >
            <X /> ยกเลิกรูปที่เลือก
          </Button>
        )}
        {!file && hasExistingImage && (
          <Button
            type="button"
            className="action-delete"
            onClick={() => onDeleteExisting(channelNo)}
          >
            <Trash2 /> ลบรูปเดิม
          </Button>
        )}
      </div>
    </article>
  );
}
