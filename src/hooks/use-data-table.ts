"use client";

import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";
export type SortValue = string | number | boolean | Date | null | undefined;

function normalizeSortValue(value: SortValue) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  return String(value ?? "").trim().toLocaleLowerCase("th");
}

export function useDataTable<T, K extends string>({
  items,
  initialSortKey,
  initialDirection = "asc",
  getSortValue,
}: {
  items: T[];
  initialSortKey: K;
  initialDirection?: SortDirection;
  getSortValue: (item: T, key: K) => SortValue;
}) {
  const [sortKey, setSortKey] = useState<K>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(10);

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftValue = normalizeSortValue(getSortValue(left, sortKey));
      const rightValue = normalizeSortValue(getSortValue(right, sortKey));
      const result = typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), "th", {
          numeric: true,
          sensitivity: "base",
        });
      return sortDirection === "asc" ? result : -result;
    });
  }, [getSortValue, items, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function toggleSort(key: K) {
    if (key === sortKey) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(1);
  }

  function setPageSize(value: number) {
    setPageSizeState(value);
    setPage(1);
  }

  function setSort(key: K, direction: SortDirection = "asc") {
    setSortKey(key);
    setSortDirection(direction);
    setPage(1);
  }

  return {
    currentPage,
    pageItems,
    pageSize,
    setPage,
    setPageSize,
    setSort,
    sortDirection,
    sortKey,
    sortedItems,
    toggleSort,
    totalItems: sortedItems.length,
    totalPages,
  };
}
