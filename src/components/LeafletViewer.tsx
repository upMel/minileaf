"use client";

import { useEffect, useRef, useState } from "react";
import type { Deal } from "@/components/DealsGrid";
import { LAYOUT_TEMPLATES, slotSpanClasses, type TemplateSlot } from "@/lib/layout-templates";

// ── Types ─────────────────────────────────────────────────────────────────────
type LeafletPage = {
  id: string;
  page_order: number;
  template_id: string;
  slots: Record<string, string | null>;
};

type ActiveLeaflet = {
  id: string;
  name: string;
  orientation: "portrait" | "landscape";
  pages: LeafletPage[];
} | null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatEUR(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

// ── Flier card ─────────────────────────────────────────────────────────────────
function FlierCard({ deal, slot }: { deal: Deal; slot: TemplateSlot }) {
  const isLarge = slot.role === "hero";
  return (
    <article className="group relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/8">
      {/* Product image — always on white, with padding so it breathes */}
      {deal.imageUrl ? (
        <img
          src={deal.imageUrl}
          alt={deal.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain p-3"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-50" />
      )}

      {/* Scrim only at the bottom for name readability */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

      {/* Price + promo badge */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-2">
        <div className="rounded-xl bg-white/90 px-2.5 py-1.5 shadow-sm ring-1 ring-black/8 backdrop-blur-sm">
          <div className={`font-extrabold leading-none tracking-tight text-accent ${isLarge ? "text-xl" : "text-sm"}`}>
            {formatEUR(deal.price)}
          </div>
          {deal.originalPrice && (
            <div className="mt-0.5 text-[9px] leading-none text-zinc-500 line-through">
              {formatEUR(deal.originalPrice)}
            </div>
          )}
          {deal.competitorPrice != null && deal.competitorName && (
            <div className="mt-1 border-t border-black/8 pt-1 text-[8px] leading-none text-zinc-500">
              {deal.competitorName}:{" "}
              <span className="font-semibold">{formatEUR(deal.competitorPrice)}</span>
            </div>
          )}
        </div>
        {deal.promoLabel && (
          <span className="rounded-full bg-badge px-2 py-0.5 text-[9px] font-bold leading-none">
            {deal.promoLabel}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="absolute inset-x-0 bottom-0 p-2">
        <p className={`font-semibold leading-tight text-white drop-shadow-md line-clamp-2 ${isLarge ? "text-xs" : "text-[10px]"}`}>
          {deal.name}
        </p>
      </div>
    </article>
  );
}

// ── Page renderer ─────────────────────────────────────────────────────────────
function LeafletPage({ page, deals }: { page: LeafletPage; deals: Deal[] }) {
  const template = LAYOUT_TEMPLATES.find((t) => t.id === page.template_id) ?? LAYOUT_TEMPLATES[0];
  const pinnedIds = new Set(Object.values(page.slots).filter(Boolean) as string[]);
  const autoFillDeals = deals.filter((d) => !pinnedIds.has(d.id));
  let autoIdx = 0;

  const slotDeals = template.slots.map((slot) => {
    const pinnedId = page.slots[slot.id];
    if (pinnedId) return deals.find((d) => d.id === pinnedId) ?? null;
    return autoFillDeals[autoIdx++] ?? null;
  });

  return (
    <div
      className="grid h-full w-full gap-2 p-3"
      style={{ gridTemplateColumns: `repeat(${template.cols}, 1fr)` }}
    >
      {template.slots.map((slot, i) => {
        const deal = slotDeals[i];
        return (
          <div key={slot.id} className={slotSpanClasses(slot.size)}>
            {deal ? <FlierCard deal={deal} slot={slot} /> : <div className="h-full w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Orientation icon ──────────────────────────────────────────────────────────
function OrientIcon({ orientation }: { orientation: "portrait" | "landscape" }) {
  return orientation === "portrait" ? (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="20" rx="2" />
    </svg>
  ) : (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  );
}

// ── Main viewer ────────────────────────────────────────────────────────────────
export default function LeafletViewer({ deals }: { deals: Deal[] }) {
  const [leaflet, setLeaflet] = useState<ActiveLeaflet>(undefined as unknown as ActiveLeaflet);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");

  // Swipe tracking
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/leaflet")
      .then((r) => r.json())
      .then((data: ActiveLeaflet) => {
        setLeaflet(data);
        if (data?.orientation) setOrientation(data.orientation);
      })
      .catch(() => setLeaflet(null))
      .finally(() => setLoading(false));
  }, []);

  const pages = leaflet?.pages ?? [];
  const totalPages = pages.length;

  function prev() { setPage((p) => Math.max(0, p - 1)); }
  function next() { setPage((p) => Math.min(totalPages - 1, p + 1)); }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta < -50) next();
    else if (delta > 50) prev();
  }

  // Aspect ratio: portrait = 210:297, landscape = 297:210
  const aspectRatio = orientation === "portrait" ? "210 / 297" : "297 / 210";

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div
          className="animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800"
          style={{ aspectRatio, maxHeight: "calc(100dvh - 72px)", width: "auto", height: "calc(100dvh - 72px)" }}
        />
      </div>
    );
  }

  if (!leaflet || totalPages === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-black/10 text-zinc-400 dark:border-white/10"
          style={{ aspectRatio, maxHeight: "calc(100dvh - 72px)", width: "auto", height: "calc(100dvh - 72px)" }}
        >
          <svg className="size-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 13h4" />
          </svg>
          <p className="text-sm">No active leaflet</p>
          <p className="text-xs opacity-60">Create and activate a layout in the admin panel</p>
        </div>
      </div>
    );
  }

  const currentPage = pages[page] ?? pages[0];

  return (
    <div className="flex flex-1 flex-col items-center gap-3 px-4 py-4 bg-zinc-100 dark:bg-zinc-800/60">
      {/* Orientation toggle */}
      <div className="flex items-center gap-1.5 self-end">
        {(["landscape", "portrait"] as const).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setOrientation(o)}
            title={o === "landscape" ? "Landscape" : "Portrait"}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${orientation === o ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]" : "border-black/10 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"}`}
          >
            <OrientIcon orientation={o} />
            <span className="capitalize">{o}</span>
          </button>
        ))}
      </div>

      {/* A4 frame + side arrows */}
      <div className="flex flex-1 items-center gap-3 w-full justify-center">
        {/* Left arrow */}
        <button
          type="button"
          onClick={prev}
          disabled={page === 0}
          className="shrink-0 rounded-xl border border-black/10 bg-white p-2 text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-20 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"
          aria-label="Previous page"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {/* A4 page */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl"
          style={{
            aspectRatio,
            maxHeight: "calc(100dvh - 148px)",
            height: "calc(100dvh - 148px)",
            width: "auto",
          }}
        >
          <LeafletPage page={currentPage} deals={deals} />
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={next}
          disabled={page === totalPages - 1}
          className="shrink-0 rounded-xl border border-black/10 bg-white p-2 text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-20 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"
          aria-label="Next page"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Page dots */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`rounded-full transition-all ${i === page ? "w-5 h-2 bg-[var(--accent)]" : "size-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500"}`}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
