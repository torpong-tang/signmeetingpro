"use client";

import { useCallback, useEffect, useState } from "react";
import { appPath } from "@/lib/app-path";
import {
  EMPTY_REGISTRATION_FORM,
  type ConfirmIntent,
  type RegistrationContext,
  type RegistrationFormState,
  type RegistrationSuccess,
  type SubmitMode,
} from "@/components/registration/registration-types";

export function closeRegistrationPage() {
  window.close();
  window.setTimeout(() => {
    if (!window.closed) window.location.href = "about:blank";
  }, 100);
}

export function useRegistrationForm(token: string) {
  const [context, setContext] = useState<RegistrationContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<RegistrationSuccess | null>(null);
  const [confirmIntent, setConfirmIntent] =
    useState<ConfirmIntent | null>(null);
  const [participantId, setParticipantId] = useState("");
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState<RegistrationFormState>(
    EMPTY_REGISTRATION_FORM,
  );

  const selectedParticipant = context?.channel.group?.participants.find(
    (person) => person.id === participantId,
  );

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        appPath(`/api/public/register/${token}`),
        { cache: "no-store" },
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "ไม่พบลิงก์ลงทะเบียน");
      }
      setContext(json);
      setManual(json.channel.mode === "OPEN");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "โหลดข้อมูลไม่สำเร็จ",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function updateForm<Key extends keyof RegistrationFormState>(
    key: Key,
    value: RegistrationFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateBeforeSubmit() {
    if (!manual && !participantId) {
      setError("กรุณาเลือกรายชื่อ หรือเลือกเพิ่มข้อมูลด้วยตนเอง");
      return false;
    }
    if (
      manual &&
      (!form.firstName.trim() ||
        !form.lastName.trim() ||
        !form.position.trim() ||
        (context?.channel.mode === "OPEN" && !form.department.trim()))
    ) {
      setError("กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน");
      return false;
    }
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setError("กรุณากรอก E-mail ให้ถูกต้อง");
      return false;
    }
    if (!form.signatureDataUrl) {
      setError("กรุณาลงลายมือชื่อ");
      return false;
    }
    setError("");
    return true;
  }

  function requestSubmit(mode: SubmitMode) {
    if (!validateBeforeSubmit()) return;
    setConfirmIntent(
      mode === "close" ? "save-close" : "save-continue",
    );
  }

  function resetForNextRegistration() {
    setParticipantId("");
    setForm(EMPTY_REGISTRATION_FORM);
  }

  async function submit(mode: SubmitMode) {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        appPath(`/api/public/register/${token}`),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...form,
            participantId: manual ? null : participantId,
          }),
        },
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "บันทึกไม่สำเร็จ");
      }
      setSuccess({ ...json, mode });
      if (mode === "continue") resetForNextRegistration();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmAction() {
    const intent = confirmIntent;
    setConfirmIntent(null);
    if (intent === "clear-signature") {
      updateForm("signatureDataUrl", "");
      return;
    }
    if (intent === "close-page") {
      closeRegistrationPage();
      return;
    }
    if (intent === "save-close") await submit("close");
    if (intent === "save-continue") await submit("continue");
  }

  function toggleManualEntry() {
    setManual((value) => !value);
    setParticipantId("");
    setForm(EMPTY_REGISTRATION_FORM);
    setError("");
  }

  function confirmSuccess() {
    const mode = success?.mode;
    setSuccess(null);
    if (mode === "close") closeRegistrationPage();
  }

  function handleSuccessOpenChange(open: boolean) {
    if (!open && success?.mode === "continue") setSuccess(null);
  }

  return {
    context,
    loading,
    submitting,
    error,
    success,
    confirmIntent,
    participantId,
    manual,
    form,
    selectedParticipant,
    setError,
    setConfirmIntent,
    setParticipantId,
    updateForm,
    requestSubmit,
    toggleManualEntry,
    confirmAction,
    confirmSuccess,
    handleSuccessOpenChange,
  };
}
