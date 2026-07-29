"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { SortDirection } from "@/hooks/use-data-table";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 30, 50, 100];

function visiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right)
    .flatMap<(number | "ellipsis")>((page, index, values) => {
      const previous = values[index - 1];
      return previous && page - previous > 1 ? ["ellipsis", page] : [page];
    });
}

export function SortableTableHead<K extends string>({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
  className,
}: {
  label: string;
  sortKey: K;
  activeSortKey: K;
  direction: SortDirection;
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = sortKey === activeSortKey;
  const Icon = active ? direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;

  return (
    <th
      scope="col"
      aria-sort={active ? direction === "asc" ? "ascending" : "descending" : "none"}
      className={cn("p-3", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="group inline-flex items-center gap-1.5 font-bold text-inherit transition-colors hover:text-amber-300"
        title={`เรียงตาม ${label}`}
      >
        <span>{label}</span>
        <Icon className={cn("size-4", active ? "text-amber-300" : "text-slate-500 group-hover:text-amber-300")} />
      </button>
    </th>
  );
}

export function DataTableControls({
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  onPageSizeChange,
  onPageChange,
}: {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  onPageSizeChange: (value: number) => void;
  onPageChange: (page: number) => void;
}) {
  const pages = visiblePages(currentPage, totalPages);

  return (
    <div className="mt-3 grid gap-4 rounded-lg border border-slate-600/40 bg-[#0b1930]/90 px-4 py-4 md:grid-cols-[auto_1fr_auto] md:items-center">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <span>Show</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-10 w-24">
            <span className="font-bold text-white">{pageSize}</span>
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>rows</span>
      </div>

      <p className="text-center text-sm font-bold text-amber-300">
        พบจำนวนรายการทั้งสิ้น {totalItems.toLocaleString("th-TH")} รายการ
      </p>

      <nav className="flex flex-wrap items-center justify-center gap-1.5 md:justify-end" aria-label="Pagination">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          title="หน้าแรก"
          aria-label="หน้าแรก"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          title="หน้าก่อนหน้า"
          aria-label="หน้าก่อนหน้า"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft />
        </Button>

        {pages.map((page, index) => page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="grid size-9 place-items-center text-slate-400">...</span>
        ) : (
          <Button
            key={page}
            type="button"
            size="icon-sm"
            variant={page === currentPage ? "default" : "outline"}
            className={page === currentPage ? "bg-amber-400 font-bold text-slate-950 hover:bg-amber-300" : ""}
            aria-label={`หน้า ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          title="หน้าถัดไป"
          aria-label="หน้าถัดไป"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          title="หน้าสุดท้าย"
          aria-label="หน้าสุดท้าย"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          <ChevronsRight />
        </Button>
      </nav>
    </div>
  );
}
