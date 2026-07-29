import { createHash, randomBytes } from "node:crypto";

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeJson(value: unknown) {
  return JSON.stringify(value, (_key, item) => {
    if (typeof item === "string" && /password|token|secret/i.test(item)) return "[REDACTED]";
    return item;
  });
}
