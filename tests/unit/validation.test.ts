import assert from "node:assert/strict";
import test from "node:test";
import { groupSchema, meetingSchema, projectSchema } from "../../src/server/validation";

const validMeeting = {
  projectId: "project-1",
  title: "Project kickoff",
  agenda: "Scope and execution",
  meetingDate: "2026-08-01",
  startTime: "09:00",
  endTime: "10:00",
  location: "Meeting Room A",
  registerLimitMinutes: 20,
  allowLateRegistration: false,
  channels: [
    { channelNo: 1, mode: "GROUP", groupId: "group-a", aliasName: "TPT Team" },
    { channelNo: 2, mode: "OPEN", groupId: null, aliasName: "" },
  ],
};

test("meeting validation accepts two valid QR channels", () => {
  assert.equal(meetingSchema.parse(validMeeting).channels.length, 2);
});

test("meeting validation allows OPEN registration without a preset organization", () => {
  const result = meetingSchema.safeParse({
    ...validMeeting,
    channels: [
      validMeeting.channels[0],
      { ...validMeeting.channels[1], aliasName: "   " },
    ],
  });

  assert.equal(result.success, true);
});

test("meeting validation requires an organization for GROUP registration", () => {
  const result = meetingSchema.safeParse({
    ...validMeeting,
    channels: [
      { ...validMeeting.channels[0], aliasName: "   " },
      validMeeting.channels[1],
    ],
  });

  assert.equal(result.success, false);
});

test("meeting validation rejects an end time before start time", () => {
  const result = meetingSchema.safeParse({ ...validMeeting, endTime: "08:30" });
  assert.equal(result.success, false);
});

test("meeting validation rejects an end time equal to start time", () => {
  const result = meetingSchema.safeParse({ ...validMeeting, endTime: "09:00" });
  assert.equal(result.success, false);
});

test("meeting validation rejects a registration period longer than the meeting", () => {
  const result = meetingSchema.safeParse({
    ...validMeeting,
    startTime: "17:00",
    endTime: "18:00",
    registerLimitMinutes: 120,
  });
  assert.equal(result.success, false);
});

test("meeting validation accepts a registration period equal to the meeting", () => {
  const result = meetingSchema.safeParse({
    ...validMeeting,
    startTime: "17:00",
    endTime: "18:00",
    registerLimitMinutes: 60,
  });
  assert.equal(result.success, true);
});

test("meeting validation requires channel 1 to use a group", () => {
  const result = meetingSchema.safeParse({
    ...validMeeting,
    channels: [
      { channelNo: 1, mode: "OPEN", groupId: null, aliasName: "Open" },
      validMeeting.channels[1],
    ],
  });
  assert.equal(result.success, false);
});

test("meeting validation rejects duplicate participant groups across QR channels", () => {
  const result = meetingSchema.safeParse({
    ...validMeeting,
    channels: [
      { channelNo: 1, mode: "GROUP", groupId: "group-a", aliasName: "Internal" },
      { channelNo: 2, mode: "GROUP", groupId: "group-a", aliasName: "External" },
    ],
  });
  assert.equal(result.success, false);
});

test("participant group validation is independent from projects", () => {
  const group = groupSchema.parse({
    name: "External stakeholders",
    description: "Reusable for meetings in any project",
    active: true,
  });

  assert.equal(group.name, "External stakeholders");
  assert.equal("projectId" in group, false);
});

test("project validation rejects a reversed contract period", () => {
  const result = projectSchema.safeParse({
    code: "TEST",
    name: "Test project",
    contractStart: "2026-12-31",
    contractEnd: "2026-01-01",
    active: true,
  });
  assert.equal(result.success, false);
});
