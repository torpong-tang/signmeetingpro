import { readFile } from "node:fs/promises";
import path from "node:path";
import type { getMeetingAttendance } from "./attendance-service";

export type MeetingAttendance = Awaited<
  ReturnType<typeof getMeetingAttendance>
>;
export type Attendance = MeetingAttendance["attendances"][number];

export type AttendancePdfColumn = {
  key: "number" | "name" | "organization" | "contact" | "signature";
  label: string;
  width: number;
  align: "left" | "center";
};

export const ATTENDANCE_PDF_COLUMNS: AttendancePdfColumn[] = [
  {
    key: "number",
    label: "ลำดับ",
    width: 34,
    align: "center",
  },
  {
    key: "name",
    label: "ชื่อ-นามสกุล",
    width: 126,
    align: "left",
  },
  {
    key: "organization",
    label: "ตำแหน่ง หน่วยงาน/สังกัด",
    width: 174,
    align: "left",
  },
  {
    key: "contact",
    label: "โทรศัพท์ (E-mail)",
    width: 92,
    align: "left",
  },
  {
    key: "signature",
    label: "ลายเซ็นต์",
    width: 101,
    align: "center",
  },
];

const STORAGE_ROOT = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  "storage",
);

export function formatAttendanceMeetingDate(value: Date) {
  return new Intl.DateTimeFormat(
    "th-TH-u-ca-buddhist-nu-latn",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(value);
}
async function readSignature(signaturePath: string | null) {
  if (!signaturePath) return null;
  const absolutePath = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    signaturePath.replace(/^[/\\]+/, ""),
  );
  if (!absolutePath.startsWith(`${STORAGE_ROOT}${path.sep}`)) {
    return null;
  }
  try {
    return await readFile(absolutePath);
  } catch {
    return null;
  }
}

export async function loadAttendanceSignatures(
  meeting: MeetingAttendance,
) {
  return Promise.all(
    meeting.attendances.map((attendance) =>
      readSignature(attendance.signaturePath),
    ),
  );
}
