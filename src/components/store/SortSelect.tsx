"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useT } from "@/context/LanguageContext";
import type { ProductSort } from "@/lib/data/storefront";

/** Sort order lives in the URL (?sort=asc|desc) so it survives reloads and back. */
export default function SortSelect({ value }: { value: ProductSort }) {
  const t = useT().store.products;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <select
      className="ks-sort"
      aria-label={t.sortLabel}
      value={value}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        if (e.target.value === "default") next.delete("sort");
        else next.set("sort", e.target.value);
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }}
    >
      <option value="default">{t.sortDefault}</option>
      <option value="asc">{t.sortAsc}</option>
      <option value="desc">{t.sortDesc}</option>
    </select>
  );
}
