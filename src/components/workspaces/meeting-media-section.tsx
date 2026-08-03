"use client";

import type { RefObject } from "react";
import { Download, ExternalLink, FileImage, FileText, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appPath } from "@/lib/app-path";
import { formatLocalizedBuddhistDateTime } from "@/lib/format";
import { translateUiText } from "@/lib/ui-translation-catalog";
import type { MeetingMediaRecord } from "@/types/app";

export type MediaKind = MeetingMediaRecord["kind"];

export function formatMediaBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function MeetingMediaSection({
  kind,
  records,
  file,
  inputRef,
  onFileChange,
  onUpload,
  onDelete,
  locale,
}: {
  kind: MediaKind;
  records: MeetingMediaRecord[];
  file: File | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  onDelete: (record: MeetingMediaRecord) => void;
  locale: "th" | "en";
}) {
  const isPicture = kind === "PICTURE";
  const title = isPicture ? "รูปภาพที่แนบ" : "เอกสารที่แนบ";
  const translate = (value: string) => translateUiText(value, locale);
  const inputId = `meeting-media-${kind.toLowerCase()}`;

  return (
    <section
      className="space-y-4 rounded-lg border border-slate-600/50 bg-[#071426]/60 p-4"
      aria-labelledby={`${inputId}-heading`}
    >
      <div>
        <h3
          id={`${inputId}-heading`}
          className="flex items-center gap-2 font-bold text-cyan-200"
        >
          {isPicture ? <FileImage /> : <FileText />}
          {translate(title)} ({records.length})
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          {translate(
            isPicture
              ? "รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 2 MB ต่อไฟล์"
              : "รองรับ PDF, Word, Excel และ PowerPoint",
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <Input
          ref={inputRef}
          id={inputId}
          type="file"
          aria-label={`เลือก${isPicture ? "รูปภาพ" : "เอกสาร"}`}
          accept={
            isPicture
              ? "image/jpeg,image/png,image/webp"
              : ".pdf,.docx,.xlsx,.pptx"
          }
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        />
        <Button
          type="button"
          className="action-save h-10"
          onClick={onUpload}
          disabled={!file}
        >
          <Upload /> {translate(isPicture ? "อัปโหลดรูปภาพ" : "อัปโหลดเอกสาร")}
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-6 text-center text-slate-400">
          {translate(isPicture ? "ยังไม่มีรูปภาพ" : "ยังไม่มีเอกสาร")}
        </div>
      ) : (
        <div className="grid gap-3">
          {records.map((record) => {
            const downloadUrl = appPath(`/api/media/${record.id}`);
            return (
              <article
                key={record.id}
                className="glass-card flex min-w-0 items-center gap-3 rounded-lg p-3"
              >
                {isPicture ? (
                  <span className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-cyan-400/20 bg-[#05101f] p-1">
                    <Image
                      src={downloadUrl}
                      alt={`รูปตัวอย่าง ${record.originalName}`}
                      width={72}
                      height={48}
                      unoptimized
                      className="h-full w-full object-contain"
                    />
                  </span>
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-cyan-400/10 text-cyan-300">
                    <FileText />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold" title={record.originalName}>
                    {record.originalName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatMediaBytes(record.sizeBytes)} ·{" "}
                    {formatLocalizedBuddhistDateTime(record.createdAt, locale)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  className="action-view"
                  title="เปิดไฟล์"
                  aria-label={`เปิดไฟล์ ${record.originalName}`}
                  onClick={() => window.open(downloadUrl, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  className="action-document"
                  title="ดาวน์โหลดไฟล์"
                  aria-label={`ดาวน์โหลดไฟล์ ${record.originalName}`}
                  onClick={() => {
                    const anchor = document.createElement("a");
                    anchor.href = `${downloadUrl}?download=1`;
                    anchor.click();
                  }}
                >
                  <Download />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  className="action-delete"
                  title="ลบไฟล์"
                  aria-label={`ลบไฟล์ ${record.originalName}`}
                  onClick={() => onDelete(record)}
                >
                  <Trash2 />
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
