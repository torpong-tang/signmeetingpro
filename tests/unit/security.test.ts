import assert from "node:assert/strict";
import { test } from "vitest";
import { createOpaqueToken, hashToken, safeJson } from "../../src/lib/security";

test("opaque session tokens are unique and hash deterministically", () => {
  const first = createOpaqueToken();
  const second = createOpaqueToken();
  assert.notEqual(first, second);
  assert.equal(hashToken(first), hashToken(first));
  assert.notEqual(hashToken(first), first);
});

test("audit JSON redacts secret-like string values", () => {
  const output = safeJson({ password: "secret", accessToken: "token", title: "visible" });
  assert.match(output, /\[REDACTED\]/);
  assert.doesNotMatch(output, /secret/);
  assert.match(output, /visible/);
});
