"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Deal } from "@/types/deals";
import { useT } from "@/context/LanguageContext";
import { formatPrice, formatEUR } from "@/lib/price";
import ProductDetailModal from "@/components/home/ProductDetailModal";
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
// ── Flier card ─────────────────────────────────────────────────────────────────
function FlierCard({
  deal,
  slot,
  onSelect,
}: {
  deal: Deal;
  slot: TemplateSlot;
  onSelect: (deal: Deal) => void;
}) {
  const t = useT();
  const isLarge = slot.role === "hero";
  const isSmall = slot.role === "small";
  const reference = deal.originalPrice ?? deal.competitorPrice;

  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-black/[.07]">
      <button
        type="button"
        onClick={() => onSelect(deal)}
        className="absolute inset-0 z-10 cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <span className="sr-only">{t.productDetail.viewDetails}</span>
      </button>

      {/* Image panel — takes all remaining height so the product reads large.
          Previously the photo sat behind the price/name overlays, which ate
          roughly half of it. */}
      <div className="relative min-h-0 flex-1 bg-white">
        {deal.imageUrl ? (
          <Image
            src={deal.imageUrl}
            alt={deal.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className={`object-contain ${isSmall ? "p-1.5" : "p-2.5"}`}
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-50" />
        )}

        {deal.promoLabel && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-badge px-1.5 py-0.5 text-[9px] font-bold leading-tight shadow-sm">
            {deal.promoLabel}
          </span>
        )}
      </div>

      {/* Info strip */}
      <div className={`shrink-0 border-t border-black/[.06] ${isSmall ? "px-1.5 pb-1.5 pt-1" : "px-2 pb-2 pt-1.5"}`}>
        <p
          className={`line-clamp-2 font-medium leading-tight text-zinc-600 ${
            isLarge ? "text-[11px]" : isSmall ? "text-[8px]" : "text-[9px]"
          }`}
        >
          {deal.name}
        </p>
        <div className="mt-1 flex items-baseline gap-1">
          <span
            className={`font-extrabold leading-none tracking-tight tabular-nums text-accent ${
              isLarge ? "text-2xl" : isSmall ? "text-[13px]" : "text-base"
            }`}
          >
            {formatPrice(deal.price, deal.priceUnit, t.units.kg)}
          </span>
          {reference !== undefined && reference > deal.price && (
            <span className={`leading-none text-zinc-400 line-through decoration-1 ${isSmall ? "text-[8px]" : "text-[10px]"}`}>
              {formatEUR(reference)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Page renderer ─────────────────────────────────────────────────────────────
function LeafletPage({
  page,
  deals,
  onSelect,
}: {
  page: LeafletPage;
  deals: Deal[];
  onSelect: (deal: Deal) => void;
}) {
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
      className="grid h-full w-full gap-1.5 p-2 sm:gap-2 sm:p-3"
      style={{ gridTemplateColumns: `repeat(${template.cols}, 1fr)` }}
    >
      {template.slots.map((slot, i) => {
        const deal = slotDeals[i];
        return (
          <div key={slot.id} className={slotSpanClasses(slot.size)}>
            {deal ? <FlierCard deal={deal} slot={slot} onSelect={onSelect} /> : <div className="h-full w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800" />}
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

// ── Fullscreen icon ───────────────────────────────────────────────────────────
function FullscreenIcon({ active }: { active: boolean }) {
  return active ? (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
    </svg>
  ) : (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

// ── Main viewer ────────────────────────────────────────────────────────────────
export default function LeafletViewer({ deals }: { deals: Deal[] }) {
  const t = useT();
  const [leaflet, setLeaflet] = useState<ActiveLeaflet>(undefined as unknown as ActiveLeaflet);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  // Set once the reader picks an orientation by hand, so the responsive default
  // stops fighting them on the next resize.
  const [orientationPinned, setOrientationPinned] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen — real Fullscreen API where supported, plus a CSS fixed-overlay
  // fallback (needed on iOS Safari, which doesn't support element fullscreen).
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Measures the space actually available for the page frame and fits the
  // A4 box within it (bounded by BOTH width and height), instead of deriving
  // width purely from a height-based calc — which overflowed/clipped on
  // narrow or short (mobile) viewports.
  const frameWrapRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    fetch("/api/leaflet")
      .then((r) => r.json())
      .then((data: ActiveLeaflet) => {
        setLeaflet(data);
      })
      .catch(() => setLeaflet(null))
      .finally(() => setLoading(false));
  }, []);

  // Keep our fullscreen state in sync if the user exits via Esc / browser UI.
  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) setIsFullscreen(false);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Lock body scroll while the CSS overlay is covering the screen.
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  // Orientation follows the device: phones get a portrait page (and flip to
  // landscape if the phone is turned), desktop browsers get a landscape spread.
  // A manual pick on desktop wins from then on.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mobileMql = window.matchMedia("(max-width: 639px)");
    const portraitMql = window.matchMedia("(orientation: portrait)");

    function syncOrientation() {
      if (mobileMql.matches) {
        // Phones always track the physical device orientation.
        setOrientation(portraitMql.matches ? "portrait" : "landscape");
      } else if (!orientationPinned) {
        setOrientation("landscape");
      }
    }

    syncOrientation();
    mobileMql.addEventListener("change", syncOrientation);
    portraitMql.addEventListener("change", syncOrientation);
    return () => {
      mobileMql.removeEventListener("change", syncOrientation);
      portraitMql.removeEventListener("change", syncOrientation);
    };
  }, [loading, orientationPinned]);

  async function toggleFullscreen() {
    if (!isFullscreen) {
      setIsFullscreen(true);
      const el = rootRef.current;
      if (el && !document.fullscreenElement && el.requestFullscreen) {
        try {
          await el.requestFullscreen();
        } catch {
          // Fullscreen API unsupported/denied — CSS overlay above still applies.
        }
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // Ignore — element may already have exited.
        }
      }
    }
  }

  useLayoutEffect(() => {
    const el = frameWrapRef.current;
    if (!el) return;
    const ratio = orientation === "portrait" ? 210 / 297 : 297 / 210; // width / height

    function measure() {
      const { width: availW, height: availH } = el!.getBoundingClientRect();
      if (availW <= 0 || availH <= 0) return;
      let width = availW;
      let height = width / ratio;
      if (height > availH) {
        height = availH;
        width = height * ratio;
      }
      setFrameSize({ width: Math.floor(width), height: Math.floor(height) });
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [orientation, loading, leaflet]);

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

  if (loading) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center bg-zinc-100 p-2 sm:p-4 dark:bg-zinc-800/60">
        <div ref={frameWrapRef} className="flex h-full w-full min-h-0 min-w-0 items-center justify-center">
          <div
            className="animate-pulse rounded-2xl bg-zinc-200 sm:rounded-3xl dark:bg-zinc-700"
            style={{ width: frameSize.width || undefined, height: frameSize.height || undefined }}
          />
        </div>
      </div>
    );
  }

  if (!leaflet || totalPages === 0) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center bg-zinc-100 p-2 sm:p-4 dark:bg-zinc-800/60">
        <div ref={frameWrapRef} className="flex h-full w-full min-h-0 min-w-0 items-center justify-center">
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/10 text-zinc-400 sm:rounded-3xl dark:border-white/10"
            style={{ width: frameSize.width || undefined, height: frameSize.height || undefined }}
          >
            <svg className="size-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6M9 13h4" />
            </svg>
            <p className="text-sm">{t.leaflet.noActiveLeaflet}</p>
            <p className="px-4 text-center text-xs opacity-60">{t.leaflet.noActiveLeafletHint}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPage = pages[page] ?? pages[0];

  return (
    <div
      ref={rootRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-[100] flex h-dvh min-h-0 w-dvw flex-col items-center gap-2 overflow-hidden bg-zinc-100 px-2 py-2 sm:gap-3 sm:px-4 sm:py-4 dark:bg-zinc-800/60"
          : "flex flex-1 min-h-0 flex-col items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4 sm:py-4 bg-zinc-100 dark:bg-zinc-800/60"
      }
    >
      {/* Controls: orientation (desktop only — mobile auto-matches device orientation) + fullscreen toggle */}
      <div className="flex w-full shrink-0 items-center justify-end gap-1.5">
        <div className="hidden items-center gap-1.5 sm:flex">
          {(["landscape", "portrait"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { setOrientation(o); setOrientationPinned(true); }}
              title={o === "landscape" ? t.leaflet.landscape : t.leaflet.portrait}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${orientation === o ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]" : "border-black/10 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"}`}
            >
              <OrientIcon orientation={o} />
              <span>{o === "landscape" ? t.leaflet.landscape : t.leaflet.portrait}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          title={isFullscreen ? t.leaflet.exitFullscreen : t.leaflet.fullscreen}
          className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"
        >
          <FullscreenIcon active={isFullscreen} />
        </button>
      </div>

      {/* A4 frame — fills the full available space; prev/next arrows overlay on top, vertically centered */}
      <div className="relative flex flex-1 min-h-0 w-full justify-center">
        <div ref={frameWrapRef} className="flex h-full min-h-0 w-full min-w-0 items-center justify-center">
          <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl sm:rounded-3xl"
            style={{
              width: frameSize.width || undefined,
              height: frameSize.height || undefined,
            }}
          >
            <LeafletPage page={currentPage} deals={deals} onSelect={setSelectedDeal} />

            <button
              type="button"
              onClick={prev}
              disabled={page === 0}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-xl border border-black/10 bg-white/90 p-2 text-zinc-500 shadow-sm backdrop-blur transition-all hover:bg-white disabled:pointer-events-none disabled:opacity-0 dark:border-white/10 dark:bg-zinc-900/90 dark:text-zinc-400"
              aria-label={t.leaflet.previousPage}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={next}
              disabled={page === totalPages - 1}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-xl border border-black/10 bg-white/90 p-2 text-zinc-500 shadow-sm backdrop-blur transition-all hover:bg-white disabled:pointer-events-none disabled:opacity-0 dark:border-white/10 dark:bg-zinc-900/90 dark:text-zinc-400"
              aria-label={t.leaflet.nextPage}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Page dots */}
      {totalPages > 1 && (
        <div className="flex shrink-0 items-center gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`rounded-full transition-all ${i === page ? "w-5 h-2 bg-[var(--accent)]" : "size-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500"}`}
              aria-label={t.leaflet.page(i + 1)}
            />
          ))}
        </div>
      )}

      {selectedDeal && (
        <ProductDetailModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </div>
  );
}
