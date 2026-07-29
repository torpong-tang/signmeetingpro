import type { AuditAction } from "@prisma/client";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { safeJson } from "@/lib/security";

type AuditRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

async function resolveRequestContext(
  context?: AuditRequestContext,
): Promise<AuditRequestContext> {
  if (context) return context;
  try {
    const headerList = await headers();
    return {
      ipAddress:
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headerList.get("x-real-ip"),
      userAgent: headerList.get("user-agent"),
    };
  } catch {
    return {};
  }
}

export async function writeAudit(input: {
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string;
  summary: string;
  oldValues?: unknown;
  newValues?: unknown;
  requestContext?: AuditRequestContext;
}) {
  const requestContext = await resolveRequestContext(input.requestContext);
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      summary: input.summary,
      oldValues: input.oldValues === undefined ? null : safeJson(input.oldValues),
      newValues: input.newValues === undefined ? null : safeJson(input.newValues),
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    },
  });
}
