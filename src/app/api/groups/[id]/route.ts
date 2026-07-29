import { requireApiUser } from "@/server/auth";
import { apiError, readJson } from "@/server/http";
import { deleteGroup, updateGroup } from "@/server/services/group-service";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await updateGroup(await requireApiUser(), id, await readJson(request)));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteGroup(await requireApiUser(), id);
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
