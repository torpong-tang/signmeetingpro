import { MeetingsPageClient } from "@/components/meetings/meetings-page-client";
import { requirePageUser } from "@/server/auth";

export default async function MeetingsPage() {
  await requirePageUser();
  return <MeetingsPageClient />;
}
