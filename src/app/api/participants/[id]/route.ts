import { requireApiUser } from "@/server/auth";
import { apiError, readJson } from "@/server/http";
import { deleteParticipant, updateParticipant } from "@/server/services/group-service";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await updateParticipant(await requireApiUser(), id, await readJson(request)));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteParticipant(await requireApiUser(), id);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
