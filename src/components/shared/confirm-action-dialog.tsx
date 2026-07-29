"use client";

import { AlertTriangle, CheckCircle2, Trash2, X } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmAction = {
  open: boolean;
  title: string;
  description: string;
  kind?: "save" | "delete" | "neutral";
  confirmLabel?: string;
};

export function ConfirmActionDialog({
  state,
  onOpenChange,
  onConfirm,
}: {
  state: ConfirmAction;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const kind = state.kind || "save";
  return (
    <AlertDialog open={state.open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass-panel border-slate-600/50">
        <AlertDialogHeader>
          <AlertDialogMedia className={kind === "delete" ? "bg-rose-500/15 text-rose-300" : "bg-amber-400/15 text-amber-300"}>
            {kind === "delete" ? <Trash2 /> : kind === "neutral" ? <AlertTriangle /> : <CheckCircle2 />}
          </AlertDialogMedia>
          <AlertDialogTitle className="text-lg font-bold">{state.title}</AlertDialogTitle>
          <AlertDialogDescription>{state.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="action-neutral"><X /> ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={kind === "delete" ? "action-delete" : "action-save"}>
            {kind === "delete" ? <Trash2 /> : <CheckCircle2 />}
            {state.confirmLabel || "ยืนยัน"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
