import type { AttendanceRecord } from "@/types/app";

export function effectiveAttendanceOrder(attendance: AttendanceRecord) {
  return attendance.displayOrder > 0
    ? attendance.displayOrder
    : attendance.personNo;
}
export function orderedChannelAttendances(
  attendances: AttendanceRecord[],
  channelId: string,
) {
  return attendances
    .filter((attendance) => attendance.channel.id === channelId)
    .sort(
      (left, right) =>
        effectiveAttendanceOrder(left) -
          effectiveAttendanceOrder(right) ||
        left.personNo - right.personNo,
    );
}
