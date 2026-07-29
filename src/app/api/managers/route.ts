import { requireApiUser } from "@/server/auth";
import { apiError, readJson } from "@/server/http";
import { createManager, listManagers } from "@/server/services/manager-service";

export async function GET() {
  try {
    return Response.json(await listManagers(await requireApiUser()));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    return Response.json(await createManager(await requireApiUser(), await readJson(request)), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
