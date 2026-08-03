"use client";

import { useEffect, useRef, useState } from "react";
import { useUiPreferences } from "@/components/app/ui-preferences-provider";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { ConfirmActionDialog, type ConfirmAction } from "@/components/shared/confirm-action-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { appPath } from "@/lib/app-path";
import { translateUiText } from "@/lib/ui-translation-catalog";
import type { MeetingMediaRecord, MeetingRecord } from "@/types/app";
import {
  formatMediaBytes,
  MeetingMediaSection,
  type MediaKind,
} from "./meeting-media-section";

const emptyConfirmation: ConfirmAction = {
  open: false,
  title: "",
  description: "",
};

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
  const { locale } = useUiPreferences();
  const translate = (value: string) => translateUiText(value, locale);
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
            {translate("ไฟล์รวมต่อการประชุมต้องไม่เกิน 20 MB")}
            <span className="ml-2 font-semibold text-amber-300">
              {translate(`ใช้แล้ว ${formatMediaBytes(usedBytes)} / 20 MB`)}
            </span>
          </div>

          {error && <p role="alert" className="rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

          <MeetingMediaSection
            kind="PICTURE"
            records={media.filter((record) => record.kind === "PICTURE")}
            file={files.PICTURE}
            inputRef={pictureInputRef}
            onFileChange={(file) =>
              setFiles((current) => ({ ...current, PICTURE: file }))
            }
            onUpload={() => upload("PICTURE")}
            onDelete={requestDelete}
            locale={locale}
          />
          <MeetingMediaSection
            kind="DOCUMENT"
            records={media.filter((record) => record.kind === "DOCUMENT")}
            file={files.DOCUMENT}
            inputRef={documentInputRef}
            onFileChange={(file) =>
              setFiles((current) => ({ ...current, DOCUMENT: file }))
            }
            onUpload={() => upload("DOCUMENT")}
            onDelete={requestDelete}
            locale={locale}
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
