import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { apiError, readJson } from "@/server/http";

const schema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(40).optional().nullable(),
});

export async function PUT(request: Request) {
  try {
    const user = await requireApiUser();
    const input = schema.parse(await readJson(request));
    const record = await prisma.user.update({ where: { id: user.id }, data: { ...input, phone: input.phone || null } });
    await writeAudit({ userId: user.id, action: "UPDATE", entity: "User", entityId: user.id, summary: "Updated own profile", newValues: input });
    return Response.json({ id: record.id, firstName: record.firstName, lastName: record.lastName, phone: record.phone });
  } catch (error) {
    return apiError(error);
  }
}
