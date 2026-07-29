"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <Input {...props} type={visible ? "text" : "password"} className={`h-11 pl-10 pr-11 ${props.className || ""}`} />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="action-view absolute right-2 top-1/2 -translate-y-1/2"
        aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        title={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}
