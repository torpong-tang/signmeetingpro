import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/server/auth";
import { PagePreferences } from "@/components/app/page-preferences";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <PagePreferences />
      <section className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.2fr_.8fr]">
        <div className="hidden lg:block">
          <p className="mb-4 font-bold uppercase text-cyan-300">Meeting operations platform</p>
          <h2 className="max-w-3xl text-5xl font-bold leading-tight">
            จัดการโครงการ การประชุม QR และหลักฐานการเข้าร่วมในระบบเดียว
          </h2>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {["Project RBAC", "Two QR Channels", "Audit Trail"].map((label) => (
              <div key={label} className="glass-card rounded-lg px-4 py-5 text-center font-bold text-slate-200">{label}</div>
            ))}
          </div>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
