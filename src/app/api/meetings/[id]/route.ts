import { requireApiUser } from "@/server/auth";
import { apiError, readJson } from "@/server/http";
import { deleteMeeting, getMeeting, updateMeeting } from "@/server/services/meeting-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await getMeeting(await requireApiUser(), id));
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await updateMeeting(await requireApiUser(), id, await readJson(request)));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await deleteMeeting(await requireApiUser(), id));
  } catch (error) {
    return apiError(error);
  }
}
