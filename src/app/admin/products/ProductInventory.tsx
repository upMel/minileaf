"use client";

import { useMemo, useState } from "react";

import { useT } from "@/context/LanguageContext";
import { foldGreek, searchTerms } from "@/lib/greek";
import { safeImageUrl } from "@/lib/image-url";
import { formatPrice } from "@/lib/price";
import type { CategoryRow, ProductRow } from "@/types/admin";

type Filter = "all" | "super" | "bogo" | "hidden";

type Props = {
  products: ProductRow[];
  categories: CategoryRow[];
  editingId?: string;
  disabled: boolean;
  onEdit: (p: ProductRow) => void;
};

/** "Τα προϊόντα σου": search, quick filters, and an Edit button per product. */
export default function ProductInventory({ products, categories, editingId, disabled, onEdit }: Props) {
  const t = useT();
  const p = t.admin.products;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  /** "Αλλαντικά › Σαλάμια" and the picture to fall back on. */
  function placement(product: ProductRow) {
    const cat = product.category_id ? byId.get(product.category_id) : undefined;
    if (!cat) return { label: "", image: undefined };
    const root = cat.parent_id ? byId.get(cat.parent_id) : cat;
    return {
      label: cat.parent_id ? `${root?.name ?? ""} › ${cat.name}` : cat.name,
      image: root?.image_url ?? undefined,
    };
  }

  const shown = useMemo(() => {
    const terms = searchTerms(query);
    return products.filter((x) => {
      if (filter === "super" && !x.is_super_price) return false;
      if (filter === "bogo" && !x.is_bogo) return false;
      if (filter === "hidden" && x.is_active) return false;
      if (terms.length === 0) return true;
      const key = foldGreek(`${x.name} ${x.size ?? ""} ${x.barcode ?? ""}`);
      return terms.every((term) => key.includes(term));
    });
  }, [products, query, filter]);

  const filters: [Filter, string][] = [
    ["all", p.filterAll],
    ["super", p.filterSuper],
    ["bogo", p.filterBogo],
    ["hidden", p.filterHidden],
  ];

  return (
    <section className="ka-card">
      <div className="ka-card-title">
        <h2>{p.inventory}</h2>
        <span className="ka-count">{products.length}</span>
      </div>

      {products.length === 0 ? (
        <div className="ka-empty">
          <h3>{p.emptyTitle}</h3>
          <p>{p.emptyText}</p>
        </div>
      ) : (
        <>
          <input
            className="ka-input ka-search"
            type="search"
            value={query}
            placeholder={p.searchPlaceholder}
            aria-label={p.searchPlaceholder}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ka-filters" role="group" aria-label={p.filtersLabel}>
            {filters.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {label}
              </button>
            ))}
          </div>
          {shown.length === 0 && <p className="ka-empty">{p.noMatches}</p>}
          <div className="ka-list">
            {shown.map((x) => {
              const place = placement(x);
              const img = safeImageUrl(x.image_url) ?? safeImageUrl(place.image);
              return (
                <article key={x.id} className={x.id === editingId ? "editing" : undefined}>
                  <div className="ka-list-pic">
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" loading="lazy" />
                    )}
                  </div>
                  <div>
                    <h3>{x.name}</h3>
                    {x.size && <p>{x.size}</p>}
                    {place.label && <p>{place.label}</p>}
                    <strong>{formatPrice(x.price, x.price_unit, t.units.kg)}</strong>
                    {(!x.is_active || x.is_super_price || x.is_bogo) && (
                      <div className="ka-tags">
                        {!x.is_active && <span>{p.hiddenTag}</span>}
                        {x.is_super_price && <span className="super">{p.superPrice}</span>}
                        {x.is_bogo && <span className="bogo">{p.bogo}</span>}
                      </div>
                    )}
                  </div>
                  <button type="button" className="ka-btn-small" disabled={disabled} onClick={() => onEdit(x)} aria-label={`${t.admin.common.edit}: ${x.name}`}>
                    {t.admin.common.edit}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
