"use client";

import { LoaderCircle } from "lucide-react";

export function LoadingOverlay({ label = "กำลังประมวลผล..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#030916]/75 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="glass-panel flex min-w-64 flex-col items-center gap-4 rounded-lg p-7">
        <LoaderCircle className="size-10 animate-spin text-amber-400" />
        <p className="font-bold text-slate-100">{label}</p>
      </div>
    </div>
  );
}
