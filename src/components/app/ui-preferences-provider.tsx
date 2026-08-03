"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_UI_PREFERENCES,
  parseUiPreferences,
  UI_PREFERENCES_STORAGE_KEY,
  type AppLocale,
  type FontSizePreference,
  type UiPreferences,
} from "@/lib/ui-preferences";
import { LocalizedDocument } from "@/components/app/localized-document";

const messages = {
  th: {
    accessibility: "การช่วยการเข้าถึง",
    fontSize: "ขนาดตัวอักษร",
    fontSmaller: "ลดขนาดตัวอักษร",
    fontDefault: "ขนาดตัวอักษรปกติ",
    fontLarger: "เพิ่มขนาดตัวอักษร",
    contrast: "ปรับสี",
    contrastOn: "เปิดโหมดสีตัดกันสูง",
    contrastOff: "กลับสู่โหมดสีปกติ",
    language: "ภาษา",
    guidedTour: "แนะนำการใช้งาน",
    profile: "แก้ไขโปรไฟล์",
    changePassword: "เปลี่ยนรหัสผ่าน",
    logout: "ออกจากระบบ",
    logoutLoading: "กำลังออกจากระบบ...",
    logoutTitle: "ยืนยันการออกจากระบบ",
    logoutDescription: "ออกจากระบบของ {email} ใช่หรือไม่",
    save: "บันทึก",
    firstName: "ชื่อ",
    lastName: "นามสกุล",
    phone: "โทรศัพท์",
    currentPassword: "รหัสผ่านปัจจุบัน",
    newPassword: "รหัสผ่านใหม่",
    confirmPassword: "ยืนยันรหัสผ่านใหม่",
    passwordDescription: "รหัสผ่านใหม่อย่างน้อย 12 ตัวอักษร",
    passwordValidation: "รหัสผ่านใหม่ต้องมีอย่างน้อย 12 ตัวอักษรและยืนยันให้ตรงกัน",
    profileSaveFailed: "บันทึกไม่สำเร็จ",
    passwordChangeFailed: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
    profileConfirmTitle: "ยืนยันการแก้ไขโปรไฟล์",
    passwordConfirmTitle: "ยืนยันการเปลี่ยนรหัสผ่าน",
    passwordConfirmDescription: "หลังเปลี่ยนสำเร็จ ระบบจะออกจากระบบทุก session เพื่อความปลอดภัย",
    loadingApp: "กำลังโหลด SignMeetingPro...",
    updatingData: "กำลังอัปเดตข้อมูล...",
    loadFailed: "โหลดระบบไม่สำเร็จ",
    retry: "ลองใหม่",
    overview: "ภาพรวมการดำเนินงาน",
    dashboard: "แดชบอร์ด",
    dashboardDescription: "ข้อมูลล่าสุดตามโครงการที่คุณมีสิทธิ์เข้าถึง",
    refresh: "รีเฟรช",
    latest: "ล่าสุด",
    noData: "ยังไม่มีข้อมูล",
    projects: "โครงการ",
    meetings: "การประชุม",
    attendance: "ผู้ลงทะเบียน",
    pictures: "รูปภาพ",
    documents: "เอกสาร",
    meetingWorkspace: "พื้นที่จัดการประชุม",
    projectContract: "โครงการและสัญญา",
    meetingManagers: "ผู้จัดการประชุม",
    accountsAccess: "บัญชีและสิทธิ์เข้าถึง",
    participantGroups: "กลุ่มผู้เข้าร่วม",
    groupsPeople: "กลุ่มและรายชื่อ",
    tourBrandTitle: "SignMeetingPro",
    tourBrandDescription: "ศูนย์กลางการจัดการโครงการ การประชุม QR และหลักฐานการเข้าร่วม",
    tourDashboardTitle: "แดชบอร์ด",
    tourDashboardDescription: "ติดตามจำนวนรายการ เวลาล่าสุด และพื้นที่จัดเก็บจากข้อมูลจริง",
    tourMeetingsTitle: "การประชุม",
    tourMeetingsDescription: "ค้นหา กรอง สร้าง และแก้ไขการประชุมตามสิทธิ์โครงการ",
    tourProjectsTitle: "โครงการ",
    tourProjectsDescription: "Admin จัดการข้อมูลสัญญาและขอบเขตโครงการได้ที่นี่",
    tourManagersTitle: "ผู้จัดการประชุม",
    tourManagersDescription: "กำหนดบัญชีและ Project Assignment เพื่อจำกัดการเข้าถึงแบบ server-side",
    tourGroupsTitle: "กลุ่มผู้เข้าร่วม",
    tourGroupsDescription: "สร้าง master group และรายชื่อสำหรับใช้กับ QR channel แบบเลือกชื่อ",
    tourAccessibilityTitle: "การแสดงผลและภาษา",
    tourAccessibilityDescription: "ปรับขนาดตัวอักษร เพิ่มความคมชัด และสลับภาษาไทยหรืออังกฤษได้จากแถบนี้",
    tourProfileTitle: "บัญชีผู้ใช้",
    tourProfileDescription: "เข้าถึงโปรไฟล์ เปลี่ยนรหัสผ่าน และออกจากระบบ",
    tourNext: "ถัดไป",
    tourPrevious: "ย้อนกลับ",
    tourDone: "เสร็จสิ้น",
  },
  en: {
    accessibility: "Accessibility",
    fontSize: "Text size",
    fontSmaller: "Decrease text size",
    fontDefault: "Default text size",
    fontLarger: "Increase text size",
    contrast: "Contrast",
    contrastOn: "Enable high contrast",
    contrastOff: "Use normal contrast",
    language: "Language",
    guidedTour: "Guided tour",
    profile: "Edit profile",
    changePassword: "Change password",
    logout: "Logout",
    logoutLoading: "Signing out...",
    logoutTitle: "Confirm logout",
    logoutDescription: "Sign out {email}?",
    save: "Save",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    passwordDescription: "New password must contain at least 12 characters",
    passwordValidation: "The new password must contain at least 12 characters and both entries must match.",
    profileSaveFailed: "Unable to save profile",
    passwordChangeFailed: "Unable to change password",
    profileConfirmTitle: "Confirm profile changes",
    passwordConfirmTitle: "Confirm password change",
    passwordConfirmDescription: "After the password changes, all sessions will be signed out for security.",
    loadingApp: "Loading SignMeetingPro...",
    updatingData: "Updating data...",
    loadFailed: "Unable to load the application",
    retry: "Try again",
    overview: "Operational overview",
    dashboard: "Dashboard",
    dashboardDescription: "Latest data from projects you are permitted to access",
    refresh: "Refresh",
    latest: "Latest",
    noData: "No data yet",
    projects: "Projects",
    meetings: "Meetings",
    attendance: "Attendance",
    pictures: "Pictures",
    documents: "Documents",
    meetingWorkspace: "Meeting workspace",
    projectContract: "Projects and contracts",
    meetingManagers: "Meeting managers",
    accountsAccess: "Accounts and access",
    participantGroups: "Participant groups",
    groupsPeople: "Groups and people",
    tourBrandTitle: "SignMeetingPro",
    tourBrandDescription: "Manage projects, meetings, QR registration, and attendance evidence in one place.",
    tourDashboardTitle: "Dashboard",
    tourDashboardDescription: "Monitor live record counts, recent activity, and storage usage.",
    tourMeetingsTitle: "Meetings",
    tourMeetingsDescription: "Search, filter, create, and edit meetings within your assigned projects.",
    tourProjectsTitle: "Projects",
    tourProjectsDescription: "Administrators manage contracts and project scope here.",
    tourManagersTitle: "Meeting managers",
    tourManagersDescription: "Assign accounts and project access with server-side enforcement.",
    tourGroupsTitle: "Participant groups",
    tourGroupsDescription: "Maintain reusable groups and people for named QR registration.",
    tourAccessibilityTitle: "Display and language",
    tourAccessibilityDescription: "Change text size, enable high contrast, and switch between Thai and English.",
    tourProfileTitle: "User account",
    tourProfileDescription: "Edit your profile, change your password, or sign out.",
    tourNext: "Next",
    tourPrevious: "Back",
    tourDone: "Done",
  },
} as const;

