export type MeetingSortKey =
  | "meetingCode"
  | "createdAt"
  | "attendanceCount";

export type MeetingAction =
  | "detail"
  | "attendance"
  | "media"
  | "copy"
  | "edit"
  | "delete";
