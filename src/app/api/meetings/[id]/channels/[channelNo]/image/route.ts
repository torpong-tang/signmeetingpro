import { requireApiUser } from "@/server/auth";
import { apiError } from "@/server/http";
import {
  deleteQrChannelImage,
  readAuthorizedQrChannelImage,
  uploadQrChannelImage,
} from "@/server/services/qr-channel-image-service";

type RouteContext = {
  params: Promise<{ id: string; channelNo: string }>;
};

function imageResponse(bytes: Buffer, mimeType: string) {
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": mimeType,
      "content-length": String(bytes.byteLength),
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id, channelNo } = await context.params;
    const image = await readAuthorizedQrChannelImage(
      await requireApiUser(),
      id,
      channelNo,
    );
    return imageResponse(image.bytes, image.mimeType);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id, channelNo } = await context.params;
    return Response.json(
      await uploadQrChannelImage(
        await requireApiUser(),
        id,
        channelNo,
        await request.formData(),
      ),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, channelNo } = await context.params;
    return Response.json(
      await deleteQrChannelImage(await requireApiUser(), id, channelNo),
    );
  } catch (error) {
    return apiError(error);
  }
}
