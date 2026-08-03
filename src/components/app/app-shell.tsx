"use client";

import type { ReactNode } from "react";
import { AppTopbar } from "@/components/app/app-topbar";
import { useUiPreferences } from "@/components/app/ui-preferences-provider";
import type { UserSummary } from "@/types/app";

export function AppShell({
  user,
  children,
}: {
  user: UserSummary;
  children: ReactNode;
}) {
  const { locale } = useUiPreferences();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1600px] px-3 sm:px-5">
      <AppTopbar user={user} />
      <main>{children}</main>
      <footer className="mt-8 border-t border-slate-700/50 py-5 text-center text-sm text-slate-500">
        © {locale === "th" ? "2569" : "2026"} TPT Team • SignMeetingPro Version 1.0
      </footer>
    </div>
  );
}
