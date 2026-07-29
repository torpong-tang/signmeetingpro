"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/password-input";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { appPath } from "@/lib/app-path";
import { BrandLogo } from "@/components/shared/brand-logo";

export function LoginForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    formRef.current?.setAttribute("data-hydrated", "true");
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(appPath("/api/auth/login"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      window.location.assign(appPath("/"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "เข้าสู่ระบบไม่สำเร็จ");
      setLoading(false);
    }
  }

  return (
    <>
      {loading && <LoadingOverlay label="กำลังเข้าสู่ระบบ..." />}
      <form ref={formRef} onSubmit={submit} className="glass-panel w-full max-w-md rounded-lg p-6 sm:p-8">
        <BrandLogo
          priority
          className="mb-7 h-24 w-full shadow-[0_0_28px_rgba(18,135,220,.2)]"
        />
        <div className="mb-6">
          <h2 className="text-xl font-bold text-amber-300">เข้าสู่ระบบ</h2>
          <p className="mt-1 text-sm text-slate-400">ใช้บัญชีผู้ดูแลหรือผู้จัดการประชุม</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail <span className="required-mark">*</span></Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input id="email" type="email" required autoComplete="username" placeholder="Manager e-mail" className="h-11 pl-10" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password <span className="required-mark">*</span></Label>
            <PasswordInput id="password" required autoComplete="current-password" placeholder="Enter password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {error && <p className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
          <Button type="submit" className="h-11 w-full bg-gradient-to-r from-amber-400 to-orange-500 font-bold text-slate-950 hover:from-amber-300 hover:to-orange-400">
            <LogIn /> เข้าสู่ระบบ
          </Button>
        </div>
      </form>
    </>
  );
}
