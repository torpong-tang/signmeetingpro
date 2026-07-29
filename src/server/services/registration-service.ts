import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/server/audit";

const registrationSchema = z.object({
  participantId: z.string().min(1).optional().nullable(),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  position: z.string().trim().min(1).max(160).optional(),
  department: z.string().trim().max(160).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional().nullable(),
  signatureDataUrl: z.string().startsWith("data:image/png;base64,").max(1_500_000),
});

function registrationDeadline(meetingDate: Date, startTime: string, minutes: number) {
  const date = meetingDate.toISOString().slice(0, 10);
  return new Date(`${date}T${startTime}:00+07:00`).getTime() + minutes * 60_000;
}

export async function getRegistrationContext(token: string) {
  const channel = await prisma.meetingQrChannel.findUnique({
    where: { token },
    include: {
      group: {
        include: { participants: { where: { active: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] } },
      },
      meeting: {
        include: {
          project: { select: { code: true, name: true } },
        },
      },
    },
  });
  if (!channel || !channel.active) throw new Error("NOT_FOUND");
  const deadline = registrationDeadline(channel.meeting.meetingDate, channel.meeting.startTime, channel.meeting.registerLimitMinutes);
  const isOpen = channel.meeting.allowLateRegistration || Date.now() <= deadline;
  return {
    channel: {
      id: channel.id,
      channelNo: channel.channelNo,
      mode: channel.mode,
      organizationName: channel.aliasName,
      hasImage: Boolean(channel.imagePath),
      group: channel.group ? {
        id: channel.group.id,
        name: channel.group.name,
        participants: channel.group.participants.map((person) => ({
          id: person.id,
          firstName: person.firstName,
          lastName: person.lastName,
          position: person.position,
          department: channel.aliasName,
          phone: person.phone,
          email: person.email,
        })),
      } : null,
    },
    meeting: {
      meetingCode: channel.meeting.meetingCode,
      title: channel.meeting.title,
      agenda: channel.meeting.agenda,
      meetingDate: channel.meeting.meetingDate,
      startTime: channel.meeting.startTime,
      endTime: channel.meeting.endTime,
      location: channel.meeting.location,
      project: channel.meeting.project,
    },
    isOpen,
    deadline: new Date(deadline),
  };
}

export async function registerAttendance(token: string, raw: unknown) {
  const input = registrationSchema.parse(raw);
  const context = await getRegistrationContext(token);
  if (!context.isOpen) throw new Error("POLICY:Registration is closed.");

  const channel = await prisma.meetingQrChannel.findUnique({
    where: { token },
    include: { meeting: true, group: true },
  });
  if (!channel) throw new Error("NOT_FOUND");

  let participant = null;
  if (input.participantId) {
    participant = await prisma.participant.findFirst({
      where: { id: input.participantId, groupId: channel.groupId || undefined, active: true },
    });
    if (!participant) throw new Error("POLICY:Selected participant does not belong to this registration group.");
    const duplicate = await prisma.attendance.findFirst({
      where: { meetingId: channel.meetingId, participantId: participant.id },
    });
    if (duplicate) throw new Error("POLICY:This participant has already registered for the meeting.");
  }

  const firstName = participant?.firstName || input.firstName;
  const lastName = participant?.lastName || input.lastName;
  const position = participant?.position || input.position;
  const department = channel.mode === "GROUP"
    ? channel.aliasName.trim()
    : input.department?.trim();
  if (!firstName || !lastName || !position || !department) {
    throw new Error("POLICY:First name, last name, position and department are required.");
  }

  const signatureBytes = Buffer.from(input.signatureDataUrl.split(",")[1] || "", "base64");
  if (signatureBytes.length === 0 || signatureBytes.length > 1_000_000) throw new Error("POLICY:Signature is missing or too large.");

  const signatureDirectory = path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "signatures");
  await mkdir(signatureDirectory, { recursive: true });
  const signatureName = `${channel.meetingId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.png`;
  await writeFile(path.join(signatureDirectory, signatureName), signatureBytes, { flag: "wx" });

  let record;
  try {
    record = await prisma.$transaction(async (tx) => {
      const last = await tx.attendance.findFirst({ where: { meetingId: channel.meetingId }, orderBy: { personNo: "desc" }, select: { personNo: true } });
      const channelAttendance = await tx.attendance.aggregate({
        where: { meetingId: channel.meetingId, channelId: channel.id },
        _count: { id: true },
        _max: { displayOrder: true },
      });
      return tx.attendance.create({
        data: {
          meetingId: channel.meetingId,
          channelId: channel.id,
          participantId: participant?.id || null,
          personNo: (last?.personNo || 0) + 1,
          displayOrder:
            Math.max(
              channelAttendance._count.id,
              channelAttendance._max.displayOrder || 0,
            ) + 1,
          firstNameSnapshot: firstName,
          lastNameSnapshot: lastName,
          positionSnapshot: position,
          departmentSnapshot: department,
          phoneSnapshot: participant?.phone || input.phone || null,
          emailSnapshot: participant?.email || input.email || null,
          signaturePath: `/storage/signatures/${signatureName}`,
        },
      });
    });
  } catch (error) {
    await unlink(path.join(signatureDirectory, signatureName)).catch(() => undefined);
    throw error;
  }
  await writeAudit({ action: "REGISTER", entity: "Attendance", entityId: record.id, summary: `Registered ${record.firstNameSnapshot} ${record.lastNameSnapshot} as no. ${record.personNo}`, newValues: { meetingId: record.meetingId, personNo: record.personNo } });
  return { personNo: record.personNo, meetingCode: context.meeting.meetingCode };
}
