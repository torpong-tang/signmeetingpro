import { requireApiUser } from "@/server/auth";
import { apiError, readJson } from "@/server/http";
import { createProject, listProjects } from "@/server/services/project-service";

export async function GET() {
  try {
    return Response.json(await listProjects(await requireApiUser()));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    return Response.json(await createProject(await requireApiUser(), await readJson(request)), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
