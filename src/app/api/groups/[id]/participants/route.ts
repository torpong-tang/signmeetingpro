import { requireApiUser } from "@/server/auth";
import { apiError, readJson } from "@/server/http";
import { createParticipant } from "@/server/services/group-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await createParticipant(await requireApiUser(), id, await readJson(request)), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
