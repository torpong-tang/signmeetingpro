"use client";

import { useCallback, useEffect, useState } from "react";
import type { BootstrapData } from "@/types/app";
import { appPath } from "@/lib/app-path";

export function useBootstrap() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(appPath("/api/bootstrap"), { cache: "no-store" });
      if (response.status === 401) {
        window.location.href = appPath("/login");
        return;
      }
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "โหลดข้อมูลไม่สำเร็จ");
      setData(json);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);
  return { data, loading, error, refresh };
}

export async function apiMutation(url: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown) {
  const response = await fetch(appPath(url), {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) {
    window.location.replace(appPath("/login?reason=session-expired"));
    throw new Error("Session expired");
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || "ดำเนินการไม่สำเร็จ");
  return json;
}
