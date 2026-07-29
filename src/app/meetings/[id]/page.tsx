import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { MeetingDetailView } from "@/components/meetings/meeting-detail-view";
import { requirePageUser } from "@/server/auth";
import { getMeeting } from "@/server/services/meeting-service";
import type { MeetingRecord, UserSummary } from "@/types/app";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser();
  const { id } = await params;

  let meeting;
  try {
    meeting = await getMeeting(user, id);
  } catch {
    notFound();
  }

  const userSummary: UserSummary = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatarPath: user.avatarPath,
  };
  const serializedMeeting = JSON.parse(JSON.stringify(meeting)) as MeetingRecord;

  return (
    <AppShell user={userSummary}>
      <MeetingDetailView meeting={serializedMeeting} />
    </AppShell>
  );
}
