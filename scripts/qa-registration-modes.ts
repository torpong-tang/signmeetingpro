import PDFDocument from "pdfkit";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma";
import { createGroup, createParticipant } from "../src/server/services/group-service";
import { uploadMedia } from "../src/server/services/media-service";
import { createMeeting } from "../src/server/services/meeting-service";
import { uploadQrChannelImage } from "../src/server/services/qr-channel-image-service";
import { registerAttendance } from "../src/server/services/registration-service";

const TEST_PREFIX = "QA Registration Modes";
const SIGNATURE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z0QAAAABJRU5ErkJggg==";
const PNG_BYTES = Buffer.from(SIGNATURE_DATA_URL.split(",")[1], "base64");

const GROUP_SPECS = [
  { name: "QA Mode Operations", prefix: "ModeOps", position: "Operations Officer" },
  { name: "QA Mode Partners", prefix: "ModePartner", position: "Partner Coordinator" },
  { name: "QA Mode Observers", prefix: "ModeObserver", position: "Observer" },
] as const;

const SCENARIOS = [
  {
    title: `${TEST_PREFIX} 1 - Group and Group`,
    secondMode: "GROUP" as const,
    firstGroup: 0,
    secondGroup: 1,
    firstCount: 4,
    secondCount: 4,
  },
  {
    title: `${TEST_PREFIX} 2 - Group and Open`,
    secondMode: "OPEN" as const,
    firstGroup: 1,
    secondGroup: null,
    firstCount: 4,
    secondCount: 3,
  },
  {
    title: `${TEST_PREFIX} 3 - Group and Group`,
    secondMode: "GROUP" as const,
    firstGroup: 2,
    secondGroup: 0,
    firstCount: 3,
    secondCount: 3,
  },
  {
    title: `${TEST_PREFIX} 4 - Group and Open`,
    secondMode: "OPEN" as const,
    firstGroup: 0,
    secondGroup: null,
    firstCount: 2,
    secondCount: 2,
  },
] as const;

function requireQaWritePermission() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The QA data scenario is disabled in production.");
  }
  if (process.env.QA_ALLOW_DATA_WRITE !== "1") {
    throw new Error("Set QA_ALLOW_DATA_WRITE=1 to create persistent local QA data.");
  }
}

function futureIsoDate(offsetDays: number) {
  const value = new Date();
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value.toISOString().slice(0, 10);
}

async function createPdf(title: string) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const document = new PDFDocument({ size: "A4", margin: 48 });
    document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
    document.fontSize(20).text("SignMeetingPro Registration Modes");
    document.moveDown().fontSize(12).text(title);
    document.end();
  });
}

function fileFormData(
  name: string,
  mimeType: string,
  bytes: Buffer,
  kind: "PICTURE" | "DOCUMENT",
) {
  const formData = new FormData();
  formData.set("kind", kind);
  formData.set("file", new File([new Uint8Array(bytes)], name, { type: mimeType }));
  return formData;
}

function imageFormData(name: string, bytes: Buffer) {
  const formData = new FormData();
  formData.set("file", new File([new Uint8Array(bytes)], name, { type: "image/png" }));
  return formData;
}

