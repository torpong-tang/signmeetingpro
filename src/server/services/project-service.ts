import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/server/audit";
import { canAccessProject, isAdmin } from "@/server/auth";
import { projectSchema } from "@/server/validation";

type CurrentUser = Parameters<typeof canAccessProject>[0];

export async function listProjects(user: CurrentUser) {
  return prisma.project.findMany({
    where: isAdmin(user.role) ? undefined : { members: { some: { userId: user.id } } },
    include: { _count: { select: { meetings: true, members: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function createProject(user: CurrentUser, raw: unknown) {
  if (!isAdmin(user.role)) throw new Error("FORBIDDEN");
  const input = projectSchema.parse(raw);
  try {
    const record = await prisma.project.create({
      data: {
        ...input,
        contractStart: input.contractStart ? new Date(`${input.contractStart}T00:00:00.000Z`) : null,
        contractEnd: input.contractEnd ? new Date(`${input.contractEnd}T00:00:00.000Z`) : null,
        members: { create: { userId: user.id } },
      },
    });
    await writeAudit({ userId: user.id, action: "CREATE", entity: "Project", entityId: record.id, summary: `Created project ${record.code}`, newValues: input });
    return record;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("CONFLICT");
    throw error;
  }
}

export async function updateProject(user: CurrentUser, id: string, raw: unknown) {
  if (!isAdmin(user.role)) throw new Error("FORBIDDEN");
  const input = projectSchema.parse(raw);
  const oldRecord = await prisma.project.findUnique({ where: { id } });
  if (!oldRecord) throw new Error("NOT_FOUND");
  const record = await prisma.project.update({
    where: { id },
    data: {
      ...input,
      contractStart: input.contractStart ? new Date(`${input.contractStart}T00:00:00.000Z`) : null,
      contractEnd: input.contractEnd ? new Date(`${input.contractEnd}T00:00:00.000Z`) : null,
    },
  });
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "Project", entityId: id, summary: `Updated project ${record.code}`, oldValues: oldRecord, newValues: input });
  return record;
}

export async function deleteProject(user: CurrentUser, id: string) {
  if (!isAdmin(user.role)) throw new Error("FORBIDDEN");
  const record = await prisma.project.findUnique({ where: { id }, include: { _count: { select: { meetings: true } } } });
  if (!record) throw new Error("NOT_FOUND");
  if (record._count.meetings > 0) throw new Error("POLICY:Projects with meetings must be deactivated instead of deleted.");
  await prisma.project.delete({ where: { id } });
  await writeAudit({ userId: user.id, action: "DELETE", entity: "Project", entityId: id, summary: `Deleted project ${record.code}`, oldValues: record });
}
