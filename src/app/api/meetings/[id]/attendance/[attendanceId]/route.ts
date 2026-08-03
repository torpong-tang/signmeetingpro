import { requireApiUser } from "@/server/auth";
import { apiError, readJson } from "@/server/http";
import {
  deleteMeetingAttendance,
  updateMeetingAttendance,
} from "@/server/services/attendance-service";

type RouteContext = {
  params: Promise<{ id: string; attendanceId: string }>;
};

function responsePayload(meeting: Awaited<ReturnType<typeof updateMeetingAttendance>>) {
  return {
    meeting: {
      id: meeting.id,
      meetingCode: meeting.meetingCode,
      title: meeting.title,
      channels: meeting.channels,
    },
    attendances: meeting.attendances,
  };
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id, attendanceId } = await context.params;
    const meeting = await updateMeetingAttendance(
      await requireApiUser(),
      id,
      attendanceId,
      await readJson(request),
    );
    return Response.json(responsePayload(meeting));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, attendanceId } = await context.params;
    const meeting = await deleteMeetingAttendance(
      await requireApiUser(),
      id,
      attendanceId,
    );
    return Response.json(responsePayload(meeting));
  } catch (error) {
    return apiError(error);
  }
}
