import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password || password === "change-this-before-seeding") {
    throw new Error("Set secure SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding.");
  }
  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must contain at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, active: true, role: UserRole.ADMIN },
    create: {
      email,
      passwordHash,
      firstName: "System",
      lastName: "Administrator",
      role: UserRole.ADMIN,
    },
  });

  const project = await prisma.project.upsert({
    where: { code: "SMP-DEMO" },
    update: { contractNumber: "DEMO-2569-001" },
    create: {
      code: "SMP-DEMO",
      name: "SignMeetingPro Pilot",
      contractNumber: "DEMO-2569-001",
      contractStart: new Date("2026-01-01T00:00:00.000Z"),
      contractEnd: new Date("2026-12-31T00:00:00.000Z"),
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: {},
    create: { projectId: project.id, userId: admin.id },
  });

  const group = await prisma.participantGroup.findFirst({
    where: { name: "TPT Team" },
  }) ?? await prisma.participantGroup.create({
    data: {
      name: "TPT Team",
      description: "กลุ่มตัวอย่างสำหรับทดสอบระบบ",
      createdById: admin.id,
    },
  });

  const participantCount = await prisma.participant.count({ where: { groupId: group.id } });
  if (participantCount === 0) {
    await prisma.participant.createMany({
      data: [
        { groupId: group.id, firstName: "Somchai", lastName: "Jaidee", position: "Project Manager", email: "somchai@example.com" },
        { groupId: group.id, firstName: "Suda", lastName: "Meechai", position: "Coordinator", email: "suda@example.com" },
      ],
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "meeting_running" },
    update: {},
    create: { key: "meeting_running", value: "1" },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
