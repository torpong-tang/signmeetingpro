import { createHash } from "node:crypto";
import PDFDocument from "pdfkit";
import { prisma } from "../src/lib/prisma";
import { createGroup, createParticipant } from "../src/server/services/group-service";
import { downloadMedia, uploadMedia } from "../src/server/services/media-service";
import { createMeeting } from "../src/server/services/meeting-service";
import { registerAttendance } from "../src/server/services/registration-service";

const GROUP_SPECS = [
  { name: "QA Operations Team", prefix: "Ops", position: "Operations Specialist" },
  { name: "QA Partner Team", prefix: "Partner", position: "Partner Coordinator" },
  { name: "QA Guest Team", prefix: "Guest", position: "Guest Representative" },
] as const;

const MEETING_TITLE_PREFIX = "QA SignMeetingPro Full Flow";
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z0QAAAABJRU5ErkJggg==";
const SIGNATURE_DATA_URL = `data:image/png;base64,${PNG_BASE64}`;

function requireQaWritePermission() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The QA data scenario is disabled in production.");
  }
  if (process.env.QA_ALLOW_DATA_WRITE !== "1") {
    throw new Error("Set QA_ALLOW_DATA_WRITE=1 to acknowledge persistent local QA data creation.");
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
    document.fontSize(20).text("SignMeetingPro QA Document");
    document.moveDown().fontSize(12).text(title);
    document.text(`Generated: ${new Date().toISOString()}`);
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

async function main() {
  requireQaWritePermission();

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", active: true },
    include: { projects: { select: { projectId: true } } },
  });
  if (!admin) throw new Error("No active admin user is available for the QA scenario.");

  const project = await prisma.project.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!project) throw new Error("Create an active project before running the QA scenario.");

  const groups = [];
  for (const groupSpec of GROUP_SPECS) {
    let group = await prisma.participantGroup.findFirst({ where: { name: groupSpec.name } });
    group ??= await createGroup(admin, {
      name: groupSpec.name,
      description: "Persistent local QA data for the complete SignMeetingPro flow.",
      active: true,
    });

    for (let index = 1; index <= 5; index += 1) {
      const firstName = `${groupSpec.prefix}${String(index).padStart(2, "0")}`;
      const lastName = "QATester";
      const exists = await prisma.participant.findFirst({
        where: { groupId: group.id, firstName, lastName },
      });
      if (!exists) {
        await createParticipant(admin, group.id, {
          firstName,
          lastName,
          position: groupSpec.position,
          department: groupSpec.name,
          phone: `080000${GROUP_SPECS.indexOf(groupSpec) + 1}${String(index).padStart(2, "0")}`,
          email: `${firstName.toLowerCase()}@qa.local`,
          active: true,
        });
      }
    }
    groups.push(group);
  }

  const groupPairs = [
    [groups[0], groups[1]],
    [groups[1], groups[2]],
    [groups[2], groups[0]],
    [groups[0], groups[2]],
  ] as const;

  for (let index = 0; index < 4; index += 1) {
    const title = `${MEETING_TITLE_PREFIX} ${index + 1}`;
    let meetingId = (await prisma.meeting.findFirst({
      where: { title },
      select: { id: true },
    }))?.id;

    if (!meetingId) {
      const [channelOneGroup, channelTwoGroup] = groupPairs[index];
      const meeting = await createMeeting(admin, {
        projectId: project.id,
        title,
        agenda: `End-to-end QA scenario ${index + 1}`,
        meetingDate: futureIsoDate(7 + index),
        startTime: `${String(9 + index).padStart(2, "0")}:00`,
        endTime: `${String(10 + index).padStart(2, "0")}:00`,
        location: `QA Meeting Room ${index + 1}`,
        registerLimitMinutes: 60,
        allowLateRegistration: true,
        channels: [
          {
            channelNo: 1,
            mode: "GROUP",
            groupId: channelOneGroup.id,
            aliasName: `${channelOneGroup.name} Registration`,
          },
          {
            channelNo: 2,
            mode: "GROUP",
            groupId: channelTwoGroup.id,
            aliasName: `${channelTwoGroup.name} Registration`,
          },
        ],
      });
      meetingId = meeting.id;
    }

    const refreshedMeeting = await prisma.meeting.findUniqueOrThrow({
      where: { id: meetingId },
      include: {
        channels: { orderBy: { channelNo: "asc" } },
        media: true,
      },
    });
    if (
      refreshedMeeting.channels.length !== 2 ||
      refreshedMeeting.channels[0].groupId === refreshedMeeting.channels[1].groupId
    ) {
      throw new Error(`${title} does not have two distinct QR participant groups.`);
    }
    if (refreshedMeeting.channels.some((channel) => !channel.aliasName.includes("Registration"))) {
      throw new Error(`${title} does not expose the expected QR display names.`);
    }

    for (let channelIndex = 0; channelIndex < 2; channelIndex += 1) {
      const channel = refreshedMeeting.channels[channelIndex];
      const participants = await prisma.participant.findMany({
        where: { groupId: channel.groupId || "", active: true },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      });
      const participant = participants[index % participants.length];
      if (!participant) throw new Error(`No participant is available for ${channel.aliasName}.`);

      const existingAttendance = await prisma.attendance.findFirst({
        where: { meetingId: refreshedMeeting.id, participantId: participant.id },
      });
      if (!existingAttendance) {
        await registerAttendance(channel.token, {
          participantId: participant.id,
          signatureDataUrl: SIGNATURE_DATA_URL,
        });
      }
    }

    const pictureName = `qa-meeting-${index + 1}.png`;
    if (!refreshedMeeting.media.some((media) => media.originalName === pictureName)) {
      await uploadMedia(
        admin,
        refreshedMeeting.id,
        fileFormData(pictureName, "image/png", Buffer.from(PNG_BASE64, "base64"), "PICTURE"),
      );
    }

    const documentName = `qa-meeting-${index + 1}.pdf`;
    if (!refreshedMeeting.media.some((media) => media.originalName === documentName)) {
      await uploadMedia(
        admin,
        refreshedMeeting.id,
        fileFormData(documentName, "application/pdf", await createPdf(title), "DOCUMENT"),
      );
    }
  }

  const qaGroups = await prisma.participantGroup.findMany({
    where: { name: { in: GROUP_SPECS.map((group) => group.name) } },
    include: { _count: { select: { participants: true } } },
  });
  const qaMeetings = await prisma.meeting.findMany({
    where: { title: { startsWith: MEETING_TITLE_PREFIX } },
    include: {
      channels: true,
      _count: { select: { attendances: true, media: true } },
    },
    orderBy: { title: "asc" },
  });
  const qaMedia = await prisma.meetingMedia.findMany({
    where: { meetingId: { in: qaMeetings.map((meeting) => meeting.id) } },
    orderBy: { originalName: "asc" },
  });
  for (const media of qaMedia) {
    const downloaded = await downloadMedia(admin, media.id);
    const downloadedChecksum = createHash("sha256").update(downloaded.bytes).digest("hex");
    if (downloadedChecksum !== media.checksum) {
      throw new Error(`Attachment checksum mismatch: ${media.originalName}`);
    }
  }

  const summary = {
    groups: qaGroups.length,
    participants: qaGroups.reduce((total, group) => total + group._count.participants, 0),
    meetings: qaMeetings.length,
    attendance: qaMeetings.reduce((total, meeting) => total + meeting._count.attendances, 0),
    pictures: await prisma.meetingMedia.count({
      where: { meetingId: { in: qaMeetings.map((meeting) => meeting.id) }, kind: "PICTURE" },
    }),
    documents: await prisma.meetingMedia.count({
      where: { meetingId: { in: qaMeetings.map((meeting) => meeting.id) }, kind: "DOCUMENT" },
    }),
    downloadsVerified: qaMedia.length,
    qrDisplayNames: qaMeetings.flatMap((meeting) =>
      meeting.channels.map((channel) => channel.aliasName),
    ),
  };

  if (
    summary.groups !== 3 ||
    summary.participants !== 15 ||
    summary.meetings !== 4 ||
    summary.attendance !== 8 ||
    summary.pictures !== 4 ||
    summary.documents !== 4 ||
    summary.downloadsVerified !== 8
  ) {
    throw new Error(`QA scenario verification failed: ${JSON.stringify(summary)}`);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
