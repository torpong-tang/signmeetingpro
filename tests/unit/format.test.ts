import assert from "node:assert/strict";
import test from "node:test";
import {
  formatBuddhistDateInput,
  formatThaiDate,
  formatThaiDateTime,
  getBuddhistYear,
} from "../../src/lib/format";

test("date picker display converts an ISO date to Buddhist Era", () => {
  assert.equal(formatBuddhistDateInput("2026-07-27"), "27/07/2569");
});

test("date picker display rejects a non-ISO value", () => {
  assert.equal(formatBuddhistDateInput("27/07/2569"), "");
});

test("application date and date-time formatters use Buddhist Era", () => {
  const date = formatThaiDate("2026-07-27");
  const dateTime = formatThaiDateTime("2026-07-27T03:30:00.000Z");

  assert.match(date, /2569/);
  assert.doesNotMatch(date, /2026/);
  assert.match(dateTime, /2569/);
  assert.doesNotMatch(dateTime, /2026/);
});

test("meeting year is calculated in Buddhist Era using Bangkok time", () => {
  assert.equal(getBuddhistYear(new Date("2026-07-27T00:00:00.000Z")), 2569);
});
