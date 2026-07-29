"use client";

import { X } from "lucide-react";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AdaptiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  function handleOpenChange(
    nextOpen: boolean,
    eventDetails: { reason?: string },
  ) {
    if (
      !nextOpen
      && (
        eventDetails.reason === "outside-press"
        || eventDetails.reason === "escape-key"
        || eventDetails.reason === "focus-out"
      )
    ) {
      return;
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal
    >
      <DialogContent className={`glass-panel max-h-[92dvh] overflow-y-auto border-slate-600/40 p-5 sm:max-w-3xl ${className}`}>
        <DialogHeader className="border-b border-slate-600/30 pb-4 pr-10">
          <DialogTitle className="text-xl font-bold text-amber-300">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div>{children}</div>
        <DialogFooter className="sticky -bottom-5 mt-2 bg-[#0d1a30]/95">
          {footer}
          <DialogClose render={<Button type="button" className="action-neutral" />}>
            <X /> ปิด
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
