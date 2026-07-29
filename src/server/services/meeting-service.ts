import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getBuddhistYear } from "@/lib/format";
import { writeAudit } from "@/server/audit";
import { canAccessProject } from "@/server/auth";
import { meetingSchema } from "@/server/validation";

type CurrentUser = Parameters<typeof canAccessProject>[0];

const meetingInclude = {
  project: { select: { id: true, code: true, name: true } },
  organizer: { select: { id: true, firstName: true, lastName: true, email: true } },
  channels: { include: { group: { select: { id: true, name: true } } }, orderBy: { channelNo: "asc" as const } },
  _count: { select: { attendances: true, media: true } },
};

function presentMeeting<
  T extends { channels: Array<{ imagePath: string | null }> },
>(record: T) {
  return {
    ...record,
    channels: record.channels.map(({ imagePath, ...channel }) => ({
      ...channel,
      hasImage: Boolean(imagePath),
    })),
  };
}

async function assertGroupsAvailable(channels: Array<{ groupId?: string | null }>) {
  const groupIds = [...new Set(channels.flatMap((channel) => channel.groupId ? [channel.groupId] : []))];
  if (groupIds.length === 0) return;
  const availableGroups = await prisma.participantGroup.count({
    where: { id: { in: groupIds }, active: true },
  });
  if (availableGroups !== groupIds.length) {
    throw new Error("POLICY:Select an active participant group.");
  }
}

export async function listMeetings(user: CurrentUser) {
  const meetings = await prisma.meeting.findMany({
    where: {
      status: { not: "ARCHIVED" },
      ...(user.role === "ADMIN" ? {} : { project: { members: { some: { userId: user.id } } } }),
    },
    include: meetingInclude,
    orderBy: [{ meetingDate: "desc" }, { startTime: "desc" }],
  });
  return meetings.map(presentMeeting);
}

export async function getMeeting(user: CurrentUser, id: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: meetingInclude,
  });
  if (!meeting || meeting.status === "ARCHIVED") throw new Error("NOT_FOUND");
  if (!canAccessProject(user, meeting.projectId)) throw new Error("FORBIDDEN");
  return presentMeeting(meeting);
}

async function nextMeetingCode(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const setting = await tx.appSetting.upsert({
    where: { key: "meeting_running" },
    update: {},
    create: { key: "meeting_running", value: "1" },
  });
  const running = Number(setting.value) || 1;
  await tx.appSetting.update({ where: { key: "meeting_running" }, data: { value: String(running + 1) } });
  return `MTG-${getBuddhistYear()}-${String(running).padStart(4, "0")}`;
}

export async function createMeeting(user: CurrentUser, raw: unknown) {
  const input = meetingSchema.parse(raw);
  if (!canAccessProject(user, input.projectId)) throw new Error("FORBIDDEN");
  await assertGroupsAvailable(input.channels);

  const record = await prisma.$transaction(async (tx) => {
    const meetingCode = await nextMeetingCode(tx);
    return tx.meeting.create({
      data: {
        meetingCode,
        projectId: input.projectId,
        organizerId: user.id,
        title: input.title,
        agenda: input.agenda || null,
        meetingDate: new Date(`${input.meetingDate}T00:00:00.000Z`),
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location,
        registerLimitMinutes: input.registerLimitMinutes,
        allowLateRegistration: input.allowLateRegistration,
        status: "OPEN",
        channels: {
          create: input.channels.map((channel) => ({
            channelNo: channel.channelNo,
            mode: channel.mode,
            groupId: channel.groupId || null,
            aliasName: channel.aliasName,
            token: randomBytes(24).toString("base64url"),
          })),
        },
      },
      include: meetingInclude,
    });
  });
  await writeAudit({ userId: user.id, action: "CREATE", entity: "Meeting", entityId: record.id, summary: `Created meeting ${record.meetingCode}`, newValues: input });
  return presentMeeting(record);
}

export async function updateMeeting(user: CurrentUser, id: string, raw: unknown) {
  const input = meetingSchema.parse(raw);
  const oldRecord = await prisma.meeting.findUnique({ where: { id }, include: { channels: true, _count: { select: { attendances: true } } } });
  if (!oldRecord) throw new Error("NOT_FOUND");
  if (!canAccessProject(user, oldRecord.projectId) || !canAccessProject(user, input.projectId)) throw new Error("FORBIDDEN");

  if (oldRecord._count.attendances > 0) {
    const immutableChanged =
      input.projectId !== oldRecord.projectId ||
      input.title !== oldRecord.title ||
      input.meetingDate !== oldRecord.meetingDate.toISOString().slice(0, 10) ||
      input.startTime !== oldRecord.startTime ||
      input.endTime !== oldRecord.endTime ||
      input.location !== oldRecord.location ||
      JSON.stringify(input.channels.map(({ channelNo, mode, groupId, aliasName }) => ({ channelNo, mode, groupId: groupId || null, aliasName }))) !==
        JSON.stringify(oldRecord.channels.sort((a, b) => a.channelNo - b.channelNo).map(({ channelNo, mode, groupId, aliasName }) => ({ channelNo, mode, groupId, aliasName })));
    if (immutableChanged) {
      throw new Error("POLICY:After attendance exists, only registration limit and late-registration override may be changed.");
    }
  } else {
    await assertGroupsAvailable(input.channels);
  }

  const record = await prisma.$transaction(async (tx) => {
    await Promise.all(input.channels.map((channel) =>
      tx.meetingQrChannel.update({
        where: { meetingId_channelNo: { meetingId: id, channelNo: channel.channelNo } },
        data: { mode: channel.mode, groupId: channel.groupId || null, aliasName: channel.aliasName },
      }),
    ));
    return tx.meeting.update({
      where: { id },
      data: {
        projectId: input.projectId,
        title: input.title,
        agenda: input.agenda || null,
        meetingDate: new Date(`${input.meetingDate}T00:00:00.000Z`),
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location,
        registerLimitMinutes: input.registerLimitMinutes,
        allowLateRegistration: input.allowLateRegistration,
      },
      include: meetingInclude,
    });
  });
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "Meeting", entityId: id, summary: `Updated meeting ${record.meetingCode}`, oldValues: oldRecord, newValues: input });
  return presentMeeting(record);
}

export async function deleteMeeting(user: CurrentUser, id: string) {
  const record = await prisma.meeting.findUnique({ where: { id }, include: { _count: { select: { attendances: true } } } });
  if (!record) throw new Error("NOT_FOUND");
  if (!canAccessProject(user, record.projectId)) throw new Error("FORBIDDEN");
  if (record._count.attendances > 0) {
    await prisma.meeting.update({ where: { id }, data: { status: "ARCHIVED" } });
    await writeAudit({ userId: user.id, action: "DELETE", entity: "Meeting", entityId: id, summary: `Archived meeting ${record.meetingCode} because attendance exists` });
    return { archived: true };
  }
  await prisma.meeting.delete({ where: { id } });
  await writeAudit({ userId: user.id, action: "DELETE", entity: "Meeting", entityId: id, summary: `Deleted meeting ${record.meetingCode}` });
  return { archived: false };
}
