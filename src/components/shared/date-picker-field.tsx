"use client";

import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBuddhistDateInput } from "@/lib/format";

export function DatePickerField({
  value,
  onChange,
  min,
  max,
  disabled = false,
  required = false,
  ariaLabel = "เลือกวันที่",
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const picker = pickerRef.current;
    if (!picker || disabled) return;
    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }
    picker.click();
  }

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        readOnly
        disabled={disabled}
        value={formatBuddhistDateInput(value)}
        placeholder="วว/ดด/ปปปป"
        aria-label={`${ariaLabel} รูปแบบ วว/ดด/ปปปป`}
        aria-required={required}
        aria-invalid={required && !value}
        className="cursor-default"
      />
      <div className="relative shrink-0">
        <Button
          type="button"
          size="icon-lg"
          className="action-calendar h-10 w-10"
          disabled={disabled}
          onClick={openPicker}
          title={ariaLabel}
          aria-label={ariaLabel}
        >
          <CalendarDays />
        </Button>
        <input
          ref={pickerRef}
          type="date"
          lang="th-TH-u-ca-buddhist"
          value={value}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full opacity-0"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
