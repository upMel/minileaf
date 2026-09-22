"use client";

import Image from "next/image";
import { useEffect } from "react";

import { useT } from "@/context/LanguageContext";
import { formatEUR, formatPrice } from "@/lib/price";
import type { Deal } from "@/types/deals";

type Props = {
  deal: Deal;
  /** Resolved category name, when the grid knows it. */
  categoryLabel?: string;
  onClose: () => void;
};

export default function ProductDetailModal({ deal, categoryLabel, onClose }: Props) {
  const t = useT();

  // Close on Escape, and stop the page behind from scrolling.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const reference = deal.originalPrice ?? deal.competitorPrice;
  const saving = reference !== undefined && reference > deal.price ? reference - deal.price : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={deal.name}
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-black/10 bg-white shadow-2xl sm:rounded-3xl dark:border-white/15 dark:bg-zinc-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/[.06] px-5 py-4 dark:border-white/[.06]">
          <h2 className="text-base font-semibold leading-snug text-black dark:text-zinc-50">
            {deal.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="-mr-1.5 -mt-1 shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Image */}
          <div className="relative mx-auto h-48 w-full overflow-hidden rounded-2xl border border-black/[.06] bg-white dark:border-white/[.1]">
            {deal.imageUrl ? (
              <Image
                src={deal.imageUrl}
                alt={deal.name}
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                className="object-contain p-3"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-300">
                <svg className="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            )}
            {deal.promoLabel ? (
              <span className="absolute right-2.5 top-2.5 rounded-full bg-badge px-2.5 py-1 text-[11px] font-bold shadow-sm">
                {deal.promoLabel}
              </span>
            ) : null}
          </div>

          {/* Price block */}
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-extrabold leading-none tracking-tight tabular-nums text-accent">
              {formatPrice(deal.price, deal.priceUnit, t.units.kg)}
            </span>
            {deal.originalPrice ? (
              <span className="text-sm text-zinc-400 line-through dark:text-zinc-500">
                {formatEUR(deal.originalPrice)}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {deal.priceUnit === "kg" ? t.productDetail.pricedPerKg : t.productDetail.pricedPerPiece}
          </p>

          {saving !== null ? (
            <p className="mt-1.5 text-xs font-medium text-green-700 dark:text-green-400">
              {t.productDetail.youSave(formatEUR(saving))}
            </p>
          ) : null}

          {/* Facts */}
          <dl className="mt-4 divide-y divide-black/[.06] border-t border-black/[.06] text-sm dark:divide-white/[.06] dark:border-white/[.06]">
            {categoryLabel || deal.category ? (
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{t.productDetail.category}</dt>
                <dd className="min-w-0 text-right text-zinc-800 dark:text-zinc-200">
                  {categoryLabel ?? deal.category}
                </dd>
              </div>
            ) : null}

            {deal.originalPrice ? (
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{t.productDetail.regularPrice}</dt>
                <dd className="min-w-0 text-right text-zinc-800 dark:text-zinc-200">
                  {formatPrice(deal.originalPrice, deal.priceUnit, t.units.kg)}
                </dd>
              </div>
            ) : null}

            {typeof deal.competitorPrice === "number" ? (
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">
                  {t.productDetail.competitorAt(deal.competitorName ?? t.deals.competitor)}
                </dt>
                <dd className="min-w-0 text-right text-zinc-800 dark:text-zinc-200">
                  {formatEUR(deal.competitorPrice)}
                </dd>
              </div>
            ) : null}

            {deal.promoLabel ? (
              <div className="flex items-start justify-between gap-4 py-2">
                <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{t.productDetail.offer}</dt>
                <dd className="min-w-0 text-right font-medium text-zinc-800 dark:text-zinc-200">
                  {deal.promoLabel}
                </dd>
              </div>
            ) : null}
          </dl>

          {/* Description */}
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {t.productDetail.description}
            </h3>
            <p
              className={`mt-1.5 text-sm leading-relaxed whitespace-pre-line ${
                deal.description
                  ? "text-zinc-700 dark:text-zinc-300"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {deal.description || t.productDetail.noDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
