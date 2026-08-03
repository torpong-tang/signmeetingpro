"use client";

import { useState } from "react";
import type { ConfirmAction } from "@/components/shared/confirm-action-dialog";

const EMPTY_CONFIRM: ConfirmAction = {
  open: false,
  title: "",
  description: "",
};

export function useConfirmedAction() {
  const [confirm, setConfirm] = useState<ConfirmAction>(EMPTY_CONFIRM);
  const [pending, setPending] = useState<null | (() => Promise<void>)>(null);

  function ask(state: ConfirmAction, action: () => Promise<void>) {
    setPending(() => action);
    setConfirm(state);
  }

  async function runPending() {
    setConfirm((value) => ({ ...value, open: false }));
    await pending?.();
  }

  return { confirm, setConfirm, ask, runPending };
}
