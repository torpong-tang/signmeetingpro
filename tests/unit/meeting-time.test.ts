import assert from "node:assert/strict";
import { test } from "vitest";
import {
  allowedRegistrationLimits,
  clampRegistrationLimit,
  meetingDurationMinutes,
} from "../../src/lib/meeting-time";

test("meeting duration requires the end time to be later", () => {
  assert.equal(meetingDurationMinutes("17:00", "18:00"), 60);
  assert.equal(meetingDurationMinutes("18:00", "17:00"), 0);
  assert.equal(meetingDurationMinutes("17:00", "17:00"), 0);
});

test("registration options never exceed the meeting duration", () => {
  assert.deepEqual(
    allowedRegistrationLimits("17:00", "18:00"),
    [5, 10, 15, 20, 30, 45, 60],
  );
});

test("registration limit is reduced when the meeting becomes shorter", () => {
  assert.equal(clampRegistrationLimit(120, "17:00", "18:00"), 60);
});
