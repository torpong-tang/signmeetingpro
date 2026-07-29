import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/server/auth";
import { apiError } from "@/server/http";
import { listGroups } from "@/server/services/group-service";
import { listMeetings } from "@/server/services/meeting-service";
import { listProjects } from "@/server/services/project-service";

export async function GET() {
  try {
    const user = await requireApiUser();
    const projectWhere = user.role === "ADMIN" ? {} : { project: { members: { some: { userId: user.id } } } };
    const [projects, meetings, groups, attendanceCount, pictureStats, documentStats, latestAttendance] = await Promise.all([
      listProjects(user),
      listMeetings(user),
      listGroups(user),
      prisma.attendance.count({ where: { meeting: projectWhere } }),
      prisma.meetingMedia.aggregate({ where: { kind: "PICTURE", meeting: projectWhere }, _count: true, _sum: { sizeBytes: true }, _max: { createdAt: true } }),
      prisma.meetingMedia.aggregate({ where: { kind: "DOCUMENT", meeting: projectWhere }, _count: true, _sum: { sizeBytes: true }, _max: { createdAt: true } }),
      prisma.attendance.findFirst({ where: { meeting: projectWhere }, orderBy: { registeredAt: "desc" }, select: { registeredAt: true } }),
    ]);
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarPath: user.avatarPath,
      },
      projects,
      meetings,
      groups,
      dashboard: {
        projects: { count: projects.length, latestAt: projects[0]?.createdAt ?? null },
        meetings: { count: meetings.length, latestAt: meetings[0]?.createdAt ?? null },
        attendance: { count: attendanceCount, latestAt: latestAttendance?.registeredAt ?? null },
        pictures: { count: pictureStats._count, bytes: pictureStats._sum.sizeBytes ?? 0, latestAt: pictureStats._max.createdAt },
        documents: { count: documentStats._count, bytes: documentStats._sum.sizeBytes ?? 0, latestAt: documentStats._max.createdAt },
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
