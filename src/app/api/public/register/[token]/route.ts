import { apiError, readJson } from "@/server/http";
import { getRegistrationContext, registerAttendance } from "@/server/services/registration-service";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    return Response.json(await getRegistrationContext(token));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    return Response.json(await registerAttendance(token, await readJson(request)), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
