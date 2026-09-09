"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import SearchBar from "@/components/SearchBar";
import { defaultFilters } from "@/types/search";
import type { SearchFilters } from "@/types/search";
import type { Deal, CategoryNode } from "@/types/deals";
import { useView } from "@/context/ViewContext";

export type { Deal } from "@/types/deals";

function formatEUR(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

// ── Shared leaflet card (used in both leaflet and category views) ──
function LeafletCard({ deal }: { deal: Deal }) {
  return (
    <article className="group relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-900">
      {deal.imageUrl ? (
        <Image src={deal.imageUrl} alt={deal.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-contain" />
      ) : (
        <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-800" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

      {/* TOP: price chip + promo badge */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-2.5">
        <div className="rounded-2xl border border-black/15 bg-white/65 px-3 py-2 shadow-sm backdrop-blur dark:border-white/15 dark:bg-black/55">
          <div className="text-lg font-extrabold leading-none tracking-tight text-accent drop-shadow-sm">
            {formatEUR(deal.price)}
          </div>
          {typeof deal.competitorPrice === "number" ? (
            <div className="mt-1 flex items-center gap-1 text-[10px] leading-none text-zinc-600 dark:text-zinc-300">
              <span className="max-w-[60px] truncate opacity-70">{deal.competitorName ?? "Competitor"}</span>
              <span className="opacity-50 line-through decoration-1">{formatEUR(deal.competitorPrice)}</span>
            </div>
          ) : null}
          {deal.originalPrice && typeof deal.competitorPrice !== "number" ? (
            <div className="mt-1 text-[10px] leading-none text-zinc-600 opacity-50 line-through decoration-1 dark:text-zinc-300">
              {formatEUR(deal.originalPrice)}
            </div>
          ) : null}
        </div>
        {deal.promoLabel ? (
          <span className="rounded-full bg-badge px-2.5 py-1 text-[10px] font-bold shadow-sm">
            {deal.promoLabel}
          </span>
        ) : null}
      </div>

      {/* BOTTOM: name chip */}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <div className="rounded-2xl border border-black/10 bg-white/35 px-2.5 py-1.5 backdrop-blur-sm dark:border-white/10 dark:bg-black/30">
          <h2 className="line-clamp-2 text-[10px] font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
            {deal.name}
          </h2>
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
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

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
        "Other";
      const order = deal.categoryId ? (categoryOrder.get(deal.categoryId) ?? 9999) : 9999;
      if (!groupMap.has(key)) groupMap.set(key, { label, deals: [], order });
      groupMap.get(key)!.deals.push(deal);
    }
    return Array.from(groupMap.values()).sort((a, b) => a.order - b.order);
  }, [filtered, categoryOrder, catIdToName]);

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
        placeholder="Search products or categories…"
      />

      {isFiltering && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {filtered.length} of {deals.length} deals
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-sm text-zinc-400">
          No deals match your filters.
        </div>
      ) : view === "leaflet" ? (

        /* ── Leaflet view: dense full-width grid (mobile only — md+ uses FlierGrid) ── */
        <section className="grid grid-cols-2 gap-3 md:hidden sm:grid-cols-3">
          {filtered.map((deal) => (
            <LeafletCard key={deal.id} deal={deal} />
          ))}
        </section>

      ) : view === "list" ? (

        /* ── List view: compact horizontal rows ── */
        <ul className="divide-y divide-black/[.06] dark:divide-white/[.06]">
          {filtered.map((deal) => (
            <li key={deal.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              {/* Thumbnail */}
              <div className="relative h-[60px] w-[60px] flex-none overflow-hidden rounded-2xl border border-black/[.07] bg-white dark:bg-zinc-900">
                {deal.imageUrl ? (
                  <Image src={deal.imageUrl} alt={deal.name} fill sizes="60px" className="object-contain" />
                ) : (
                  <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800" />
                )}
              </div>

              {/* Name + store/category */}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                  {deal.name}
                </p>
                {(deal.competitorName ?? deal.category) ? (
                  <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-500">
                    {deal.competitorName ? `at ${deal.competitorName}` : deal.category}
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
                <div className="text-[15px] font-extrabold leading-none text-accent">
                  {formatEUR(deal.price)}
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
        <div className="space-y-8">
          {categoryGroups.map((group) => (
            <section key={group.label}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {group.label}
                </h2>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {group.deals.length}
                </span>
              </div>
              {/* Horizontal scroll carousel — no scrollbar */}
              <div
                className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory"
                style={{ scrollbarWidth: "none" }}
              >
                {group.deals.map((deal) => (
                  <div key={deal.id} className="w-36 flex-none snap-start sm:w-40">
                    <LeafletCard deal={deal} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

      )}
    </>
  );
}
