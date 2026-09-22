"use client";

import { useLanguage } from "@/context/LanguageContext";

/**
 * Two-state language switch (ΕΛ / EN), styled to sit beside ThemeToggle in the
 * header. Shows both options so the available languages are discoverable at a
 * glance rather than hidden behind a single-state button.
 */
export default function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();

  const options = [
    { id: "el" as const, short: "ΕΛ", name: t.language.el },
    { id: "en" as const, short: "EN", name: t.language.en },
  ];

  return (
    <div
      role="group"
      aria-label={t.language.label}
      className="flex h-8 shrink-0 items-center overflow-hidden rounded-lg border border-black/10 bg-white dark:border-white/15 dark:bg-white/5"
    >
      {options.map((opt) => {
        const active = locale === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLocale(opt.id)}
            title={t.language.switchTo(opt.name)}
            aria-pressed={active}
            className={`h-full px-2 text-[11px] font-semibold transition-colors ${
              active
                ? "text-white"
                : "text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
            }`}
            style={
              active
                ? { backgroundColor: "var(--accent)", color: "var(--accent-fg)" }
                : undefined
            }
          >
            {opt.short}
          </button>
        );
      })}
    </div>
  );
}
