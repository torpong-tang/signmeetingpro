"use client";

import { TopbarPreferences } from "@/components/app/topbar-preferences";

export function PagePreferences() {
  return (
    <aside
      className="fixed right-3 top-3 z-50 rounded-lg border border-slate-600/50 bg-slate-950/85 p-2 shadow-xl backdrop-blur-md sm:right-5 sm:top-5"
      aria-label="Page preferences"
    >
      <TopbarPreferences />
    </aside>
  );
}
