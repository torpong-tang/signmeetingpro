import { destroySession, getCurrentUser } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { apiError } from "@/server/http";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) await writeAudit({ userId: user.id, action: "LOGOUT", entity: "Session", summary: `Logout ${user.email}` });
    await destroySession();
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
