"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { ProductRow, PromotionRow } from "@/types/admin";

const PAGE_SIZE = 20;

function promoSummary(promo: PromotionRow): string {
  if (!promo.is_active) return "Inactive";
  if (promo.label) return promo.label;
  if (promo.type === "BOGO") return "1+1";
  if (promo.type === "PERCENT" && typeof promo.percent_off === "number")
    return `-${promo.percent_off}%`;
  if (promo.type === "PRICE" && typeof promo.promo_price === "number")
    return `€${Number(promo.promo_price).toFixed(2)}`;
  return promo.type;
}

type Props = {
  products: ProductRow[];
  promotionsByProductId: Record<string, PromotionRow | undefined>;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onEdit: (p: ProductRow) => void;
  onToggleActive: (p: ProductRow) => void;
  onDelete: (p: ProductRow) => void;
  /** Optional search/filter bar rendered inside the card header area */
  searchBar?: ReactNode;
  /** Total unfiltered count — shown alongside results count */
  totalCount?: number;
  /** Called when the + New button is clicked (opens drawer) */
  onNew?: () => void;
};

export default function ProductList({
  products,
  promotionsByProductId,
  isLoading,
  error,
  onRefresh,
  onEdit,
  onToggleActive,
  onDelete,
  searchBar,
  totalCount,
  onNew,
}: Props) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the filtered list changes
  useEffect(() => { setPage(1); }, [products]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pageProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-black dark:text-zinc-50">All products</h3>
        <div className="flex items-center gap-2">
          {onNew && (
            <Button type="button" variant="primary" onClick={onNew}>
              + New
            </Button>
          )}
          <Button type="button" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      {searchBar && <div className="mt-3">{searchBar}</div>}

      {typeof totalCount === "number" && products.length !== totalCount && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {products.length} of {totalCount} products
        </p>
      )}

      {error ? (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-200">Loading…</div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {pageProducts.map((p) => {
          const promo = promotionsByProductId[p.id];
          const meta = [
            p.category ?? null,
            p.barcode ? `#${p.barcode}` : null,
            typeof p.competitor_price === "number"
              ? `${p.competitor_name ?? "Competitor"}: €${Number(p.competitor_price).toFixed(2)}`
              : null,
            promo ? `Promo: ${promoSummary(promo)}` : null,
          ].filter(Boolean).join(" · ");

          return (
            <article
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-black/8 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-800"
            >
              {/* Thumbnail */}
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-black/8 bg-zinc-100 dark:border-white/10 dark:bg-zinc-700">
                {p.image_url ? (
                  <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg leading-none text-zinc-300 dark:text-zinc-600">
                    □
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate text-sm font-semibold text-black dark:text-zinc-50">
                    {p.name}
                  </span>
                  {!p.is_active && (
                    <span className="shrink-0 rounded-full border border-black/10 px-1.5 py-px text-[10px] font-medium text-zinc-500 dark:border-white/15 dark:text-zinc-400">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    €{Number(p.price).toFixed(2)}
                  </span>
                  {meta ? ` · ${meta}` : null}
                </div>
              </div>

              {/* Actions — icon buttons */}
              <div className="flex shrink-0 items-center gap-1">
                {/* Toggle active */}
                <button
                  type="button"
                  title={p.is_active ? "Deactivate" : "Activate"}
                  onClick={() => onToggleActive(p)}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                >
                  {p.is_active ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 11 12 14 22 4"/></svg>
                  )}
                </button>
                {/* Edit */}
                <button
                  type="button"
                  title="Edit"
                  onClick={() => onEdit(p)}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                {/* Delete */}
                <button
                  type="button"
                  title="Delete"
                  onClick={() => onDelete(p)}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </article>
          );
        })}

        {!isLoading && products.length === 0 ? (
          <div className="text-sm text-zinc-700 dark:text-zinc-200">No products found.</div>
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-black/10 pt-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            ← Prev
          </button>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Page {page} of {totalPages} · {products.length} products
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            Next →
          </button>
        </div>
      )}
    </Card>
  );
}
