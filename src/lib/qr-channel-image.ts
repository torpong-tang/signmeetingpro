export const MAX_QR_CHANNEL_IMAGE_BYTES = 2 * 1024 * 1024;

const supportedImages = {
  "image/jpeg": {
    extension: ".jpg",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 3
      && bytes[0] === 0xff
      && bytes[1] === 0xd8
      && bytes[2] === 0xff,
  },
  "image/png": {
    extension: ".png",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 8
      && bytes[0] === 0x89
      && bytes[1] === 0x50
      && bytes[2] === 0x4e
      && bytes[3] === 0x47
      && bytes[4] === 0x0d
      && bytes[5] === 0x0a
      && bytes[6] === 0x1a
      && bytes[7] === 0x0a,
  },
  "image/webp": {
    extension: ".webp",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
  },
} as const;

export type QrChannelImageMime = keyof typeof supportedImages;

export function validateQrChannelImage(
  mimeType: string,
  sizeBytes: number,
  bytes: Uint8Array,
) {
  if (sizeBytes <= 0) {
    throw new Error("POLICY:Empty image files are not allowed.");
  }
  if (sizeBytes > MAX_QR_CHANNEL_IMAGE_BYTES) {
    throw new Error("POLICY:QR channel images must not exceed 2 MB.");
  }
  const image = supportedImages[mimeType as QrChannelImageMime];
  if (!image || !image.matches(bytes)) {
    throw new Error("POLICY:QR channel images must be valid JPG, PNG or WebP files.");
  }
  return {
    mimeType: mimeType as QrChannelImageMime,
    extension: image.extension,
  };
}

export function qrChannelImageMimeFromPath(imagePath: string) {
  if (imagePath.endsWith(".jpg")) return "image/jpeg";
  if (imagePath.endsWith(".png")) return "image/png";
  if (imagePath.endsWith(".webp")) return "image/webp";
  throw new Error("POLICY:Unsupported QR channel image.");
}
