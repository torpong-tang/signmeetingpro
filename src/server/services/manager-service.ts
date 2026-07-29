import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/server/audit";
import { isAdmin } from "@/server/auth";
import { managerSchema } from "@/server/validation";

type CurrentUser = { id: string; role: "ADMIN" | "MEETING_MANAGER" };

const managerSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  active: true,
  createdAt: true,
  projects: { select: { projectId: true, project: { select: { code: true, name: true } } } },
} satisfies Prisma.UserSelect;

export async function listManagers(user: CurrentUser) {
  if (!isAdmin(user.role)) throw new Error("FORBIDDEN");
  return prisma.user.findMany({ select: managerSelect, orderBy: [{ role: "asc" }, { firstName: "asc" }] });
}

export async function createManager(user: CurrentUser, raw: unknown) {
  if (!isAdmin(user.role)) throw new Error("FORBIDDEN");
  const input = managerSchema.parse(raw);
  if (!input.password) throw new Error("POLICY:Password is required for a new manager.");
  try {
    const record = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, 12),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        role: input.role,
        active: input.active,
        projects: { create: input.projectIds.map((projectId) => ({ projectId })) },
      },
      select: managerSelect,
    });
    await writeAudit({ userId: user.id, action: "CREATE", entity: "User", entityId: record.id, summary: `Created meeting manager ${record.email}`, newValues: { ...input, password: "[REDACTED]" } });
    return record;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("CONFLICT");
    throw error;
  }
}

export async function updateManager(user: CurrentUser, id: string, raw: unknown) {
  if (!isAdmin(user.role)) throw new Error("FORBIDDEN");
  const input = managerSchema.parse(raw);
  const oldRecord = await prisma.user.findUnique({ where: { id }, select: managerSelect });
  if (!oldRecord) throw new Error("NOT_FOUND");
  if (user.id === id && !input.active) throw new Error("POLICY:You cannot deactivate your own account.");

  const record = await prisma.$transaction(async (tx) => {
    await tx.projectMember.deleteMany({ where: { userId: id } });
    return tx.user.update({
      where: { id },
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        role: input.role,
        active: input.active,
        ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 12) } : {}),
        projects: { create: input.projectIds.map((projectId) => ({ projectId })) },
      },
      select: managerSelect,
    });
  });
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "User", entityId: id, summary: `Updated meeting manager ${record.email}`, oldValues: oldRecord, newValues: { ...input, password: input.password ? "[REDACTED]" : undefined } });
  return record;
}

export async function deleteManager(user: CurrentUser, id: string) {
  if (!isAdmin(user.role)) throw new Error("FORBIDDEN");
  if (user.id === id) throw new Error("POLICY:You cannot delete your own account.");
  const record = await prisma.user.findUnique({ where: { id }, include: { _count: { select: { meetings: true } } } });
  if (!record) throw new Error("NOT_FOUND");
  if (record._count.meetings > 0) throw new Error("POLICY:Managers with meetings must be deactivated instead of deleted.");
  await prisma.user.delete({ where: { id } });
  await writeAudit({ userId: user.id, action: "DELETE", entity: "User", entityId: id, summary: `Deleted meeting manager ${record.email}` });
}
