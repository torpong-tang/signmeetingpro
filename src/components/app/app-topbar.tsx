"use client";

import { useState } from "react";
import { CircleHelp, KeyRound, LogOut, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { TopbarPreferences } from "@/components/app/topbar-preferences";
import { useUiPreferences } from "@/components/app/ui-preferences-provider";

export function AppTopbar({ user }: { user: UserSummary }) {
  const router = useRouter();
  const { t } = useUiPreferences();
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
      nextBtnText: t("tourNext"),
      prevBtnText: t("tourPrevious"),
      doneBtnText: t("tourDone"),
      steps: [
        { element: "#tour-brand", popover: { title: t("tourBrandTitle"), description: t("tourBrandDescription") } },
        { element: "#tour-dashboard", popover: { title: t("tourDashboardTitle"), description: t("tourDashboardDescription") } },
        { element: "#tour-menu-home", popover: { title: t("tourMeetingsTitle"), description: t("tourMeetingsDescription") } },
        { element: "#tour-menu-projects", popover: { title: t("tourProjectsTitle"), description: t("tourProjectsDescription") } },
        { element: "#tour-menu-managers", popover: { title: t("tourManagersTitle"), description: t("tourManagersDescription") } },
        { element: "#tour-menu-groups", popover: { title: t("tourGroupsTitle"), description: t("tourGroupsDescription") } },
        { element: "#tour-accessibility", popover: { title: t("tourAccessibilityTitle"), description: t("tourAccessibilityDescription") } },
        { element: "#tour-profile", popover: { title: t("tourProfileTitle"), description: t("tourProfileDescription") } },
      ],
    }).drive();
  }

  async function logout() {
    setConfirm((value) => ({ ...value, open: false }));
    setLoading(true);
    await fetch(appPath("/api/auth/logout"), { method: "POST" });
    // Next Router applies next.config.ts basePath automatically.
    router.push("/login");
    router.refresh();
  }

  function requestLogout() {
    setPendingAction(() => logout);
    setConfirm({ open: true, title: t("logoutTitle"), description: t("logoutDescription", { email: user.email }), kind: "neutral", confirmLabel: t("logout") });
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
        setFormError(caught instanceof Error ? caught.message : t("profileSaveFailed"));
        setLoading(false);
      }
    });
    setConfirm({ open: true, title: t("profileConfirmTitle"), description: `${profile.firstName} ${profile.lastName}`, kind: "save", confirmLabel: t("save") });
  }

  function requestPasswordChange(event: React.FormEvent) {
    event.preventDefault();
    if (password.newPassword.length < 12 || password.newPassword !== password.confirmPassword) {
      setFormError(t("passwordValidation"));
      return;
    }
    setPendingAction(() => async () => {
      setConfirm((value) => ({ ...value, open: false }));
      setLoading(true);
      try {
        await apiMutation("/api/change-password", "POST", { currentPassword: password.currentPassword, newPassword: password.newPassword });
        window.location.href = appPath("/login");
      } catch (caught) {
        setFormError(caught instanceof Error ? caught.message : t("passwordChangeFailed"));
        setLoading(false);
      }
    });
    setConfirm({ open: true, title: t("passwordConfirmTitle"), description: t("passwordConfirmDescription"), kind: "neutral", confirmLabel: t("changePassword") });
  }

  async function runPending() {
    await pendingAction();
  }

  return (
    <>
      {loading && <LoadingOverlay label={t("logoutLoading")} />}
      <header className="glass-panel sticky top-0 z-40 mb-5 flex min-h-16 items-center justify-between gap-3 rounded-b-lg px-3 py-2 sm:px-6">
        <div id="tour-brand" className="min-w-0 shrink">
          <BrandLogo
            priority
            className="h-10 w-36 sm:h-12 sm:w-56 2xl:w-64"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <TopbarPreferences />
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
              <DropdownMenuItem onClick={() => { setFormError(""); setProfileOpen(true); }}><UserRound /> {t("profile")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setFormError(""); setPasswordOpen(true); }}><KeyRound /> {t("changePassword")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-300" onClick={requestLogout}>
                <LogOut /> {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="group/tour relative">
            <Button
              id="tour-guide"
              type="button"
              size="icon-lg"
              className="action-tour"
              aria-label={t("guidedTour")}
              aria-describedby="guided-tour-tooltip"
              onClick={startTour}
            >
              <CircleHelp />
            </Button>
            <span
              id="guided-tour-tooltip"
              role="tooltip"
              className="pointer-events-none absolute top-full right-0 z-60 mt-2 w-max max-w-48 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-950 opacity-0 shadow-lg transition-opacity group-hover/tour:opacity-100 group-focus-within/tour:opacity-100"
            >
              {t("guidedTour")}
            </span>
          </div>
        </div>
      </header>
      <AdaptiveDialog open={profileOpen} onOpenChange={setProfileOpen} title={t("profile")} footer={<Button type="submit" form="profile-form" className="action-save"><Save /> {t("save")}</Button>}>
        <form id="profile-form" className="grid gap-4 sm:grid-cols-2" onSubmit={requestProfileSave}>
          <div className="space-y-2"><Label>{t("firstName")} <span className="required-mark">*</span></Label><Input required value={profile.firstName} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} /></div>
          <div className="space-y-2"><Label>{t("lastName")} <span className="required-mark">*</span></Label><Input required value={profile.lastName} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>{t("phone")}</Label><Input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></div>
          {formError && <p className="text-sm text-rose-300 sm:col-span-2">{formError}</p>}
        </form>
      </AdaptiveDialog>
      <AdaptiveDialog open={passwordOpen} onOpenChange={setPasswordOpen} title={t("changePassword")} description={t("passwordDescription")} footer={<Button type="submit" form="password-form" className="action-save"><KeyRound /> {t("changePassword")}</Button>}>
        <form id="password-form" className="space-y-4" onSubmit={requestPasswordChange}>
          <div className="space-y-2"><Label>{t("currentPassword")} <span className="required-mark">*</span></Label><PasswordInput required value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} /></div>
          <div className="space-y-2"><Label>{t("newPassword")} <span className="required-mark">*</span></Label><PasswordInput required value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} /></div>
          <div className="space-y-2"><Label>{t("confirmPassword")} <span className="required-mark">*</span></Label><PasswordInput required value={password.confirmPassword} onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })} /></div>
          {formError && <p className="text-sm text-rose-300">{formError}</p>}
        </form>
      </AdaptiveDialog>
      <ConfirmActionDialog state={confirm} onOpenChange={(open) => setConfirm((value) => ({ ...value, open }))} onConfirm={runPending} />
    </>
  );
}
