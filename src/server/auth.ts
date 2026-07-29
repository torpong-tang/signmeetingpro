import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOpaqueToken, hashToken } from "@/lib/security";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "signmeetingpro_session";
const TTL_HOURS = Math.max(1, Number(process.env.SESSION_TTL_HOURS || 12));
const IDLE_MINUTES = Math.max(5, Number(process.env.SESSION_IDLE_MINUTES || 60));
const MAX_ACTIVE_SESSIONS = Math.max(1, Number(process.env.SESSION_MAX_ACTIVE || 3));

export async function createSession(userId: string) {
  const token = createOpaqueToken();
  const absoluteExpiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
  const expiresAt = new Date(
    Math.min(
      absoluteExpiresAt.getTime(),
      Date.now() + IDLE_MINUTES * 60 * 1000,
    ),
  );

  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: new Date() } },
          { userId, user: { active: false } },
        ],
      },
    });
    const staleSessions = await tx.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: MAX_ACTIVE_SESSIONS - 1,
      select: { id: true },
    });
    if (staleSessions.length > 0) {
      await tx.session.deleteMany({
        where: { id: { in: staleSessions.map((session) => session.id) } },
      });
    }
    await tx.session.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    });
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: absoluteExpiresAt,
    maxAge: TTL_HOURS * 60 * 60,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(COOKIE_NAME);
}

export async function destroyAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          projects: { select: { projectId: true } },
        },
      },
    },
  });

  const now = new Date();
  const absoluteExpiresAt = session
    ? new Date(session.createdAt.getTime() + TTL_HOURS * 60 * 60 * 1000)
    : null;
  if (
    !session ||
    session.expiresAt <= now ||
    !absoluteExpiresAt ||
    absoluteExpiresAt <= now ||
    !session.user.active
  ) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  const refreshThreshold = IDLE_MINUTES * 30 * 1000;
  if (session.expiresAt.getTime() - now.getTime() <= refreshThreshold) {
    const nextExpiresAt = new Date(
      Math.min(
        absoluteExpiresAt.getTime(),
        now.getTime() + IDLE_MINUTES * 60 * 1000,
      ),
    );
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: nextExpiresAt },
    });
  }
  return session.user;
}

export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}

export function isAdmin(role: UserRole) {
  return role === "ADMIN";
}

export function canAccessProject(user: Awaited<ReturnType<typeof requireApiUser>>, projectId: string) {
  return isAdmin(user.role) || user.projects.some((item) => item.projectId === projectId);
}
