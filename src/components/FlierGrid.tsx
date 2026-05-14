"use client";

import { useEffect, useState } from "react";
import type { Deal } from "@/components/DealsGrid";
import {
  LAYOUT_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  slotSpanClasses,
  type ActiveLayoutConfig,
  type TemplateSlot,
} from "@/lib/layout-templates";

function formatEUR(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

// ── Flier card — adapts to slot size ────────────────────────
function FlierCard({ deal, slot }: { deal: Deal; slot: TemplateSlot }) {
  const isLarge = slot.role === "hero";
  const isMedium = slot.role === "featured";

  return (
    <article
      className={`
        group relative overflow-hidden rounded-3xl border border-black/10 bg-white
        shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md
        dark:border-white/10 dark:bg-zinc-900
        ${isLarge ? "aspect-[3/4]" : isMedium ? "aspect-[3/4]" : "aspect-[3/4]"}
      `}
    >
      {/* Image */}
      {deal.imageUrl ? (
        <img
          src={deal.imageUrl}
          alt={deal.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-800" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

      {/* Price + promo */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-2.5">
        <div className="rounded-2xl border border-black/15 bg-white/65 px-3 py-2 shadow-sm backdrop-blur dark:border-white/15 dark:bg-black/55">
          <div
            className={`font-extrabold leading-none tracking-tight text-accent drop-shadow-sm ${
              isLarge ? "text-2xl" : "text-lg"
            }`}
          >
            {formatEUR(deal.price)}
          </div>
          {deal.originalPrice && (
            <div className="mt-1 text-[10px] leading-none text-zinc-600 opacity-50 line-through decoration-1 dark:text-zinc-300">
              {formatEUR(deal.originalPrice)}
            </div>
          )}
        </div>

        {deal.promoLabel && (
          <span className="rounded-full bg-badge px-2.5 py-1 text-[10px] font-bold leading-none">
            {deal.promoLabel}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p
          className={`font-semibold leading-tight text-white drop-shadow-md ${
            isLarge ? "text-sm" : "text-xs"
          } line-clamp-2`}
        >
          {deal.name}
        </p>
      </div>
    </article>
  );
}

// ── FlierGrid ────────────────────────────────────────────────
export default function FlierGrid({ deals }: { deals: Deal[] }) {
  const [config, setConfig] = useState<ActiveLayoutConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/layout")
      .then((r) => r.json())
      .then((data: ActiveLayoutConfig) => setConfig(data))
      .catch(() => {}) // fall back to null → default render
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3 px-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  const templateId = config?.templateId ?? DEFAULT_TEMPLATE_ID;
  const template = LAYOUT_TEMPLATES.find((t) => t.id === templateId) ?? LAYOUT_TEMPLATES[0];

  // Build the ordered deal list:
  // pinned slots first (in slot priority order), then auto-fill remainder
  const pinnedIds = new Set(Object.values(config?.slots ?? {}).filter(Boolean) as string[]);
  const autoFillDeals = deals.filter((d) => !pinnedIds.has(d.id));

  let autoFillIdx = 0;
  const slotDeals: (Deal | null)[] = template.slots.map((slot) => {
    const pinnedId = config?.slots[slot.id];
    if (pinnedId) {
      return deals.find((d) => d.id === pinnedId) ?? null;
    }
    return autoFillDeals[autoFillIdx++] ?? null;
  });

  return (
    <div
      className="grid w-full gap-3 px-4"
      style={{ gridTemplateColumns: `repeat(${template.cols}, 1fr)` }}
    >
      {template.slots.map((slot, i) => {
        const deal = slotDeals[i];
        if (!deal) return <div key={slot.id} className={`${slotSpanClasses(slot.size)} aspect-[3/4]`} />;
        return (
          <div key={slot.id} className={slotSpanClasses(slot.size)}>
            <FlierCard deal={deal} slot={slot} />
          </div>
        );
      })}
    </div>
  );
}
