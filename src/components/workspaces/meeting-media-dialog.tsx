"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Download, ExternalLink, FileImage, FileText, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { ConfirmActionDialog, type ConfirmAction } from "@/components/shared/confirm-action-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appPath } from "@/lib/app-path";
import { formatThaiDate } from "@/lib/format";
import type { MeetingMediaRecord, MeetingRecord } from "@/types/app";

type MediaKind = MeetingMediaRecord["kind"];

const emptyConfirmation: ConfirmAction = {
  open: false,
  title: "",
  description: "",
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

async function readJson(response: Response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "ดำเนินการไฟล์ไม่สำเร็จ");
  return result;
}

export function MeetingMediaDialog({
  meeting,
  onOpenChange,
  onChanged,
}: {
  meeting: MeetingRecord | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => Promise<void>;
}) {
  const pictureInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<MeetingMediaRecord[]>([]);
  const [files, setFiles] = useState<Record<MediaKind, File | null>>({
    PICTURE: null,
    DOCUMENT: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmAction>(emptyConfirmation);
  const [pendingDeleteId, setPendingDeleteId] = useState("");

  async function refresh(targetMeeting = meeting) {
    if (!targetMeeting) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(appPath(`/api/meetings/${targetMeeting.id}/media`), {
        cache: "no-store",
      });
      setMedia(await readJson(response));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "โหลดไฟล์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!meeting) return;
    const timer = window.setTimeout(() => {
      setFiles({ PICTURE: null, DOCUMENT: null });
      setError("");
      void refresh(meeting);
    }, 0);
    return () => window.clearTimeout(timer);
    // Refresh only when the dialog target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting?.id]);

  async function upload(kind: MediaKind) {
    const file = files[kind];
    if (!meeting || !file) {
      setError("กรุณาเลือกไฟล์ที่ต้องการแนบ");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("file", file);
      const response = await fetch(appPath(`/api/meetings/${meeting.id}/media`), {
        method: "POST",
        body: formData,
      });
      await readJson(response);
      setFiles((current) => ({ ...current, [kind]: null }));
      const inputRef =
        kind === "PICTURE" ? pictureInputRef : documentInputRef;
      if (inputRef.current) inputRef.current.value = "";
      await refresh();
      await onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "อัปโหลดไฟล์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  function requestDelete(record: MeetingMediaRecord) {
    setPendingDeleteId(record.id);
    setConfirmation({
      open: true,
      title: "ยืนยันการลบไฟล์",
      description: `${record.originalName} จะถูกลบออกจากการประชุม ${meeting?.meetingCode}`,
      kind: "delete",
      confirmLabel: "ลบไฟล์",
    });
  }

  async function deletePending() {
    if (!pendingDeleteId) return;
    setConfirmation((current) => ({ ...current, open: false }));
    setLoading(true);
    setError("");
    try {
      const response = await fetch(appPath(`/api/media/${pendingDeleteId}`), { method: "DELETE" });
      await readJson(response);
      setPendingDeleteId("");
      await refresh();
      await onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ลบไฟล์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const usedBytes = media.reduce((total, record) => total + record.sizeBytes, 0);

  return (
    <>
      {loading && <LoadingOverlay label="กำลังประมวลผลไฟล์..." />}
      <AdaptiveDialog
        open={Boolean(meeting)}
        onOpenChange={onOpenChange}
        title={`ไฟล์ประกอบ ${meeting?.meetingCode || ""}`}
        description={meeting?.title}
        className="sm:max-w-4xl"
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-slate-300">
            ไฟล์รวมต่อการประชุมต้องไม่เกิน 20 MB
            <span className="ml-2 font-semibold text-amber-300">
              ใช้แล้ว {formatBytes(usedBytes)} / 20 MB
            </span>
          </div>

          {error && <p role="alert" className="rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

          <MediaKindSection
            kind="PICTURE"
            records={media.filter((record) => record.kind === "PICTURE")}
            file={files.PICTURE}
            inputRef={pictureInputRef}
            onFileChange={(file) =>
              setFiles((current) => ({ ...current, PICTURE: file }))
            }
            onUpload={() => upload("PICTURE")}
            onDelete={requestDelete}
          />
          <MediaKindSection
            kind="DOCUMENT"
            records={media.filter((record) => record.kind === "DOCUMENT")}
            file={files.DOCUMENT}
            inputRef={documentInputRef}
            onFileChange={(file) =>
              setFiles((current) => ({ ...current, DOCUMENT: file }))
            }
            onUpload={() => upload("DOCUMENT")}
            onDelete={requestDelete}
          />
        </div>
      </AdaptiveDialog>
      <ConfirmActionDialog
        state={confirmation}
        onOpenChange={(open) => setConfirmation((current) => ({ ...current, open }))}
        onConfirm={deletePending}
      />
    </>
  );
}

function MediaKindSection({
  kind,
  records,
  file,
  inputRef,
  onFileChange,
  onUpload,
  onDelete,
}: {
  kind: MediaKind;
  records: MeetingMediaRecord[];
  file: File | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  onDelete: (record: MeetingMediaRecord) => void;
}) {
  const isPicture = kind === "PICTURE";
  const title = isPicture ? "รูปภาพที่แนบ" : "เอกสารที่แนบ";
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
          {title} ({records.length})
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          {isPicture
            ? "รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 2 MB ต่อไฟล์"
            : "รองรับ PDF, Word, Excel และ PowerPoint"}
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
          onChange={(event) =>
            onFileChange(event.target.files?.[0] || null)
          }
        />
        <Button
          type="button"
          className="action-save h-10"
          onClick={onUpload}
          disabled={!file}
        >
          <Upload /> อัปโหลด{isPicture ? "รูปภาพ" : "เอกสาร"}
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-6 text-center text-slate-400">
          ยังไม่มี{isPicture ? "รูปภาพ" : "เอกสาร"}
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
                  <p
                    className="truncate font-semibold"
                    title={record.originalName}
                  >
                    {record.originalName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(record.sizeBytes)} ·{" "}
                    {formatThaiDate(record.createdAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  className="action-view"
                  title="เปิดไฟล์"
                  aria-label={`เปิดไฟล์ ${record.originalName}`}
                  onClick={() =>
                    window.open(
                      downloadUrl,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
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
