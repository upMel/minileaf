"use client";

import { useT } from "@/context/LanguageContext";

type HomeKey = keyof ReturnType<typeof useT>["store"]["home"];

/** Localized section heading (server pages can't read the language choice). */
export default function SectionTitle({ id, textKey }: { id: string; textKey: HomeKey }) {
  const t = useT();
  return (
    <div className="ks-section-head">
      <h2 id={id}>{t.store.home[textKey]}</h2>
    </div>
  );
}
