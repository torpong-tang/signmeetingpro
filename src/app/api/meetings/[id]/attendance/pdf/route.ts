import { requireApiUser } from "@/server/auth";
import { apiError } from "@/server/http";
import { getMeetingAttendance } from "@/server/services/attendance-service";
import { createPortraitAttendancePdf } from "@/server/services/attendance-report-service";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const meeting = await getMeetingAttendance(await requireApiUser(), id);
    const pdf = await createPortraitAttendancePdf(meeting);
    const disposition = new URL(request.url).searchParams.get("preview") === "1"
      ? "inline"
      : "attachment";
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${meeting.meetingCode}-attendance-portrait.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
