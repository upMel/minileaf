"use client";

import { useMemo, useState } from "react";

import { useT } from "@/context/LanguageContext";
import { foldGreek, searchTerms } from "@/lib/greek";
import { formatPrice } from "@/lib/price";
import type { CategoryRow, ProductRow } from "@/types/admin";

import { productImageResolver } from "./product-image";
import Thumb from "./Thumb";

const MAX_SHOWN = 60;

type Props = {
  products: ProductRow[];
  categories: CategoryRow[];
  selectedId: string | null;
  onPick: (id: string | null) => void;
  /** Label of the "no product" choice (e.g. "Automatic"). Omit to hide it. */
  emptyLabel?: string;
  emptyHint?: string;
};

/** Searchable list of products for filling a flyer or banner slot. Offers first. */
export default function ProductPicker({ products, categories, selectedId, onPick, emptyLabel, emptyHint }: Props) {
  const t = useT();
  const a = t.admin.picker;
  const [query, setQuery] = useState("");

  const imageFor = useMemo(() => productImageResolver(categories), [categories]);

  const list = useMemo(() => {
    const terms = searchTerms(query);
    return products
      .filter((p) => {
        if (terms.length === 0) return true;
        const key = foldGreek(`${p.name} ${p.size ?? ""} ${p.barcode ?? ""}`);
        return terms.every((term) => key.includes(term));
      })
      .sort(
        (x, y) =>
          Number(y.is_super_price || y.is_bogo) - Number(x.is_super_price || x.is_bogo) ||
          Number(y.is_active) - Number(x.is_active) ||
          x.name.localeCompare(y.name, "el"),
      );
  }, [products, query]);

  return (
    <div className="ka-picker">
      <input
        className="ka-input"
        type="search"
        value={query}
        placeholder={a.search}
        aria-label={a.search}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="ka-picker-list" role="listbox" aria-label={a.label}>
        {emptyLabel && (
          <button type="button" role="option" aria-selected={selectedId === null} className="ka-picker-auto" onClick={() => onPick(null)}>
            <span className="ka-picker-auto-icon" aria-hidden="true">
              ✦
            </span>
            <span>
              <b>{emptyLabel}</b>
              {emptyHint && <small>{emptyHint}</small>}
            </span>
          </button>
        )}
        {list.slice(0, MAX_SHOWN).map((p) => (
          <button key={p.id} type="button" role="option" aria-selected={p.id === selectedId} onClick={() => onPick(p.id)}>
            <Thumb src={imageFor(p)} size={40} />
            <span>
              <b>{p.name}</b>
              <small>
                {[p.size, formatPrice(p.price, p.price_unit, t.units.kg)].filter(Boolean).join(" · ")}
                {p.is_super_price && <em className="super"> {t.admin.products.superPrice}</em>}
                {p.is_bogo && <em className="bogo"> 1+1</em>}
                {!p.is_active && <em> {t.admin.products.hiddenTag}</em>}
              </small>
            </span>
          </button>
        ))}
        {list.length === 0 && <p className="ka-hint">{a.noMatches}</p>}
        {list.length > MAX_SHOWN && <p className="ka-hint">{a.more(list.length - MAX_SHOWN)}</p>}
      </div>
    </div>
  );
}
