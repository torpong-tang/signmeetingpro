import { z } from "zod";

export const attendanceUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  position: z.string().trim().min(1).max(150),
  department: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.union([z.string().trim().email().max(200), z.literal("")]).optional().nullable(),
});

export function resolveAttendanceDepartment(
  mode: "GROUP" | "OPEN",
  channelAlias: string,
  requestedDepartment: string | null | undefined,
) {
  const department = mode === "GROUP"
    ? channelAlias.trim()
    : requestedDepartment?.trim();
  if (!department) {
    throw new Error("POLICY:Organization / affiliation is required for open registration.");
  }
  return department;
}
