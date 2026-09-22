"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import SearchBar from "@/components/SearchBar";
import { defaultFilters } from "@/types/search";
import type { SearchFilters } from "@/types/search";
import type { Deal, CategoryNode } from "@/types/deals";
import { useView } from "@/context/ViewContext";
import { useT } from "@/context/LanguageContext";
import { formatEUR, formatPrice } from "@/lib/price";
import ProductDetailModal from "@/components/home/ProductDetailModal";

export type { Deal } from "@/types/deals";

// ── Shared product card (used in both leaflet and category views) ──
// Layout is a clean two-part split — image panel on top, solid info strip
// below — rather than floating translucent chips over the photo, which made
// the product hard to read and the price hard to scan.
function LeafletCard({ deal, onSelect }: { deal: Deal; onSelect: (deal: Deal) => void }) {
  const t = useT();
  const reference = deal.originalPrice ?? deal.competitorPrice;

  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/[.07] transition duration-200 hover:-translate-y-0.5 hover:ring-black/[.12] dark:bg-zinc-900 dark:ring-white/[.08] dark:hover:ring-white/20">
      {/* Full-card hit area. Kept as a sibling overlay so the card itself stays
          non-interactive content (a <button> may not wrap headings/divs). */}
      <button
        type="button"
        onClick={() => onSelect(deal)}
        className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <span className="sr-only">{t.productDetail.viewDetails}</span>
      </button>

      {/* Image panel — square, so products read at a consistent size */}
      <div className="relative aspect-square w-full shrink-0 bg-white">
        {deal.imageUrl ? (
          <Image
            src={deal.imageUrl}
            alt={deal.name}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-contain p-2.5 transition-transform duration-200 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-200 dark:text-zinc-700">
            <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}

        {deal.promoLabel ? (
          <span className="absolute left-2 top-2 rounded-md bg-badge px-1.5 py-0.5 text-[10px] font-bold leading-tight tracking-tight tabular-nums shadow-sm">
            {deal.promoLabel}
          </span>
        ) : null}
      </div>

      {/* Info strip */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-black/[.05] px-2.5 pb-2.5 pt-2 dark:border-white/[.06]">
        <h2 className="line-clamp-2 text-[11px] font-medium leading-snug text-zinc-700 dark:text-zinc-300">
          {deal.name}
        </h2>

        <div className="mt-auto pt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[17px] font-extrabold leading-none tracking-tight tabular-nums text-accent">
              {formatPrice(deal.price, deal.priceUnit, t.units.kg)}
            </span>
            {reference !== undefined && reference > deal.price ? (
              <span className="text-[10px] leading-none text-zinc-400 line-through decoration-1 dark:text-zinc-500">
                {formatEUR(reference)}
              </span>
            ) : null}
          </div>
          {typeof deal.competitorPrice === "number" && deal.competitorName ? (
            <p className="mt-1 truncate text-[9px] leading-none text-zinc-400 dark:text-zinc-500">
              {deal.competitorName}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

type Props = {
  deals: Deal[];
  source: "demo" | "supabase";
  categoryTree?: CategoryNode[];
};

export default function DealsGrid({ deals, source, categoryTree = [] }: Props) {
  const { view } = useView();
  const t = useT();
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Only show categories/subcategories that have at least one deal linked via categoryId.
  const activeTree = useMemo(() => {
    const activeCatIds = new Set(deals.map((d) => d.categoryId).filter(Boolean) as string[]);
    if (activeCatIds.size === 0) return categoryTree;
    return categoryTree
      .map((root) => {
        if (root.children.length === 0) {
          return activeCatIds.has(root.id) ? root : null;
        }
        const activeChildren = root.children.filter((c) => activeCatIds.has(c.id));
        return activeChildren.length > 0 ? { ...root, children: activeChildren } : null;
      })
      .filter((n): n is CategoryNode => n !== null);
  }, [deals, categoryTree]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const min = filters.minPrice !== "" ? parseFloat(filters.minPrice) : null;
    const max = filters.maxPrice !== "" ? parseFloat(filters.maxPrice) : null;

    return deals.filter((deal) => {
      if (q && !deal.name.toLowerCase().includes(q) && !deal.category?.toLowerCase().includes(q)) return false;
      if (filters.categories.length > 0) {
        if (!deal.categoryId || !filters.categories.includes(deal.categoryId)) return false;
      }
      if (filters.hasPromoOnly && !deal.promoLabel) return false;
      if (min !== null && !isNaN(min) && deal.price < min) return false;
      if (max !== null && !isNaN(max) && deal.price > max) return false;
      return true;
    });
  }, [deals, filters]);

  // Build category order + id→name map from tree for stable section ordering and labels
  const { categoryOrder, catIdToName } = useMemo(() => {
    const categoryOrder = new Map<string, number>();
    const catIdToName = new Map<string, string>();
    let idx = 0;
    for (const root of categoryTree) {
      categoryOrder.set(root.id, idx++);
      catIdToName.set(root.id, root.name);
      for (const child of root.children) {
        categoryOrder.set(child.id, idx++);
        catIdToName.set(child.id, child.name);
      }
    }
    return { categoryOrder, catIdToName };
  }, [categoryTree]);

  // Group filtered deals by category (for category view)
  const categoryGroups = useMemo(() => {
    const groupMap = new Map<string, { label: string; deals: Deal[]; order: number }>();
    for (const deal of filtered) {
      const key = deal.categoryId ?? deal.category ?? "__other__";
      const label =
        (deal.categoryId ? catIdToName.get(deal.categoryId) : undefined) ??
        deal.category ??
        t.deals.other;
      const order = deal.categoryId ? (categoryOrder.get(deal.categoryId) ?? 9999) : 9999;
      if (!groupMap.has(key)) groupMap.set(key, { label, deals: [], order });
      groupMap.get(key)!.deals.push(deal);
    }
    return Array.from(groupMap.values()).sort((a, b) => a.order - b.order);
  }, [filtered, categoryOrder, catIdToName, t]);

  const isFiltering =
    filters.query !== "" ||
    filters.categories.length > 0 ||
    filters.hasPromoOnly ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "";

  return (
    <>
      {/* Search + filters bar */}
      <SearchBar
        filters={filters}
        categoryTree={activeTree}
        onChange={setFilters}
        placeholder={t.search.placeholderProductsOrCategories}
      />

      {isFiltering && (
        <p className="-mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {t.deals.countOf(filtered.length, deals.length)}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <svg className="size-9 text-zinc-300 dark:text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">{t.deals.noMatch}</p>
        </div>
      ) : view === "leaflet" ? (

        /* ── Leaflet view: dense full-width grid (mobile only — md+ uses FlierGrid) ── */
        <section className="grid grid-cols-2 gap-2.5 md:hidden sm:grid-cols-3">
          {filtered.map((deal) => (
            <LeafletCard key={deal.id} deal={deal} onSelect={setSelectedDeal} />
          ))}
        </section>

      ) : view === "list" ? (

        /* ── List view: compact horizontal rows ── */
        <ul className="divide-y divide-black/[.06] dark:divide-white/[.06]">
          {filtered.map((deal) => (
            <li key={deal.id} className="relative flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setSelectedDeal(deal)}
                className="absolute inset-0 z-10 cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <span className="sr-only">{t.productDetail.viewDetails}</span>
              </button>
              {/* Thumbnail */}
              <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl bg-white ring-1 ring-black/[.06] dark:ring-white/[.12]">
                {deal.imageUrl ? (
                  <Image src={deal.imageUrl} alt={deal.name} fill sizes="64px" className="object-contain p-1" />
                ) : (
                  <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800" />
                )}
              </div>

              {/* Name + store/category */}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[13px] font-medium leading-snug text-zinc-800 dark:text-zinc-100">
                  {deal.name}
                </p>
                {(deal.competitorName ?? deal.category) ? (
                  <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-500">
                    {deal.competitorName ? t.deals.at(deal.competitorName) : deal.category}
                  </p>
                ) : null}
              </div>

              {/* Promo badge */}
              {deal.promoLabel ? (
                <span className="flex-none rounded-full bg-badge px-2 py-0.5 text-[10px] font-bold leading-none">
                  {deal.promoLabel}
                </span>
              ) : null}

              {/* Price block */}
              <div className="flex-none text-right">
                <div className="text-[15px] font-extrabold leading-none tabular-nums text-accent">
                  {formatPrice(deal.price, deal.priceUnit, t.units.kg)}
                </div>
                {typeof deal.competitorPrice === "number" ? (
                  <div className="mt-1 text-[10px] leading-none text-zinc-400 line-through">
                    {formatEUR(deal.competitorPrice)}
                  </div>
                ) : deal.originalPrice ? (
                  <div className="mt-1 text-[10px] leading-none text-zinc-400 line-through">
                    {formatEUR(deal.originalPrice)}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

      ) : (

        /* ── Category view: sections with horizontal scroll carousels ── */
        <div className="space-y-7">
          {categoryGroups.map((group) => (
            <section key={group.label}>
              <div className="mb-2.5 flex items-baseline gap-2">
                <h2 className="text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {group.label}
                </h2>
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                  {group.deals.length}
                </span>
              </div>
              {/* Horizontal scroll carousel — no scrollbar */}
              <div
                className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible lg:grid-cols-5 xl:grid-cols-6"
                style={{ scrollbarWidth: "none" }}
              >
                {group.deals.map((deal) => (
                  <div key={deal.id} className="w-[8.5rem] flex-none snap-start sm:w-40 md:w-auto">
                    <LeafletCard deal={deal} onSelect={setSelectedDeal} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

      )}

      {selectedDeal && (
        <ProductDetailModal
          deal={selectedDeal}
          categoryLabel={
            (selectedDeal.categoryId ? catIdToName.get(selectedDeal.categoryId) : undefined) ??
            selectedDeal.category
          }
          onClose={() => setSelectedDeal(null)}
        />
      )}
    </>
  );
}
