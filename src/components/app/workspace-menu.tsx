"use client";

import { CalendarRange, FolderKanban, Users, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUiPreferences, type MessageKey } from "@/components/app/ui-preferences-provider";

export type WorkspaceKey = "meetings" | "projects" | "managers" | "groups";

const items = [
  { key: "meetings", labelKey: "meetings", descriptionKey: "meetingWorkspace", icon: CalendarRange, id: "tour-menu-home", adminOnly: false, buttonClass: "hover:border-cyan-400/60", iconClass: "bg-cyan-400/15 text-cyan-300" },
  { key: "projects", labelKey: "projects", descriptionKey: "projectContract", icon: FolderKanban, id: "tour-menu-projects", adminOnly: true, buttonClass: "hover:border-amber-400/60", iconClass: "bg-amber-400/15 text-amber-300" },
  { key: "managers", labelKey: "meetingManagers", descriptionKey: "accountsAccess", icon: Users, id: "tour-menu-managers", adminOnly: true, buttonClass: "hover:border-violet-400/60", iconClass: "bg-violet-400/15 text-violet-300" },
  { key: "groups", labelKey: "participantGroups", descriptionKey: "groupsPeople", icon: UsersRound, id: "tour-menu-groups", adminOnly: false, buttonClass: "hover:border-emerald-400/60", iconClass: "bg-emerald-400/15 text-emerald-300" },
] as const;

export function WorkspaceMenu({ role, onSelect }: { role: "ADMIN" | "MEETING_MANAGER"; onSelect: (key: WorkspaceKey) => void }) {
  const router = useRouter();
  const { t } = useUiPreferences();

  function openWorkspace(key: WorkspaceKey) {
    if (key === "meetings") {
      router.push("/meetings");
      return;
    }
    onSelect(key);
  }

  return (
    <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.filter((item) => role === "ADMIN" || !item.adminOnly).map(({ key, labelKey, descriptionKey, icon: Icon, id, buttonClass, iconClass }) => (
        <Button
          id={id}
          key={key}
          type="button"
          variant="outline"
          className={`glass-card h-20 justify-start gap-4 border-slate-500/30 px-4 text-left hover:bg-slate-800/70 ${buttonClass}`}
          onClick={() => openWorkspace(key)}
        >
          <span className={`grid size-11 place-items-center rounded-md ${iconClass}`}><Icon className="size-5" /></span>
          <span>
            <strong className="block text-base">{t(labelKey as MessageKey)}</strong>
            <small className="text-slate-400">{t(descriptionKey as MessageKey)}</small>
          </span>
        </Button>
      ))}
    </section>
  );
}
