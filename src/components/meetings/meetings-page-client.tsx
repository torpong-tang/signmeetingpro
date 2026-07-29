"use client";

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { Button } from "@/components/ui/button";
import { MeetingWorkspace } from "@/components/workspaces/meeting-workspace";
import { useBootstrap } from "@/hooks/use-bootstrap";
import { appPath } from "@/lib/app-path";

export function MeetingsPageClient() {
  const router = useRouter();
  const { data, loading, error, refresh } = useBootstrap();

  if (loading && !data) {
    return <LoadingOverlay label="กำลังโหลดรายการการประชุม..." />;
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center p-4">
        <div className="glass-panel max-w-md rounded-lg p-7 text-center">
          <AlertCircle className="mx-auto size-10 text-rose-300" />
          <h1 className="mt-4 text-xl font-bold">โหลดรายการการประชุมไม่สำเร็จ</h1>
          <p className="mt-2 text-slate-400">{error}</p>
          <Button className="action-refresh mt-5" onClick={() => refresh()}>
            <RefreshCw /> ลองใหม่
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
      {loading && <LoadingOverlay label="กำลังอัปเดตข้อมูล..." />}
      <AppShell user={data.user}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            className="action-neutral"
            onClick={() => router.push(appPath("/"))}
          >
            <ArrowLeft /> กลับ Dashboard
          </Button>
          <Button type="button" className="action-refresh" onClick={() => refresh()}>
            <RefreshCw /> Refresh
          </Button>
        </div>
        <MeetingWorkspace
          meetings={data.meetings}
          projects={data.projects}
          groups={data.groups}
          onChanged={refresh}
        />
      </AppShell>
    </>
  );
}
