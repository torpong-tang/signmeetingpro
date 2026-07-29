import { z } from "zod";
import { meetingDurationMinutes } from "@/lib/meeting-time";
import { hasDuplicateParticipantGroups } from "@/lib/meeting-channel-policy";

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
});

export const projectSchema = z.object({
  code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(2).max(200),
  contractNumber: z.string().trim().max(100).optional().nullable(),
  contractStart: z.string().date().optional().nullable(),
  contractEnd: z.string().date().optional().nullable(),
  active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.contractStart && data.contractEnd && data.contractEnd < data.contractStart) {
    ctx.addIssue({ code: "custom", path: ["contractEnd"], message: "Contract end must be after start." });
  }
});

export const managerSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(200).optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(40).optional().nullable(),
  role: z.enum(["ADMIN", "MEETING_MANAGER"]).default("MEETING_MANAGER"),
  active: z.boolean().default(true),
  projectIds: z.array(z.string().min(1)).default([]),
});

export const groupSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).optional().nullable(),
  active: z.boolean().default(true),
});

export const participantSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  position: z.string().trim().min(1).max(160),
  department: z.string().trim().max(160).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional().nullable(),
  active: z.boolean().default(true),
});

const channelSchema = z.object({
  channelNo: z.union([z.literal(1), z.literal(2)]),
  mode: z.enum(["GROUP", "OPEN"]),
  groupId: z.string().min(1).optional().nullable(),
  aliasName: z.string().trim().max(160),
}).superRefine((data, ctx) => {
  if (data.channelNo === 1 && data.mode !== "GROUP") {
    ctx.addIssue({ code: "custom", path: ["mode"], message: "Channel 1 must use a participant group." });
  }
  if (data.mode === "GROUP" && !data.groupId) {
    ctx.addIssue({ code: "custom", path: ["groupId"], message: "Select a participant group." });
  }
  if (data.mode === "GROUP" && !data.aliasName) {
    ctx.addIssue({
      code: "custom",
      path: ["aliasName"],
      message: "Organization/department name is required for group registration.",
    });
  }
});

export const meetingSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(2).max(250),
  agenda: z.string().trim().max(2000).optional().nullable(),
  meetingDate: z.string().date(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  location: z.string().trim().min(2).max(250),
  registerLimitMinutes: z.number().int().min(5).max(720),
  allowLateRegistration: z.boolean().default(false),
  channels: z.array(channelSchema).length(2),
}).superRefine((data, ctx) => {
  const duration = meetingDurationMinutes(data.startTime, data.endTime);
  if (!duration) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time." });
  } else if (data.registerLimitMinutes > duration) {
    ctx.addIssue({
      code: "custom",
      path: ["registerLimitMinutes"],
      message: "Registration time must not exceed the meeting duration.",
    });
  }
  if (data.channels[0]?.channelNo !== 1 || data.channels[1]?.channelNo !== 2) {
    ctx.addIssue({ code: "custom", path: ["channels"], message: "Both QR channels are required." });
  }
  if (hasDuplicateParticipantGroups(data.channels)) {
    ctx.addIssue({
      code: "custom",
      path: ["channels", 1, "groupId"],
      message: "QR channels must use different participant groups.",
    });
  }
});
