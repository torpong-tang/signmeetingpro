import assert from "node:assert/strict";
import test from "node:test";
import { sortAttendanceByChannelAndOrder } from "../../src/lib/attendance-order";

test("attendance PDF puts QR Channel 2 first and respects channel order", () => {
  const result = sortAttendanceByChannelAndOrder([
    {
      id: "channel-1-second",
      personNo: 4,
      displayOrder: 2,
      channel: { channelNo: 1 },
    },
    {
      id: "channel-2-second",
      personNo: 2,
      displayOrder: 2,
      channel: { channelNo: 2 },
    },
    {
      id: "channel-1-first",
      personNo: 3,
      displayOrder: 1,
      channel: { channelNo: 1 },
    },
    {
      id: "channel-2-first",
      personNo: 1,
      displayOrder: 1,
      channel: { channelNo: 2 },
    },
  ]);

  assert.deepEqual(
    result.map((record) => record.id),
    [
      "channel-2-first",
      "channel-2-second",
      "channel-1-first",
      "channel-1-second",
    ],
  );
});

test("attendance PDF falls back to registration number for legacy rows", () => {
  const result = sortAttendanceByChannelAndOrder([
    {
      id: "later",
      personNo: 9,
      displayOrder: 0,
      channel: { channelNo: 2 },
    },
    {
      id: "earlier",
      personNo: 5,
      displayOrder: 0,
      channel: { channelNo: 2 },
    },
  ]);

  assert.deepEqual(
    result.map((record) => record.id),
    ["earlier", "later"],
  );
});
