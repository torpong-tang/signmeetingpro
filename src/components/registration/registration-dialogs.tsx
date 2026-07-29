import {
  AlertTriangle,
  CheckCircle2,
  Eraser,
  Save,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  ConfirmIntent,
  RegistrationSuccess,
} from "@/components/registration/registration-types";

export function RegistrationConfirmDialog({
  intent,
  onOpenChange,
  onConfirm,
}: {
  intent: ConfirmIntent | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const content = {
    "save-close": {
      title: "ยืนยันการบันทึก",
      description:
        "ระบบจะบันทึกข้อมูลผู้เข้าร่วมประชุม และปิดหน้าลงทะเบียนหลังยืนยันผลสำเร็จ",
      confirmLabel: "บันทึก",
      icon: <Save />,
      actionClass: "action-save",
    },
    "save-continue": {
      title: "ยืนยันการบันทึกต่อเนื่อง",
      description:
        "ระบบจะบันทึกข้อมูลชุดนี้ แล้วล้างแบบฟอร์มเพื่อรอลงทะเบียนบุคคลถัดไป",
      confirmLabel: "บันทึก(ต่อ)",
      icon: <Save />,
      actionClass: "action-switch",
    },
    "clear-signature": {
      title: "ยืนยันการล้างลายมือชื่อ",
      description: "ลายมือชื่อที่เขียนอยู่ในช่องจะถูกล้างทั้งหมด",
      confirmLabel: "ล้างลายมือชื่อ",
      icon: <Eraser />,
      actionClass: "action-delete",
    },
    "close-page": {
      title: "ต้องการปิดหน้าลงทะเบียน?",
      description: "ข้อมูลที่ยังไม่ได้บันทึกจะไม่ถูกเก็บไว้",
      confirmLabel: "ปิดหน้า",
      icon: <X />,
      actionClass: "action-delete",
    },
  } satisfies Record<
    ConfirmIntent,
    {
      title: string;
      description: string;
      confirmLabel: string;
      icon: React.ReactNode;
      actionClass: string;
    }
  >;
  const selected = intent ? content[intent] : content["save-close"];

  return (
    <AlertDialog open={Boolean(intent)} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass-panel border-amber-400/40">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-400/15 text-amber-300">
            {intent === "clear-signature" || intent === "close-page" ? (
              <AlertTriangle />
            ) : (
              selected.icon
            )}
          </AlertDialogMedia>
          <AlertDialogTitle className="text-lg font-bold">
            {selected.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {selected.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="action-neutral">
            <X /> ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction
            className={selected.actionClass}
            onClick={onConfirm}
          >
            {selected.icon} {selected.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RegistrationSuccessDialog({
  success,
  onOpenChange,
  onConfirm,
}: {
  success: RegistrationSuccess | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={Boolean(success)} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glass-panel border-emerald-400/40">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-lg font-bold">
            ลงทะเบียนสำเร็จ
          </AlertDialogTitle>
          <AlertDialogDescription>
            {success?.meetingCode} ลำดับที่ {success?.personNo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            className="action-save"
            onClick={onConfirm}
          >
            <CheckCircle2 /> ยืนยัน
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
