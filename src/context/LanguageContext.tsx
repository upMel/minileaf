"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import el from "@/i18n/el";
import en, { type Dictionary } from "@/i18n/en";

export type Locale = "el" | "en";

/** Greek is the default — English is opt-in via the toggle. */
export const DEFAULT_LOCALE: Locale = "el";

export const LOCALES: Locale[] = ["el", "en"];

const DICTIONARIES: Record<Locale, Dictionary> = { el, en };

const STORAGE_KEY = "locale";

function isLocale(value: string | null): value is Locale {
  return value === "el" || value === "en";
}

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: DICTIONARIES[DEFAULT_LOCALE],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start from the default so server and client render the same markup.
  // A stored preference is applied after hydration, mirroring how ThemeToggle
  // handles the saved palette.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved) && saved !== DEFAULT_LOCALE) setLocaleState(saved);
    } catch {
      // localStorage unavailable (private mode / blocked) — keep the default.
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keep <html lang> in sync for screen readers, hyphenation and SEO.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore — the choice just won't persist across reloads.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, t: DICTIONARIES[locale] }),
    [locale, setLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Full language context — use when you need `locale` or `setLocale`. */
export function useLanguage() {
  return useContext(LanguageContext);
}

/** Shorthand for the common case: just the strings. */
export function useT(): Dictionary {
  return useContext(LanguageContext).t;
}
