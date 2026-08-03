import assert from "node:assert/strict";
import { test } from "vitest";
import { DEFAULT_UI_PREFERENCES, parseUiPreferences } from "../../src/lib/ui-preferences";

test("UI preferences use safe defaults for missing or invalid storage", () => {
  assert.deepEqual(parseUiPreferences(null), DEFAULT_UI_PREFERENCES);
  assert.deepEqual(parseUiPreferences("not-json"), DEFAULT_UI_PREFERENCES);
});

test("UI preferences restore supported values", () => {
  assert.deepEqual(
    parseUiPreferences(JSON.stringify({ locale: "en", fontSize: "large", highContrast: true })),
    { locale: "en", fontSize: "large", highContrast: true },
  );
});

test("UI preferences reject unsupported stored values", () => {
  assert.deepEqual(
    parseUiPreferences(JSON.stringify({ locale: "de", fontSize: "huge", highContrast: "yes" })),
    DEFAULT_UI_PREFERENCES,
  );
});
