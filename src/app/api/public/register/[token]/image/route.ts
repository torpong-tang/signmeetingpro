import { apiError } from "@/server/http";
import { readPublicQrChannelImage } from "@/server/services/qr-channel-image-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const image = await readPublicQrChannelImage(token);
    return new Response(new Uint8Array(image.bytes), {
      headers: {
        "content-type": image.mimeType,
        "content-length": String(image.bytes.byteLength),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
