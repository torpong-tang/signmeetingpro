import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/server/audit";
import { canAccessProject } from "@/server/auth";

type CurrentUser = Parameters<typeof canAccessProject>[0];

const MAX_MEETING_BYTES = 20 * 1024 * 1024;
const MAX_PICTURE_BYTES = 2 * 1024 * 1024;
const pictureTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const documentTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export async function listMedia(user: CurrentUser, meetingId: string) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new Error("NOT_FOUND");
  if (!canAccessProject(user, meeting.projectId)) throw new Error("FORBIDDEN");
  return prisma.meetingMedia.findMany({ where: { meetingId }, orderBy: { createdAt: "desc" } });
}

export async function uploadMedia(user: CurrentUser, meetingId: string, formData: FormData) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new Error("NOT_FOUND");
  if (!canAccessProject(user, meeting.projectId)) throw new Error("FORBIDDEN");
  const file = formData.get("file");
  const kind = formData.get("kind");
  if (!(file instanceof File) || (kind !== "PICTURE" && kind !== "DOCUMENT")) throw new Error("POLICY:File and kind are required.");
  if (file.size === 0) throw new Error("POLICY:Empty files are not allowed.");
  if (kind === "PICTURE" && (file.size > MAX_PICTURE_BYTES || !pictureTypes.has(file.type))) {
    throw new Error("POLICY:Pictures must be JPG, PNG or WebP and no larger than 2 MB.");
  }
  if (kind === "DOCUMENT" && !documentTypes.has(file.type)) {
    throw new Error("POLICY:Documents must be PDF, Word, Excel or PowerPoint.");
  }
  const used = await prisma.meetingMedia.aggregate({ where: { meetingId }, _sum: { sizeBytes: true } });
  if ((used._sum.sizeBytes || 0) + file.size > MAX_MEETING_BYTES) throw new Error("POLICY:Total meeting attachments cannot exceed 20 MB.");

  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name).toLowerCase().slice(0, 10);
  const storedName = `${randomUUID()}${extension}`;
  const relativeDirectory = path.join("storage", "meetings", meetingId);
  const directory = path.join(/* turbopackIgnore: true */ process.cwd(), relativeDirectory);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storedName), bytes, { flag: "wx" });

  let record;
  try {
    record = await prisma.meetingMedia.create({
      data: {
        meetingId,
        kind,
        originalName: file.name.slice(0, 255),
        storedName,
        mimeType: file.type,
        sizeBytes: file.size,
        path: `/${relativeDirectory.replaceAll("\\", "/")}/${storedName}`,
        checksum: createHash("sha256").update(bytes).digest("hex"),
      },
    });
  } catch (error) {
    await unlink(path.join(directory, storedName)).catch(() => undefined);
    throw error;
  }
  await writeAudit({ userId: user.id, action: "CREATE", entity: "MeetingMedia", entityId: record.id, summary: `Uploaded ${kind.toLowerCase()} ${record.originalName}`, newValues: { meetingId, kind, sizeBytes: file.size, checksum: record.checksum } });
  return record;
}

export async function deleteMedia(user: CurrentUser, id: string) {
  const record = await prisma.meetingMedia.findUnique({ where: { id }, include: { meeting: true } });
  if (!record) throw new Error("NOT_FOUND");
  if (!canAccessProject(user, record.meeting.projectId)) throw new Error("FORBIDDEN");
  await prisma.meetingMedia.delete({ where: { id } });
  await unlink(path.join(/* turbopackIgnore: true */ process.cwd(), record.path.replace(/^\//, ""))).catch(() => undefined);
  await writeAudit({ userId: user.id, action: "DELETE", entity: "MeetingMedia", entityId: id, summary: `Deleted attachment ${record.originalName}`, oldValues: { checksum: record.checksum, sizeBytes: record.sizeBytes } });
}

export async function downloadMedia(user: CurrentUser, id: string) {
  const record = await prisma.meetingMedia.findUnique({
    where: { id },
    include: { meeting: true },
  });
  if (!record) throw new Error("NOT_FOUND");
  if (!canAccessProject(user, record.meeting.projectId)) throw new Error("FORBIDDEN");

  const storageRoot = path.resolve(/* turbopackIgnore: true */ process.cwd(), "storage");
  const absolutePath = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    record.path.replace(/^\//, ""),
  );
  if (!absolutePath.startsWith(`${storageRoot}${path.sep}`)) throw new Error("FORBIDDEN");

  return { record, bytes: await readFile(absolutePath) };
}
