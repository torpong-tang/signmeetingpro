import type { Metadata } from "next";
import localFont from "next/font/local";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const prompt = localFont({
  src: [
    { path: "../../public/fonts/Prompt-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Prompt-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SignMeetingPro",
  description: "ระบบจัดการการประชุมและลงทะเบียนผู้เข้าร่วมอย่างเป็นระบบ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${prompt.variable} dark`}>
      <body suppressHydrationWarning>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
