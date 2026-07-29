import { requireApiUser } from "@/server/auth";
import { apiError, readJson } from "@/server/http";
import { createGroup, listGroups } from "@/server/services/group-service";

export async function GET() {
  try {
    return Response.json(await listGroups(await requireApiUser()));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    return Response.json(await createGroup(await requireApiUser(), await readJson(request)), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
