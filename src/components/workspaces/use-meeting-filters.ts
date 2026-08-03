"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useMeetingFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [projectFilter, setProjectFilter] = useState(
    () => searchParams.get("project") || "all",
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    if (projectFilter !== "all") params.set("project", projectFilter);
    else params.delete("project");

    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    }
  }, [pathname, projectFilter, router, search, searchParams]);

  return {
    router,
    searchParams,
    search,
    setSearch,
    projectFilter,
    setProjectFilter,
  };
}
