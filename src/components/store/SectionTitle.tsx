"use client";

import { useT } from "@/context/LanguageContext";

type Home = ReturnType<typeof useT>["store"]["home"];
/** Only the plain-text entries (not the ones that take arguments). */
type HomeKey = { [K in keyof Home]: Home[K] extends string ? K : never }[keyof Home];

/** Localized section heading (server pages can't read the language choice). */
export default function SectionTitle({ id, textKey }: { id: string; textKey: HomeKey }) {
  const t = useT();
  return (
    <div className="ks-section-head">
      <h2 id={id}>{t.store.home[textKey]}</h2>
    </div>
  );
}