async function ensureQrChannelImages(
  admin: Parameters<typeof uploadQrChannelImage>[0],
  meeting: {
    id: string;
    channels: Array<{ channelNo: number; imagePath: string | null }>;
  },
) {
  const source = path.join(process.cwd(), "public", "images", "signmeetingpro-logo.png");
  for (const channel of meeting.channels) {
    if (channel.imagePath) continue;
    const bytes = await sharp(source)
      .resize(640, 320, {
        fit: "contain",
        background: channel.channelNo === 1 ? "#061325" : "#102039",
      })
      .modulate({
        brightness: channel.channelNo === 1 ? 1 : 1.08,
        saturation: channel.channelNo === 1 ? 1 : 0.78,
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await uploadQrChannelImage(
      admin,
      meeting.id,
      channel.channelNo,
      imageFormData(`qa-channel-${channel.channelNo}.png`, bytes),
    );
  }
}

async function ensureGroups(admin: Parameters<typeof createGroup>[0]) {
  const groups = [];
  for (const spec of GROUP_SPECS) {
    let group = await prisma.participantGroup.findFirst({ where: { name: spec.name } });
    group ??= await createGroup(admin, {
      name: spec.name,
      description: "Persistent QA group for GROUP and OPEN registration coverage.",
      active: true,
    });

    for (let index = 1; index <= 5; index += 1) {
      const firstName = `${spec.prefix}${String(index).padStart(2, "0")}`;
      const lastName = "FlowTester";
      const exists = await prisma.participant.findFirst({
        where: { groupId: group.id, firstName, lastName },
      });
      if (!exists) {
        await createParticipant(admin, group.id, {
          firstName,
          lastName,
          position: spec.position,
          department: spec.name,
          phone: `089100${GROUP_SPECS.indexOf(spec) + 1}${String(index).padStart(2, "0")}`,
          email: `${firstName.toLowerCase()}@qa.local`,
          active: true,
        });
      }
    }
    groups.push(group);
  }
  return groups;
}

async function registerGroupParticipants(
  meetingId: string,
  token: string,
  groupId: string,
  count: number,
) {
  const participants = await prisma.participant.findMany({
    where: { groupId, active: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: count,
  });
  if (participants.length < count) throw new Error(`Group ${groupId} has insufficient participants.`);

  for (const participant of participants) {
    const exists = await prisma.attendance.findFirst({
      where: { meetingId, participantId: participant.id },
    });
    if (!exists) {
      await registerAttendance(token, {
        participantId: participant.id,
        signatureDataUrl: SIGNATURE_DATA_URL,
      });
    }
  }
}

async function registerOpenParticipants(
  meetingId: string,
  token: string,
  scenarioIndex: number,
  count: number,
) {
  for (let index = 1; index <= count; index += 1) {
    const firstName = `Open${scenarioIndex + 1}${String(index).padStart(2, "0")}`;
    const lastName = "FlowTester";
    const exists = await prisma.attendance.findFirst({
      where: { meetingId, firstNameSnapshot: firstName, lastNameSnapshot: lastName },
    });
    if (!exists) {
      await registerAttendance(token, {
        firstName,
        lastName,
        position: "External Participant",
        department: `Open Organization ${scenarioIndex + 1}`,
        phone: `086200${scenarioIndex + 1}${String(index).padStart(2, "0")}`,
        email: `${firstName.toLowerCase()}@qa.local`,
        signatureDataUrl: SIGNATURE_DATA_URL,
      });
    }
  }
}

async function ensureAttachments(
  admin: Parameters<typeof uploadMedia>[0],
  meetingId: string,
  scenarioIndex: number,
  title: string,
) {
  const existing = await prisma.meetingMedia.findMany({ where: { meetingId } });
  const pictureName = `qa-registration-mode-${scenarioIndex + 1}.png`;
  if (!existing.some((media) => media.originalName === pictureName)) {
    await uploadMedia(
      admin,
      meetingId,
      fileFormData(pictureName, "image/png", PNG_BYTES, "PICTURE"),
    );
  }

  const documentName = `qa-registration-mode-${scenarioIndex + 1}.pdf`;
  if (!existing.some((media) => media.originalName === documentName)) {
    await uploadMedia(
      admin,
      meetingId,
      fileFormData(documentName, "application/pdf", await createPdf(title), "DOCUMENT"),
    );
  }
}

async function main() {
  requireQaWritePermission();

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", active: true },
    include: { projects: { select: { projectId: true } } },
  });
  if (!admin) throw new Error("No active admin is available.");

  const project = await prisma.project.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!project) throw new Error("Create an active project first.");

  const groups = await ensureGroups(admin);

  for (let index = 0; index < SCENARIOS.length; index += 1) {
    const scenario = SCENARIOS[index];
    let meeting = await prisma.meeting.findFirst({
      where: { title: scenario.title },
      include: { channels: { orderBy: { channelNo: "asc" } } },
    });

    if (!meeting) {
      const firstGroup = groups[scenario.firstGroup];
      const secondGroup = scenario.secondGroup === null ? null : groups[scenario.secondGroup];
      const created = await createMeeting(admin, {
        projectId: project.id,
        title: scenario.title,
        agenda: `Persistent QA coverage for ${scenario.secondMode} registration.`,
        meetingDate: futureIsoDate(20 + index),
        startTime: `${String(13 + index).padStart(2, "0")}:00`,
        endTime: `${String(14 + index).padStart(2, "0")}:00`,
        location: `QA Mode Room ${index + 1}`,
        registerLimitMinutes: 60,
        allowLateRegistration: true,
        channels: [
          {
            channelNo: 1,
            mode: "GROUP",
            groupId: firstGroup.id,
            aliasName: firstGroup.name,
          },
          {
            channelNo: 2,
            mode: scenario.secondMode,
            groupId: secondGroup?.id || null,
            aliasName: secondGroup?.name || "",
          },
        ],
      });
      meeting = await prisma.meeting.findUniqueOrThrow({
        where: { id: created.id },
        include: { channels: { orderBy: { channelNo: "asc" } } },
      });
    }

    const firstChannel = meeting.channels[0];
    const secondChannel = meeting.channels[1];
    await registerGroupParticipants(
      meeting.id,
      firstChannel.token,
      firstChannel.groupId!,
      scenario.firstCount,
    );

    if (scenario.secondMode === "GROUP") {
      await registerGroupParticipants(
        meeting.id,
        secondChannel.token,
        secondChannel.groupId!,
        scenario.secondCount,
      );
    } else {
      await registerOpenParticipants(
        meeting.id,
        secondChannel.token,
        index,
        scenario.secondCount,
      );
    }
    await ensureQrChannelImages(admin, meeting);
    await ensureAttachments(admin, meeting.id, index, scenario.title);
  }

  const meetings = await prisma.meeting.findMany({
    where: { title: { startsWith: TEST_PREFIX } },
    include: {
      organizer: { select: { firstName: true, lastName: true } },
      channels: { orderBy: { channelNo: "asc" } },
      _count: { select: { attendances: true, media: true } },
    },
    orderBy: { title: "asc" },
  });
  const attendanceTotal = meetings.reduce(
    (total, meeting) => total + meeting._count.attendances,
    0,
  );
  if (
    meetings.length !== 4
    || attendanceTotal !== 25
    || meetings.some((meeting) => meeting._count.media < 2)
    || meetings.some((meeting) => meeting.channels.some((channel) => !channel.imagePath))
  ) {
    throw new Error(`QA registration-mode verification failed: meetings=${meetings.length}, attendance=${attendanceTotal}`);
  }

  console.log(JSON.stringify({
    meetings: meetings.map((meeting) => ({
      meetingCode: meeting.meetingCode,
      title: meeting.title,
      modes: meeting.channels.map((channel) => channel.mode),
      attendance: meeting._count.attendances,
      attachments: meeting._count.media,
      qrImages: meeting.channels.filter((channel) => channel.imagePath).length,
      organizer: `${meeting.organizer.firstName} ${meeting.organizer.lastName}`,
    })),
    attendanceTotal,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
