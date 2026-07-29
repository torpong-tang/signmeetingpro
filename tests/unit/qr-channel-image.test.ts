import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_QR_CHANNEL_IMAGE_BYTES,
  validateQrChannelImage,
} from "../../src/lib/qr-channel-image";

test("QR channel image validation accepts PNG content", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const result = validateQrChannelImage("image/png", png.length, png);
  assert.equal(result.extension, ".png");
});

test("QR channel image validation rejects a spoofed image MIME type", () => {
  const text = new TextEncoder().encode("not an image");
  assert.throws(
    () => validateQrChannelImage("image/png", text.length, text),
    /valid JPG, PNG or WebP/,
  );
});

test("QR channel image validation enforces the 2 MB limit", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.throws(
    () => validateQrChannelImage(
      "image/png",
      MAX_QR_CHANNEL_IMAGE_BYTES + 1,
      png,
    ),
    /must not exceed 2 MB/,
  );
});
