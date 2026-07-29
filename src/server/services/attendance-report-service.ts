import { renderPortraitAttendancePdf } from "./attendance-pdf-renderer";
import {
  loadAttendanceSignatures,
  type MeetingAttendance,
} from "./attendance-report-model";

export async function createPortraitAttendancePdf(
  meeting: MeetingAttendance,
) {
  const signatures = await loadAttendanceSignatures(meeting);
  return renderPortraitAttendancePdf(meeting, signatures);
}
