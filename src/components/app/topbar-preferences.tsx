"use client";

import { Accessibility, Contrast, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUiPreferences, type MessageKey } from "@/components/app/ui-preferences-provider";
import type { FontSizePreference } from "@/lib/ui-preferences";
import { cn } from "@/lib/utils";

const fontOptions: Array<{ value: FontSizePreference; label: string; message: MessageKey }> = [
  { value: "xsmall", label: "A--", message: "fontExtraSmall" },
  { value: "small", label: "A-", message: "fontSmaller" },
  { value: "default", label: "A", message: "fontDefault" },
  { value: "large", label: "A+", message: "fontLarger" },
  { value: "xlarge", label: "A++", message: "fontExtraLarge" },
];

function PreferenceControls({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, fontSize, setFontSize, highContrast, toggleContrast, t } = useUiPreferences();

  return (
    <div className={cn("flex items-center gap-2", compact && "flex-col items-stretch gap-4 p-3")}>
      <div className={cn("flex items-center gap-1.5", compact && "justify-between")}>
        <span className="text-xs font-bold text-slate-300">{t("fontSize")}:</span>
        <div className="flex items-center gap-1" role="group" aria-label={t("fontSize")}>
          {fontOptions.map((option) => (
            <Tooltip key={option.value}>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-9 min-w-9 border-slate-500/50 bg-slate-950/35 px-1.5 text-xs font-bold text-white",
                      fontSize === option.value && "border-cyan-300 bg-cyan-400/20 text-cyan-100 ring-2 ring-cyan-300/45",
                    )}
                    aria-label={t(option.message)}
                    aria-pressed={fontSize === option.value}
                    onClick={() => setFontSize(option.value)}
                  />
                }
              >
                {option.label}
              </TooltipTrigger>
              <TooltipContent>{t(option.message)}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "preference-contrast-button h-9 px-2.5",
                highContrast && "is-active",
                compact && "justify-center",
              )}
              aria-pressed={highContrast}
              onClick={toggleContrast}
            />
          }
        >
          <Contrast />
          <span>{t("contrast")}</span>
        </TooltipTrigger>
        <TooltipContent>{t(highContrast ? "contrastOff" : "contrastOn")}</TooltipContent>
      </Tooltip>

      <div className={cn("flex h-9 items-center rounded-lg border border-slate-500/50 bg-slate-950/35 p-1", compact && "justify-center")} role="group" aria-label={t("language")}>
        <Languages className="mx-1 size-4 text-cyan-300" aria-hidden="true" />
        {(["th", "en"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant="ghost"
            className={cn("h-7 min-w-10 px-2 uppercase text-slate-300", locale === value && "bg-cyan-400 text-slate-950 hover:bg-cyan-300 hover:text-slate-950")}
            aria-pressed={locale === value}
            onClick={() => setLocale(value)}
          >
            {value}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function TopbarPreferences() {
  const { t } = useUiPreferences();

  return (
    <div id="tour-accessibility">
      <div className="hidden items-center xl:flex">
        <PreferenceControls />
      </div>
      <div className="xl:hidden">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger render={<DropdownMenuTrigger className="action-switch grid size-9 place-items-center rounded-lg" aria-label={t("accessibility")} />}>
              <Accessibility className="size-5" />
            </TooltipTrigger>
            <TooltipContent>{t("accessibility")}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="glass-panel min-w-72 p-1">
            <PreferenceControls compact />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
