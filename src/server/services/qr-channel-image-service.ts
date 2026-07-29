import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import {
  qrChannelImageMimeFromPath,
  validateQrChannelImage,
} from "@/lib/qr-channel-image";
import { writeAudit } from "@/server/audit";
import { canAccessProject } from "@/server/auth";

type CurrentUser = Parameters<typeof canAccessProject>[0];

function normalizeChannelNo(channelNo: string | number) {
  const value = Number(channelNo);
  if (value !== 1 && value !== 2) throw new Error("NOT_FOUND");
  return value;
}

function absoluteStoragePath(imagePath: string) {
  const storageRoot = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    "storage",
  );
  const absolutePath = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    imagePath.replace(/^\//, ""),
  );
  if (!absolutePath.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("FORBIDDEN");
  }
  return absolutePath;
}

async function findAuthorizedChannel(
  user: CurrentUser,
  meetingId: string,
  rawChannelNo: string | number,
) {
  const channelNo = normalizeChannelNo(rawChannelNo);
  const channel = await prisma.meetingQrChannel.findUnique({
    where: { meetingId_channelNo: { meetingId, channelNo } },
    include: { meeting: { select: { projectId: true, meetingCode: true } } },
  });
  if (!channel) throw new Error("NOT_FOUND");
  if (!canAccessProject(user, channel.meeting.projectId)) {
    throw new Error("FORBIDDEN");
  }
  return channel;
}

export async function uploadQrChannelImage(
  user: CurrentUser,
  meetingId: string,
  rawChannelNo: string | number,
  formData: FormData,
) {
  const channel = await findAuthorizedChannel(user, meetingId, rawChannelNo);
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("POLICY:Select an image file.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = validateQrChannelImage(file.type, file.size, bytes);
  const relativeDirectory = path.join(
    "storage",
    "meetings",
    meetingId,
    "qr-channels",
  );
  const directory = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    relativeDirectory,
  );
  const storedName = `channel-${channel.channelNo}-${randomUUID()}${image.extension}`;
  const absolutePath = path.join(directory, storedName);
  const imagePath = `/${path.join(relativeDirectory, storedName).replaceAll("\\", "/")}`;

  await mkdir(directory, { recursive: true });
  await writeFile(absolutePath, bytes, { flag: "wx" });

  try {
    await prisma.meetingQrChannel.update({
      where: { id: channel.id },
      data: { imagePath },
    });
  } catch (error) {
    await unlink(absolutePath).catch(() => undefined);
    throw error;
  }

  if (channel.imagePath) {
    await unlink(absoluteStoragePath(channel.imagePath)).catch(() => undefined);
  }
  await writeAudit({
    userId: user.id,
    action: "UPDATE",
    entity: "MeetingQrChannel",
    entityId: channel.id,
    summary: `Updated QR channel ${channel.channelNo} image for ${channel.meeting.meetingCode}`,
    newValues: {
      meetingId,
      channelNo: channel.channelNo,
      mimeType: image.mimeType,
      sizeBytes: file.size,
    },
  });
  return { hasImage: true };
}

export async function deleteQrChannelImage(
  user: CurrentUser,
  meetingId: string,
  rawChannelNo: string | number,
) {
  const channel = await findAuthorizedChannel(user, meetingId, rawChannelNo);
  if (!channel.imagePath) return { hasImage: false };

  await prisma.meetingQrChannel.update({
    where: { id: channel.id },
    data: { imagePath: null },
  });
  await unlink(absoluteStoragePath(channel.imagePath)).catch(() => undefined);
  await writeAudit({
    userId: user.id,
    action: "DELETE",
    entity: "MeetingQrChannel",
    entityId: channel.id,
    summary: `Deleted QR channel ${channel.channelNo} image for ${channel.meeting.meetingCode}`,
  });
  return { hasImage: false };
}

async function readChannelImage(imagePath: string | null) {
  if (!imagePath) throw new Error("NOT_FOUND");
  return {
    bytes: await readFile(absoluteStoragePath(imagePath)),
    mimeType: qrChannelImageMimeFromPath(imagePath),
  };
}

export async function readAuthorizedQrChannelImage(
  user: CurrentUser,
  meetingId: string,
  rawChannelNo: string | number,
) {
  const channel = await findAuthorizedChannel(user, meetingId, rawChannelNo);
  return readChannelImage(channel.imagePath);
}

export async function readPublicQrChannelImage(token: string) {
  const channel = await prisma.meetingQrChannel.findUnique({
    where: { token },
    select: { imagePath: true, active: true },
  });
  if (!channel?.active) throw new Error("NOT_FOUND");
  return readChannelImage(channel.imagePath);
}
