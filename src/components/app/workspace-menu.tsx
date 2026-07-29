"use client";

import { CalendarRange, FolderKanban, Users, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { appPath } from "@/lib/app-path";

export type WorkspaceKey = "meetings" | "projects" | "managers" | "groups";

const items = [
  { key: "meetings", label: "การประชุม", description: "Meeting workspace", icon: CalendarRange, id: "tour-menu-home", adminOnly: false, buttonClass: "hover:border-cyan-400/60", iconClass: "bg-cyan-400/15 text-cyan-300" },
  { key: "projects", label: "โครงการ", description: "Project & contract", icon: FolderKanban, id: "tour-menu-projects", adminOnly: true, buttonClass: "hover:border-amber-400/60", iconClass: "bg-amber-400/15 text-amber-300" },
  { key: "managers", label: "ผู้จัดการประชุม", description: "Accounts & access", icon: Users, id: "tour-menu-managers", adminOnly: true, buttonClass: "hover:border-violet-400/60", iconClass: "bg-violet-400/15 text-violet-300" },
  { key: "groups", label: "กลุ่มผู้เข้าร่วม", description: "Groups & people", icon: UsersRound, id: "tour-menu-groups", adminOnly: false, buttonClass: "hover:border-emerald-400/60", iconClass: "bg-emerald-400/15 text-emerald-300" },
] as const;

export function WorkspaceMenu({ role, onSelect }: { role: "ADMIN" | "MEETING_MANAGER"; onSelect: (key: WorkspaceKey) => void }) {
  const router = useRouter();

  function openWorkspace(key: WorkspaceKey) {
    if (key === "meetings") {
      router.push(appPath("/meetings"));
      return;
    }
    onSelect(key);
  }

  return (
    <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.filter((item) => role === "ADMIN" || !item.adminOnly).map(({ key, label, description, icon: Icon, id, buttonClass, iconClass }) => (
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
            <strong className="block text-base">{label}</strong>
            <small className="text-slate-400">{description}</small>
          </span>
        </Button>
      ))}
    </section>
  );
}
