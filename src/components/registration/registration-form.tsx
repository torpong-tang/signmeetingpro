"use client";

import { Save, X, XCircle } from "lucide-react";
import {
  RegistrationConfirmDialog,
  RegistrationSuccessDialog,
} from "@/components/registration/registration-dialogs";
import { RegistrationParticipantFields } from "@/components/registration/registration-fields";
import {
  RegistrationHeader,
  RegistrationMeetingSummary,
} from "@/components/registration/registration-meeting-summary";
import { SignaturePad } from "@/components/registration/signature-pad";
import { useRegistrationForm } from "@/components/registration/use-registration-form";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { Button } from "@/components/ui/button";

export function RegistrationForm({ token }: { token: string }) {
  const registration = useRegistrationForm(token);

  if (registration.loading) {
    return <LoadingOverlay label="กำลังโหลดหน้าลงทะเบียน..." />;
  }
  if (registration.error && !registration.context) {
    return (
      <RegistrationStateCard
        title="ไม่สามารถลงทะเบียนได้"
        text={registration.error}
        tone="error"
      />
    );
  }
  if (!registration.context?.isOpen) {
    return (
      <RegistrationStateCard
        title="ปิดรับลงทะเบียนแล้ว"
        text="กรุณาติดต่อผู้จัดการประชุม หากจำเป็นต้องลงทะเบียนเพิ่มเติม"
        tone="closed"
      />
    );
  }

  const context = registration.context;

  return (
    <>
      {registration.submitting && (
        <LoadingOverlay label="กำลังบันทึกการลงทะเบียน..." />
      )}

      <main className="mx-auto min-h-screen w-full max-w-3xl p-4 sm:py-8">
        <RegistrationHeader />
        <RegistrationMeetingSummary context={context} token={token} />

        <form
          className="glass-panel space-y-4 rounded-lg p-4 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            registration.requestSubmit("close");
          }}
        >
          <RegistrationParticipantFields
            context={context}
            manual={registration.manual}
            participantId={registration.participantId}
            selectedParticipant={registration.selectedParticipant}
            form={registration.form}
            onToggleManual={registration.toggleManualEntry}
            onParticipantChange={registration.setParticipantId}
            onUpdate={registration.updateForm}
          />

          <SignaturePad
            value={registration.form.signatureDataUrl}
            onChange={(signatureDataUrl) =>
              registration.updateForm(
                "signatureDataUrl",
                signatureDataUrl,
              )
            }
            onRequestClear={() =>
              registration.setConfirmIntent("clear-signature")
            }
          />

          {registration.error && (
            <p className="rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">
              {registration.error}
            </p>
          )}

          <RegistrationActions
            disabled={registration.submitting}
            onSave={() => registration.requestSubmit("close")}
            onSaveAndContinue={() =>
              registration.requestSubmit("continue")
            }
            onClose={() =>
              registration.setConfirmIntent("close-page")
            }
          />
        </form>
      </main>

      <RegistrationConfirmDialog
        intent={registration.confirmIntent}
        onOpenChange={(open) => {
          if (!open) registration.setConfirmIntent(null);
        }}
        onConfirm={() => void registration.confirmAction()}
      />
      <RegistrationSuccessDialog
        success={registration.success}
        onOpenChange={registration.handleSuccessOpenChange}
        onConfirm={registration.confirmSuccess}
      />
    </>
  );
}

function RegistrationActions({
  disabled,
  onSave,
  onSaveAndContinue,
  onClose,
}: {
  disabled: boolean;
  onSave: () => void;
  onSaveAndContinue: () => void;
  onClose: () => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Button
        type="button"
        className="action-save h-11 text-base font-bold"
        disabled={disabled}
        onClick={onSave}
      >
        <Save /> บันทึก
      </Button>
      <Button
        type="button"
        className="action-switch h-11 text-base font-bold"
        disabled={disabled}
        onClick={onSaveAndContinue}
      >
        <Save /> บันทึก(ต่อ)
      </Button>
      <Button
        type="button"
        className="action-neutral h-11 text-base font-bold"
        disabled={disabled}
        onClick={onClose}
      >
        <X /> ปิด
      </Button>
    </div>
  );
}

function RegistrationStateCard({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "error" | "closed";
}) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="glass-panel w-full max-w-md rounded-lg p-8 text-center">
        <XCircle
          className={`mx-auto size-12 ${
            tone === "error" ? "text-rose-300" : "text-amber-300"
          }`}
        />
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-slate-400">{text}</p>
      </div>
    </main>
  );
}
