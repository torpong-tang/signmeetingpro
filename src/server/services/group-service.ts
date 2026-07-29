import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/server/audit";
import type { requireApiUser } from "@/server/auth";
import { groupSchema, participantSchema } from "@/server/validation";

type CurrentUser = Awaited<ReturnType<typeof requireApiUser>>;
type ParticipantInput = ReturnType<typeof participantSchema.parse>;

function participantDataForGroup(input: ParticipantInput, groupName: string) {
  return {
    ...input,
    department: groupName,
    email: input.email || null,
  };
}

export async function listGroups(user: CurrentUser) {
  void user;
  return prisma.participantGroup.findMany({
    include: {
      participants: { orderBy: [{ lastName: "asc" }, { firstName: "asc" }] },
      _count: { select: { participants: true } },
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function createGroup(user: CurrentUser, raw: unknown) {
  const input = groupSchema.parse(raw);
  const record = await prisma.participantGroup.create({ data: { ...input, createdById: user.id } });
  await writeAudit({ userId: user.id, action: "CREATE", entity: "ParticipantGroup", entityId: record.id, summary: `Created global participant group ${record.name}`, newValues: input });
  return record;
}

export async function updateGroup(user: CurrentUser, id: string, raw: unknown) {
  const input = groupSchema.parse(raw);
  const oldRecord = await prisma.participantGroup.findUnique({ where: { id } });
  if (!oldRecord) throw new Error("NOT_FOUND");
  const record = await prisma.$transaction(async (tx) => {
    const updatedGroup = await tx.participantGroup.update({ where: { id }, data: input });
    await tx.participant.updateMany({
      where: { groupId: id },
      data: { department: updatedGroup.name },
    });
    return updatedGroup;
  });
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "ParticipantGroup", entityId: id, summary: `Updated global participant group ${record.name}`, oldValues: oldRecord, newValues: input });
  return record;
}

export async function deleteGroup(user: CurrentUser, id: string) {
  const record = await prisma.participantGroup.findUnique({ where: { id }, include: { _count: { select: { channels: true } } } });
  if (!record) throw new Error("NOT_FOUND");
  if (record._count.channels > 0) throw new Error("POLICY:Groups used by meeting QR channels must be deactivated instead of deleted.");
  await prisma.participantGroup.delete({ where: { id } });
  await writeAudit({ userId: user.id, action: "DELETE", entity: "ParticipantGroup", entityId: id, summary: `Deleted global participant group ${record.name}` });
}

export async function createParticipant(user: CurrentUser, groupId: string, raw: unknown) {
  const input = participantSchema.parse(raw);
  const group = await prisma.participantGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("NOT_FOUND");
  const effectiveInput = participantDataForGroup(input, group.name);
  const record = await prisma.participant.create({ data: { groupId, ...effectiveInput } });
  await writeAudit({ userId: user.id, action: "CREATE", entity: "Participant", entityId: record.id, summary: `Added ${record.firstName} ${record.lastName} to ${group.name}`, newValues: effectiveInput });
  return record;
}

export async function updateParticipant(user: CurrentUser, id: string, raw: unknown) {
  const input = participantSchema.parse(raw);
  const oldRecord = await prisma.participant.findUnique({ where: { id }, include: { group: true } });
  if (!oldRecord) throw new Error("NOT_FOUND");
  const effectiveInput = participantDataForGroup(input, oldRecord.group.name);
  const record = await prisma.participant.update({ where: { id }, data: effectiveInput });
  await writeAudit({ userId: user.id, action: "UPDATE", entity: "Participant", entityId: id, summary: `Updated participant ${record.firstName} ${record.lastName}`, oldValues: oldRecord, newValues: effectiveInput });
  return record;
}

export async function deleteParticipant(user: CurrentUser, id: string) {
  const record = await prisma.participant.findUnique({ where: { id }, include: { group: true, _count: { select: { attendances: true } } } });
  if (!record) throw new Error("NOT_FOUND");
  if (record._count.attendances > 0) {
    await prisma.participant.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.participant.delete({ where: { id } });
  }
  await writeAudit({ userId: user.id, action: "DELETE", entity: "Participant", entityId: id, summary: `${record._count.attendances > 0 ? "Deactivated" : "Deleted"} participant ${record.firstName} ${record.lastName}` });
}
