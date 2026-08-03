import { prisma } from "@/lib/prisma";
import { sortAttendanceByChannelAndOrder } from "@/lib/attendance-order";
import { attendanceUpdateSchema, resolveAttendanceDepartment } from "@/lib/attendance-edit-policy";
import { canAccessProject } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

type CurrentUser = Parameters<typeof canAccessProject>[0];

export async function getMeetingAttendance(user: CurrentUser, meetingId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      project: { select: { id: true, code: true, name: true } },
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
      channels: {
        select: {
          id: true,
          channelNo: true,
          aliasName: true,
          mode: true,
        },
        orderBy: { channelNo: "desc" },
      },
      attendances: {
        include: {
          channel: {
            select: { id: true, channelNo: true, aliasName: true },
          },
        },
        orderBy: [{ personNo: "asc" }, { registeredAt: "asc" }],
      },
    },
  });

  if (!meeting) throw new Error("NOT_FOUND");
  if (!canAccessProject(user, meeting.projectId)) throw new Error("FORBIDDEN");
  return {
    ...meeting,
    attendances: sortAttendanceByChannelAndOrder(meeting.attendances),
  };
}

const reorderSchema = z.object({
  channelId: z.string().min(1),
  orderedAttendanceIds: z.array(z.string().min(1)).min(1),
});

export async function reorderMeetingAttendance(
  user: CurrentUser,
  meetingId: string,
  raw: unknown,
) {
  const input = reorderSchema.parse(raw);
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true, projectId: true },
  });
  if (!meeting) throw new Error("NOT_FOUND");
  if (!canAccessProject(user, meeting.projectId)) throw new Error("FORBIDDEN");

  const channel = await prisma.meetingQrChannel.findFirst({
    where: { id: input.channelId, meetingId },
    select: { id: true, channelNo: true },
  });
  if (!channel) throw new Error("NOT_FOUND");

  const records = await prisma.attendance.findMany({
    where: { meetingId, channelId: channel.id },
    select: { id: true, displayOrder: true, personNo: true },
  });
  const expectedIds = new Set(records.map((record) => record.id));
  const suppliedIds = new Set(input.orderedAttendanceIds);
  if (
    suppliedIds.size !== input.orderedAttendanceIds.length ||
    suppliedIds.size !== expectedIds.size ||
    input.orderedAttendanceIds.some((id) => !expectedIds.has(id))
  ) {
    throw new Error("POLICY:Attendance order must contain every attendee in this QR channel exactly once.");
  }

  const previousOrder = sortAttendanceByChannelAndOrder(
    records.map((record) => ({ ...record, channel })),
  ).map((record) => record.id);

  await prisma.$transaction(
    input.orderedAttendanceIds.map((id, index) =>
      prisma.attendance.update({
        where: { id },
        data: { displayOrder: index + 1 },
      }),
    ),
  );
  await writeAudit({
    userId: user.id,
    action: "UPDATE",
    entity: "AttendanceOrder",
    entityId: meetingId,
    summary: `Reordered QR Channel ${channel.channelNo} attendance`,
    oldValues: { channelId: channel.id, attendanceIds: previousOrder },
    newValues: {
      channelId: channel.id,
      attendanceIds: input.orderedAttendanceIds,
    },
  });
  return getMeetingAttendance(user, meetingId);
}

async function getEditableAttendance(
  user: CurrentUser,
  meetingId: string,
  attendanceId: string,
) {
  const record = await prisma.attendance.findFirst({
    where: { id: attendanceId, meetingId },
    include: {
      meeting: { select: { projectId: true } },
      channel: { select: { id: true, channelNo: true, mode: true, aliasName: true } },
    },
  });
  if (!record) throw new Error("NOT_FOUND");
  if (!canAccessProject(user, record.meeting.projectId)) throw new Error("FORBIDDEN");
  return record;
}

export async function updateMeetingAttendance(
  user: CurrentUser,
  meetingId: string,
  attendanceId: string,
  raw: unknown,
) {
  const input = attendanceUpdateSchema.parse(raw);
  const record = await getEditableAttendance(user, meetingId, attendanceId);
  const department = resolveAttendanceDepartment(
    record.channel.mode,
    record.channel.aliasName,
    input.department,
  );

  await prisma.attendance.update({
    where: { id: record.id },
    data: {
      firstNameSnapshot: input.firstName,
      lastNameSnapshot: input.lastName,
      positionSnapshot: input.position,
      departmentSnapshot: department,
      phoneSnapshot: input.phone?.trim() || null,
      emailSnapshot: input.email?.trim() || null,
    },
  });
  await writeAudit({
    userId: user.id,
    action: "UPDATE",
    entity: "Attendance",
    entityId: record.id,
    summary: `Updated attendance ${record.personNo}`,
    oldValues: {
      firstName: record.firstNameSnapshot,
      lastName: record.lastNameSnapshot,
      position: record.positionSnapshot,
      department: record.departmentSnapshot,
      phone: record.phoneSnapshot,
      email: record.emailSnapshot,
    },
    newValues: {
      firstName: input.firstName,
      lastName: input.lastName,
      position: input.position,
      department,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
    },
  });
  return getMeetingAttendance(user, meetingId);
}

export async function deleteMeetingAttendance(
  user: CurrentUser,
  meetingId: string,
  attendanceId: string,
) {
  const record = await getEditableAttendance(user, meetingId, attendanceId);
  const remaining = await prisma.attendance.findMany({
    where: { meetingId, channelId: record.channelId, id: { not: record.id } },
    select: { id: true, displayOrder: true, personNo: true },
  });
  const orderedRemaining = sortAttendanceByChannelAndOrder(
    remaining.map((item) => ({ ...item, channel: record.channel })),
  );

  await prisma.$transaction([
    prisma.attendance.delete({ where: { id: record.id } }),
    ...orderedRemaining.map((item, index) =>
      prisma.attendance.update({
        where: { id: item.id },
        data: { displayOrder: index + 1 },
      }),
    ),
  ]);

  if (record.signaturePath) {
    const storageRoot = path.resolve(
      /* turbopackIgnore: true */ process.cwd(),
      "storage",
    );
    const signaturePath = path.resolve(
      /* turbopackIgnore: true */ process.cwd(),
      record.signaturePath.replace(/^[/\\]+/, ""),
    );
    if (signaturePath.startsWith(`${storageRoot}${path.sep}`)) {
      await unlink(signaturePath).catch(() => undefined);
    }
  }
  await writeAudit({
    userId: user.id,
    action: "DELETE",
    entity: "Attendance",
    entityId: record.id,
    summary: `Deleted attendance ${record.personNo}: ${record.firstNameSnapshot} ${record.lastNameSnapshot}`,
    oldValues: {
      meetingId: record.meetingId,
      channelId: record.channelId,
      personNo: record.personNo,
      registeredAt: record.registeredAt,
    },
  });
  return getMeetingAttendance(user, meetingId);
}
