import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { apiError, readJson } from "@/server/http";
import { loginSchema } from "@/server/validation";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await readJson(request));
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const valid = user?.active && await bcrypt.compare(input.password, user.passwordHash);
    if (!user || !valid) {
      return Response.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }
    await createSession(user.id);
    await writeAudit({ userId: user.id, action: "LOGIN", entity: "Session", summary: `Login ${user.email}` });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
