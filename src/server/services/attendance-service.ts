import { prisma } from "@/lib/prisma";
import { sortAttendanceByChannelAndOrder } from "@/lib/attendance-order";
import { canAccessProject } from "@/server/auth";
import { writeAudit } from "@/server/audit";
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
