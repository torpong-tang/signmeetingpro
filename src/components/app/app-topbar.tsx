"use client";

import { useState } from "react";
import { CircleHelp, KeyRound, LogOut, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmActionDialog, type ConfirmAction } from "@/components/shared/confirm-action-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { AdaptiveDialog } from "@/components/shared/adaptive-dialog";
import { PasswordInput } from "@/components/shared/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiMutation } from "@/hooks/use-bootstrap";
import type { UserSummary } from "@/types/app";
import { appPath } from "@/lib/app-path";
import { BrandLogo } from "@/components/shared/brand-logo";

export function AppTopbar({ user }: { user: UserSummary }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction>({ open: false, title: "", description: "" });
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profile, setProfile] = useState({ firstName: user.firstName, lastName: user.lastName, phone: "" });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [formError, setFormError] = useState("");
  const [pendingAction, setPendingAction] = useState<() => Promise<void>>(() => logout);

  function startTour() {
    driver({
      showProgress: true,
      allowClose: true,
      popoverClass: "signmeetingpro-tour",
      nextBtnText: "ถัดไป",
      prevBtnText: "ย้อนกลับ",
      doneBtnText: "เสร็จสิ้น",
      steps: [
        { element: "#tour-brand", popover: { title: "SignMeetingPro", description: "ศูนย์กลางการจัดการโครงการ การประชุม QR และหลักฐานการเข้าร่วม" } },
        { element: "#tour-dashboard", popover: { title: "Dashboard", description: "ติดตามจำนวนรายการ เวลาล่าสุด และพื้นที่จัดเก็บจากข้อมูลจริง" } },
        { element: "#tour-menu-home", popover: { title: "การประชุม", description: "ค้นหา กรอง สร้าง และแก้ไขการประชุมตามสิทธิ์โครงการ" } },
        { element: "#tour-menu-projects", popover: { title: "โครงการ", description: "Admin จัดการข้อมูลสัญญาและขอบเขตโครงการได้ที่นี่" } },
        { element: "#tour-menu-managers", popover: { title: "ผู้จัดการประชุม", description: "กำหนดบัญชีและ Project Assignment เพื่อจำกัดการเข้าถึงแบบ server-side" } },
        { element: "#tour-menu-groups", popover: { title: "กลุ่มผู้เข้าร่วม", description: "สร้าง master group และรายชื่อสำหรับใช้กับ QR channel แบบเลือกชื่อ" } },
        { element: "#tour-profile", popover: { title: "บัญชีผู้ใช้", description: "เข้าถึงโปรไฟล์ เปลี่ยนรหัสผ่าน และออกจากระบบ" } },
      ],
    }).drive();
  }

  async function logout() {
    setConfirm((value) => ({ ...value, open: false }));
    setLoading(true);
    await fetch(appPath("/api/auth/logout"), { method: "POST" });
    router.push(appPath("/login"));
    router.refresh();
  }

  function requestLogout() {
    setPendingAction(() => logout);
    setConfirm({ open: true, title: "ยืนยันการออกจากระบบ", description: `ออกจากระบบของ ${user.email} ใช่หรือไม่`, kind: "neutral", confirmLabel: "ออกจากระบบ" });
  }

  function requestProfileSave(event: React.FormEvent) {
    event.preventDefault();
    setPendingAction(() => async () => {
      setConfirm((value) => ({ ...value, open: false }));
      setLoading(true);
      try {
        await apiMutation("/api/profile", "PUT", profile);
        setProfileOpen(false);
        window.location.reload();
      } catch (caught) {
        setFormError(caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ");
        setLoading(false);
      }
    });
    setConfirm({ open: true, title: "ยืนยันการแก้ไขโปรไฟล์", description: `${profile.firstName} ${profile.lastName}`, kind: "save", confirmLabel: "บันทึก" });
  }

  function requestPasswordChange(event: React.FormEvent) {
    event.preventDefault();
    if (password.newPassword.length < 12 || password.newPassword !== password.confirmPassword) {
      setFormError("รหัสผ่านใหม่ต้องมีอย่างน้อย 12 ตัวอักษรและยืนยันให้ตรงกัน");
      return;
    }
    setPendingAction(() => async () => {
      setConfirm((value) => ({ ...value, open: false }));
      setLoading(true);
      try {
        await apiMutation("/api/change-password", "POST", { currentPassword: password.currentPassword, newPassword: password.newPassword });
        window.location.href = appPath("/login");
      } catch (caught) {
        setFormError(caught instanceof Error ? caught.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
        setLoading(false);
      }
    });
    setConfirm({ open: true, title: "ยืนยันการเปลี่ยนรหัสผ่าน", description: "หลังเปลี่ยนสำเร็จ ระบบจะออกจากระบบทุก session เพื่อความปลอดภัย", kind: "neutral", confirmLabel: "เปลี่ยนรหัสผ่าน" });
  }

  async function runPending() {
    await pendingAction();
  }

  return (
    <>
      {loading && <LoadingOverlay label="กำลังออกจากระบบ..." />}
      <header className="glass-panel sticky top-0 z-40 mb-5 flex h-16 items-center justify-between rounded-b-lg px-4 sm:px-6">
        <div id="tour-brand">
          <BrandLogo
            priority
            className="h-11 w-44 sm:h-12 sm:w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={<Button id="tour-guide" type="button" size="icon-lg" className="action-tour" onClick={startTour} />}>
              <CircleHelp />
            </TooltipTrigger>
            <TooltipContent>Guided Tour</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger id="tour-profile" className="flex h-10 items-center gap-2 rounded-lg border border-slate-500/40 bg-slate-800/70 px-2.5 hover:bg-slate-700">
              <div className="grid size-7 place-items-center rounded-md bg-amber-400 font-bold text-slate-950">{user.firstName[0]?.toUpperCase()}</div>
              <span className="hidden max-w-32 truncate text-sm font-bold sm:block">{user.firstName}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-panel min-w-56">
              <div className="px-2 py-2">
                <p className="font-bold">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setFormError(""); setProfileOpen(true); }}><UserRound /> แก้ไขโปรไฟล์</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setFormError(""); setPasswordOpen(true); }}><KeyRound /> เปลี่ยนรหัสผ่าน</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-300" onClick={requestLogout}>
                <LogOut /> ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <AdaptiveDialog open={profileOpen} onOpenChange={setProfileOpen} title="แก้ไขโปรไฟล์" footer={<Button type="submit" form="profile-form" className="action-save"><Save /> บันทึก</Button>}>
        <form id="profile-form" className="grid gap-4 sm:grid-cols-2" onSubmit={requestProfileSave}>
          <div className="space-y-2"><Label>ชื่อ <span className="required-mark">*</span></Label><Input required value={profile.firstName} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} /></div>
          <div className="space-y-2"><Label>นามสกุล <span className="required-mark">*</span></Label><Input required value={profile.lastName} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>โทรศัพท์</Label><Input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></div>
          {formError && <p className="text-sm text-rose-300 sm:col-span-2">{formError}</p>}
        </form>
      </AdaptiveDialog>
      <AdaptiveDialog open={passwordOpen} onOpenChange={setPasswordOpen} title="เปลี่ยนรหัสผ่าน" description="รหัสผ่านใหม่อย่างน้อย 12 ตัวอักษร" footer={<Button type="submit" form="password-form" className="action-save"><KeyRound /> เปลี่ยนรหัสผ่าน</Button>}>
        <form id="password-form" className="space-y-4" onSubmit={requestPasswordChange}>
          <div className="space-y-2"><Label>รหัสผ่านปัจจุบัน <span className="required-mark">*</span></Label><PasswordInput required value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} /></div>
          <div className="space-y-2"><Label>รหัสผ่านใหม่ <span className="required-mark">*</span></Label><PasswordInput required value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} /></div>
          <div className="space-y-2"><Label>ยืนยันรหัสผ่านใหม่ <span className="required-mark">*</span></Label><PasswordInput required value={password.confirmPassword} onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })} /></div>
          {formError && <p className="text-sm text-rose-300">{formError}</p>}
        </form>
      </AdaptiveDialog>
      <ConfirmActionDialog state={confirm} onOpenChange={(open) => setConfirm((value) => ({ ...value, open }))} onConfirm={runPending} />
    </>
  );
}
