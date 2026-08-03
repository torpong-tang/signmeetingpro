"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app/app-shell";
import { DashboardCards } from "@/components/app/dashboard-cards";
import { WorkspaceMenu, type WorkspaceKey } from "@/components/app/workspace-menu";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { useBootstrap } from "@/hooks/use-bootstrap";
import { ProjectWorkspace } from "@/components/workspaces/project-workspace";
import { GroupWorkspace } from "@/components/workspaces/group-workspace";
import { ManagerWorkspace } from "@/components/workspaces/manager-workspace";
import { useState } from "react";
import { useUiPreferences } from "@/components/app/ui-preferences-provider";

export function SignMeetingProApp() {
  const { data, loading, error, refresh } = useBootstrap();
  const { t } = useUiPreferences();
  const [workspace, setWorkspace] = useState<WorkspaceKey | null>(null);

  if (loading && !data) return <LoadingOverlay label={t("loadingApp")} />;
  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center p-4">
        <div className="glass-panel max-w-md rounded-lg p-7 text-center">
          <AlertCircle className="mx-auto size-10 text-rose-300" />
          <h1 className="mt-4 text-xl font-bold">{t("loadFailed")}</h1>
          <p className="mt-2 text-slate-400">{error}</p>
          <Button className="action-refresh mt-5" onClick={() => refresh()}><RefreshCw /> {t("retry")}</Button>
        </div>
      </main>
    );
  }

  return (
    <>
      {loading && <LoadingOverlay label={t("updatingData")} />}
      <AppShell user={data.user}>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="text-sm font-bold uppercase text-cyan-300">{t("overview")}</p><h1 className="text-2xl font-bold sm:text-3xl">{t("dashboard")}</h1><p className="mt-1 text-sm text-slate-400">{t("dashboardDescription")}</p></div>
            <Button type="button" className="action-refresh self-start sm:self-auto" onClick={() => refresh()}><RefreshCw /> {t("refresh")}</Button>
          </div>
          <DashboardCards stats={data.dashboard} />
          <WorkspaceMenu role={data.user.role} onSelect={setWorkspace} />
      </AppShell>

      <ProjectWorkspace open={workspace === "projects"} onOpenChange={(open) => !open && setWorkspace(null)} projects={data.projects} onChanged={refresh} />
      <GroupWorkspace open={workspace === "groups"} onOpenChange={(open) => !open && setWorkspace(null)} groups={data.groups} onChanged={refresh} />
      {data.user.role === "ADMIN" && <ManagerWorkspace open={workspace === "managers"} onOpenChange={(open) => !open && setWorkspace(null)} projects={data.projects} />}
    </>
  );
}
