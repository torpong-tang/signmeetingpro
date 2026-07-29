import { requireApiUser } from "@/server/auth";
import { apiError, readJson } from "@/server/http";
import {
  getMeetingAttendance,
  reorderMeetingAttendance,
} from "@/server/services/attendance-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const meeting = await getMeetingAttendance(await requireApiUser(), id);
    return Response.json({
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meetingCode,
        title: meeting.title,
        channels: meeting.channels,
      },
      attendances: meeting.attendances,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const meeting = await reorderMeetingAttendance(
      await requireApiUser(),
      id,
      await readJson(request),
    );
    return Response.json({
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meetingCode,
        title: meeting.title,
        channels: meeting.channels,
      },
      attendances: meeting.attendances,
    });
  } catch (error) {
    return apiError(error);
  }
}
