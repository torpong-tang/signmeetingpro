import { requireApiUser } from "@/server/auth";
import { apiError } from "@/server/http";
import { listMedia, uploadMedia } from "@/server/services/media-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await listMedia(await requireApiUser(), id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await uploadMedia(await requireApiUser(), id, await request.formData()), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