export type MessageKey = keyof typeof messages.th;

type UiPreferencesContextValue = UiPreferences & {
  setLocale: (locale: AppLocale) => void;
  setFontSize: (fontSize: FontSizePreference) => void;
  toggleContrast: () => void;
  t: (key: MessageKey, replacements?: Record<string, string>) => string;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);

export function UiPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UiPreferences>(DEFAULT_UI_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPreferences(parseUiPreferences(window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY)));
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = preferences.locale;
    root.dataset.locale = preferences.locale;
    root.dataset.fontSize = preferences.fontSize;
    root.dataset.contrast = preferences.highContrast ? "high" : "normal";

    if (hydrated) {
      window.localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    }
  }, [hydrated, preferences]);

  const value = useMemo<UiPreferencesContextValue>(() => ({
    ...preferences,
    setLocale: (locale) => setPreferences((current) => ({ ...current, locale })),
    setFontSize: (fontSize) => setPreferences((current) => ({ ...current, fontSize })),
    toggleContrast: () => setPreferences((current) => ({ ...current, highContrast: !current.highContrast })),
    t: (key, replacements) => {
      let message: string = messages[preferences.locale][key];
      for (const [name, replacement] of Object.entries(replacements ?? {})) {
        message = message.replaceAll(`{${name}}`, replacement);
      }
      return message;
    },
  }), [preferences]);

  return (
    <UiPreferencesContext.Provider value={value}>
      <LocalizedDocument locale={preferences.locale}>{children}</LocalizedDocument>
    </UiPreferencesContext.Provider>
  );
}

export function useUiPreferences() {
  const context = useContext(UiPreferencesContext);
  if (!context) throw new Error("useUiPreferences must be used within UiPreferencesProvider");
  return context;
}
