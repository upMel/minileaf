"use client";

import { useLanguage } from "@/context/LanguageContext";

/** Compact ΕΛ / EN switch in the storefront's own style. */
export default function StoreLanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();
  const options = [
    { id: "el" as const, short: "ΕΛ", name: t.language.el },
    { id: "en" as const, short: "EN", name: t.language.en },
  ];
  return (
    <div className={`ks-lang ${className}`} role="group" aria-label={t.language.label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          lang={o.id}
          aria-pressed={locale === o.id}
          title={t.language.switchTo(o.name)}
          onClick={() => setLocale(o.id)}
        >
          {o.short}
        </button>
      ))}
    </div>
  );
}
