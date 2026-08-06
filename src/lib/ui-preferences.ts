export const UI_PREFERENCES_STORAGE_KEY = "signmeetingpro.ui-preferences.v1";

export const FONT_SIZES = ["xsmall", "small", "default", "large", "xlarge"] as const;
export type FontSizePreference = (typeof FONT_SIZES)[number];
export type AppLocale = "th" | "en";

export type UiPreferences = {
  locale: AppLocale;
  fontSize: FontSizePreference;
  highContrast: boolean;
};

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  locale: "th",
  fontSize: "default",
  highContrast: false,
};

export function parseUiPreferences(value: string | null): UiPreferences {
  if (!value) return DEFAULT_UI_PREFERENCES;

  try {
    const parsed = JSON.parse(value) as Partial<UiPreferences>;
    return {
      locale: parsed.locale === "en" ? "en" : "th",
      fontSize: FONT_SIZES.includes(parsed.fontSize as FontSizePreference)
        ? (parsed.fontSize as FontSizePreference)
        : "default",
      highContrast: parsed.highContrast === true,
    };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}
