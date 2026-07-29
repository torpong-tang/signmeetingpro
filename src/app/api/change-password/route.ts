import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { destroyAllUserSessions, requireApiUser } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { apiError, readJson } from "@/server/http";

const schema = z.object({
  currentPassword: z.string().min(8).max(200),
  newPassword: z.string().min(12).max(200),
}).refine((data) => data.currentPassword !== data.newPassword, {
  path: ["newPassword"],
  message: "New password must differ from the current password.",
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = schema.parse(await readJson(request));
    const record = await prisma.user.findUnique({ where: { id: user.id } });
    if (!record || !await bcrypt.compare(input.currentPassword, record.passwordHash)) {
      return Response.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(input.newPassword, 12) } });
    await writeAudit({ userId: user.id, action: "UPDATE", entity: "User", entityId: user.id, summary: "Changed own password" });
    await destroyAllUserSessions(user.id);
    return Response.json({ ok: true, signedOut: true });
  } catch (error) {
    return apiError(error);
  }
}
