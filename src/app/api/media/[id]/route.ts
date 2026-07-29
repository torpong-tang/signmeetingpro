import { requireApiUser } from "@/server/auth";
import { apiError } from "@/server/http";
import { deleteMedia, downloadMedia } from "@/server/services/media-service";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { record, bytes } = await downloadMedia(await requireApiUser(), id);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const encodedName = encodeURIComponent(record.originalName);
    return new Response(bytes, {
      headers: {
        "content-type": record.mimeType,
        "content-length": String(bytes.byteLength),
        "content-disposition": `${download ? "attachment" : "inline"}; filename="attachment"; filename*=UTF-8''${encodedName}`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteMedia(await requireApiUser(), id);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
