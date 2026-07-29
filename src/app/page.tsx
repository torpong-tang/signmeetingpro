import { SignMeetingProApp } from "@/components/app/signmeetingpro-app";
import { requirePageUser } from "@/server/auth";

export default async function HomePage() {
  await requirePageUser();
  return <SignMeetingProApp />;
}
