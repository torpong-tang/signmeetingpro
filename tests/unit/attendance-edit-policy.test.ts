import assert from "node:assert/strict";
import { test } from "vitest";
import {
  attendanceUpdateSchema,
  resolveAttendanceDepartment,
} from "../../src/lib/attendance-edit-policy";

test("attendance edit accepts only report fields and strips immutable system fields", () => {
  const parsed = attendanceUpdateSchema.parse({
    firstName: "  Somchai  ",
    lastName: "Tester",
    position: "QA",
    department: "Test Office",
    phone: "0812345678",
    email: "somchai@example.com",
    meetingId: "cannot-change",
    channelId: "cannot-change",
    personNo: 99,
    displayOrder: 99,
    registeredAt: "2099-01-01",
    signaturePath: "/replacement.png",
  });

  assert.deepEqual(parsed, {
    firstName: "Somchai",
    lastName: "Tester",
    position: "QA",
    department: "Test Office",
    phone: "0812345678",
    email: "somchai@example.com",
  });
});

test("group registration always keeps the QR channel organization", () => {
  assert.equal(resolveAttendanceDepartment("GROUP", "PPEA Team", "Injected organization"), "PPEA Team");
});

test("open registration requires an organization", () => {
  assert.throws(
    () => resolveAttendanceDepartment("OPEN", "", "  "),
    /Organization \/ affiliation is required/,
  );
});
