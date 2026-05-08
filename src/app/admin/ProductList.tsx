"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import type { ProductRow, PromotionRow } from "@/types/admin";

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
}: Props) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-black dark:text-zinc-50">All products</h3>
        <Button type="button" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-200">Loading…</div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        {products.map((p) => {
          const promo = promotionsByProductId[p.id];
          return (
            <article
              key={p.id}
              className="rounded-xl border border-black/8 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold text-black dark:text-zinc-50">
                      {p.name}
                    </h4>
                    {!p.is_active ? (
                      <span className="rounded-full border border-black/10 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:border-white/15 dark:text-zinc-200">
                        Inactive
                      </span>
                    ) : null}
                  </div>

                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Price:{" "}
                    <span className="font-medium">€{Number(p.price).toFixed(2)}</span>
                    {typeof p.competitor_price === "number" ? (
                      <>
                        {" "}
                        · Competitor{p.competitor_name ? ` (${p.competitor_name})` : ""}:{" "}
                        <span className="font-medium">
                          €{Number(p.competitor_price).toFixed(2)}
                        </span>
                      </>
                    ) : null}
                  </div>

                  {p.sku || p.category ? (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {p.sku ? `SKU: ${p.sku}` : null}
                      {p.sku && p.category ? " · " : null}
                      {p.category ? `Category: ${p.category}` : null}
                    </div>
                  ) : null}

                  {promo ? (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Promotion:{" "}
                      <span className="font-medium">{promoSummary(promo)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" onClick={() => onToggleActive(p)}>
                    {p.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button type="button" variant="primary" onClick={() => onEdit(p)}>
                    Edit
                  </Button>
                  <Button type="button" variant="danger" onClick={() => onDelete(p)}>
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          );
        })}

        {!isLoading && products.length === 0 ? (
          <div className="text-sm text-zinc-700 dark:text-zinc-200">No products found.</div>
        ) : null}
      </div>
    </Card>
  );
}
