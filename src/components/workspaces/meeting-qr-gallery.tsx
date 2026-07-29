"use client";

import { useState } from "react";
import { Copy, Download, LoaderCircle } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { MeetingQrCard } from "@/components/workspaces/meeting-qr-card";
import { appPath } from "@/lib/app-path";
import { formatThaiDate } from "@/lib/format";
import type { MeetingRecord } from "@/types/app";

type CopyResult = "copied" | "downloaded";

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function loadProtectedImage(source: string) {
  const response = await fetch(source, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) return null;
  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    return await loadImage(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function drawContainedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

async function createMeetingQrBlob(meeting: MeetingRecord) {
  await document.fonts?.ready;
  const width = 1400;
  const height = 1080;
  const cardWidth = 540;
  const cardHeight = 690;
  const gap = 90;
  const cardTop = 315;
  const startX = (width - cardWidth * 2 - gap) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");

  const channelAssets = await Promise.all(meeting.channels.map(async (channel) => {
    const registrationUrl = `${window.location.origin}${appPath(`/register/${channel.token}`)}`;
    const qrDataUrl = await QRCode.toDataURL(registrationUrl, {
      width: 420,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#061325", light: "#ffffff" },
    });
    const imageUrl = channel.hasImage
      ? appPath(`/api/meetings/${meeting.id}/channels/${channel.channelNo}/image`)
      : "";
    return {
      channel,
      qrImage: await loadImage(qrDataUrl),
      groupImage: imageUrl ? await loadProtectedImage(imageUrl) : null,
    };
  }));

  context.fillStyle = "#06101f";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#102039";
  roundRect(context, 55, 45, width - 110, 230, 26);
  context.fill();
  context.textAlign = "center";
  context.fillStyle = "#f8fafc";
  context.font = "800 42px Prompt, Arial, sans-serif";
  context.fillText(meeting.project.name, width / 2, 105, width - 180);
  context.font = "700 30px Prompt, Arial, sans-serif";
  context.fillText(meeting.title, width / 2, 160, width - 180);
  context.fillStyle = "#cbd5e1";
  context.font = "400 22px Prompt, Arial, sans-serif";
  context.fillText(
    `${formatThaiDate(meeting.meetingDate)} เวลา ${meeting.startTime}-${meeting.endTime} น.`,
    width / 2,
    210,
    width - 180,
  );
  context.fillText(`ณ ${meeting.location}`, width / 2, 246, width - 180);

  channelAssets.forEach(({ channel, qrImage, groupImage }, index) => {
    const x = startX + index * (cardWidth + gap);
    context.fillStyle = "#16263d";
    roundRect(context, x, cardTop, cardWidth, cardHeight, 24);
    context.fill();

    context.fillStyle = "#67e8f9";
    context.font = "700 23px Prompt, Arial, sans-serif";
    context.fillText(`QR Channel ${channel.channelNo}`, x + cardWidth / 2, cardTop + 42);
    context.fillStyle = "#f8fafc";
    context.font = "700 27px Prompt, Arial, sans-serif";
    context.fillText(
      channel.mode === "GROUP"
        ? channel.aliasName
        : "ลงทะเบียนแบบ OPEN",
      x + cardWidth / 2,
      cardTop + 82,
      cardWidth - 60,
    );
    if (channel.mode !== "GROUP") {
      context.fillStyle = "#94a3b8";
      context.font = "500 18px Prompt, Arial, sans-serif";
      context.fillText(
        "กรอกข้อมูลและหน่วยงาน/สังกัดด้วยตนเอง",
        x + cardWidth / 2,
        cardTop + 112,
        cardWidth - 60,
      );
    }

    const imageX = x + (cardWidth - 250) / 2;
    const imageY = cardTop + 135;
    context.fillStyle = "#07162a";
    roundRect(context, imageX, imageY, 250, 120, 16);
    context.fill();
    if (groupImage) {
      drawContainedImage(context, groupImage, imageX + 10, imageY + 10, 230, 100);
    } else {
      context.fillStyle = "#64748b";
      context.font = "500 18px Prompt, Arial, sans-serif";
      context.fillText("ไม่มีรูปประกอบ", x + cardWidth / 2, imageY + 68);
    }

    const qrSize = 340;
    const qrX = x + (cardWidth - qrSize) / 2;
    const qrY = cardTop + 285;
    context.fillStyle = "#ffffff";
    roundRect(context, qrX, qrY, qrSize, qrSize, 18);
    context.fill();
    context.drawImage(qrImage, qrX + 10, qrY + 10, qrSize - 20, qrSize - 20);
    context.fillStyle = "#67e8f9";
    context.font = "600 19px Prompt, Arial, sans-serif";
    context.fillText("สแกน QR Code เพื่อลงทะเบียน", x + cardWidth / 2, cardTop + 660);
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Unable to create QR image.")),
      "image/png",
    );
  });
}

async function copyOrDownloadMeetingQr(meeting: MeetingRecord): Promise<CopyResult> {
  const blob = await createMeetingQrBlob(meeting);
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      throw new Error("Clipboard image is unsupported.");
    }
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return "copied";
  } catch {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${meeting.meetingCode}-qr-codes.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
    return "downloaded";
  }
}

export function MeetingQrGallery({ meeting }: { meeting: MeetingRecord }) {
  const [copying, setCopying] = useState(false);
  const [status, setStatus] = useState("");

  async function copyAllQrCodes() {
    setCopying(true);
    setStatus("");
    try {
      const result = await copyOrDownloadMeetingQr(meeting);
      setStatus(
        result === "copied"
          ? "คัดลอกรูป QR Code พร้อมรายละเอียดแล้ว"
          : "Browser ไม่รองรับการคัดลอกรูป จึงดาวน์โหลด PNG แทน",
      );
    } catch {
      setStatus("ไม่สามารถสร้างรูป QR Code ได้");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {status && <p className="text-sm text-emerald-300">{status}</p>}
        <Button
          type="button"
          className="action-edit"
          disabled={copying}
          onClick={() => void copyAllQrCodes()}
        >
          {copying ? <LoaderCircle className="animate-spin" /> : <Copy />}
          Copy QR Code ทั้งหมด
          {status.includes("ดาวน์โหลด") && <Download />}
        </Button>
      </div>
      <div className="grid items-stretch gap-4 sm:grid-cols-2">
        {meeting.channels.map((channel) => (
          <MeetingQrCard
            key={channel.id}
            meeting={meeting}
            channel={channel}
          />
        ))}
      </div>
    </div>
  );
}
