import { CalendarDays, FileText, FolderKanban, ImageIcon, UsersRound } from "lucide-react";
import { formatBytes, formatThaiDateTime } from "@/lib/format";
import type { DashboardStats } from "@/types/app";

const cards = [
  { key: "projects", label: "Projects", icon: FolderKanban, color: "text-cyan-300 bg-cyan-400/10" },
  { key: "meetings", label: "Meetings", icon: CalendarDays, color: "text-amber-300 bg-amber-400/10" },
  { key: "attendance", label: "Attendance", icon: UsersRound, color: "text-emerald-300 bg-emerald-400/10" },
  { key: "pictures", label: "Pictures", icon: ImageIcon, color: "text-violet-300 bg-violet-400/10" },
  { key: "documents", label: "Documents", icon: FileText, color: "text-rose-300 bg-rose-400/10" },
] as const;

export function DashboardCards({ stats }: { stats: DashboardStats }) {
  return (
    <section id="tour-dashboard" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ key, label, icon: Icon, color }) => {
        const item = stats[key];
        const bytes = "bytes" in item ? item.bytes : null;
        return (
          <article key={key} className="glass-card min-h-36 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className={`grid size-10 place-items-center rounded-md ${color}`}><Icon className="size-5" /></div>
              {bytes !== null && <span className="text-xs font-bold text-slate-400">{formatBytes(bytes)}</span>}
            </div>
            <p className="mt-5 text-3xl font-bold">{item.count.toLocaleString("th-TH")}</p>
            <p className="font-bold text-slate-200">{label}</p>
            <p className="mt-2 text-xs text-slate-400">ล่าสุด {formatThaiDateTime(item.latestAt)}</p>
          </article>
        );
      })}
    </section>
  );
}
