"use client";

import { useEffect, useState } from "react";
import { ExternalLink, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { appPath } from "@/lib/app-path";
import type { MeetingChannel, MeetingRecord } from "@/types/app";

export function MeetingQrCard({
  meeting,
  channel,
}: {
  meeting: MeetingRecord;
  channel: MeetingChannel;
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const registrationPath = appPath(`/register/${channel.token}`);
  const channelLabel = channel.mode === "GROUP"
    ? channel.aliasName
    : "ลงทะเบียนแบบ OPEN";

  useEffect(() => {
    const url = `${window.location.origin}${registrationPath}`;
    void QRCode.toDataURL(url, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#061325", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [registrationPath]);

  return (
    <article className="glass-card flex h-full flex-col rounded-lg p-5 text-center">
      <div className="min-h-28">
        <p className="text-xs font-semibold uppercase text-slate-400">
          QR Channel {channel.channelNo}
        </p>
        {channel.mode === "GROUP" ? (
          <>
            <p className="mt-2 text-xs font-semibold text-slate-400">หน่วยงาน/สังกัด</p>
            <h3 className="mt-1 text-lg font-bold text-cyan-200">
              {channel.aliasName}
            </h3>
            <p className="text-sm text-slate-400">{channel.group?.name}</p>
          </>
        ) : (
          <p className="mx-auto mt-5 max-w-sm text-sm font-semibold text-cyan-200">
            ผู้ลงทะเบียนกรอกข้อมูลและหน่วยงาน/สังกัดด้วยตนเอง
          </p>
        )}
      </div>

      <div className="mx-auto mt-4 grid h-24 w-full max-w-52 place-items-center overflow-hidden rounded-lg border border-cyan-400/25 bg-[#061325] p-2">
        {channel.hasImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={appPath(
                `/api/meetings/${meeting.id}/channels/${channel.channelNo}/image`,
              )}
              alt={`รูปประกอบ ${channelLabel}`}
              className="block h-auto w-auto max-h-20 max-w-full object-contain"
            />
          </>
        ) : (
          <p className="text-sm text-slate-500">ไม่มีรูปประกอบ</p>
        )}
      </div>

      <div className="mx-auto mt-4 grid aspect-square w-full max-w-64 place-items-center overflow-hidden rounded-lg bg-white p-2">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`QR Code ${channelLabel}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <QrCode className="size-24 animate-pulse text-slate-700" />
        )}
      </div>

      <p className="mt-3 min-h-10 break-all text-xs text-slate-500">
        {registrationPath}
      </p>
      <Button
        type="button"
        className="action-qr mt-auto self-center"
        onClick={() => window.open(
          `${window.location.origin}${registrationPath}`,
          "_blank",
          "noopener,noreferrer",
        )}
      >
        <ExternalLink /> เปิดหน้าลงทะเบียน
      </Button>
    </article>
  );
}
