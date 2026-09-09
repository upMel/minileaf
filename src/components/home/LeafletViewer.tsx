"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Deal } from "@/types/deals";
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
      {deal.imageUrl ? (
        <Image
          src={deal.imageUrl}
          alt={deal.name}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-contain p-3"
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
  const [leaflet, setLeaflet] = useState<ActiveLeaflet>(undefined as unknown as ActiveLeaflet);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");

  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen — real Fullscreen API where supported, plus a CSS fixed-overlay
  // fallback (needed on iOS Safari, which doesn't support element fullscreen).
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        if (data?.orientation) setOrientation(data.orientation);
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

  // On mobile, skip the manual orientation toggle and match the device's
  // actual screen orientation automatically (like most other sites).
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mobileMql = window.matchMedia("(max-width: 639px)");
    const portraitMql = window.matchMedia("(orientation: portrait)");

    function syncMobileOrientation() {
      if (mobileMql.matches) {
        setOrientation(portraitMql.matches ? "portrait" : "landscape");
      }
    }

    syncMobileOrientation();
    mobileMql.addEventListener("change", syncMobileOrientation);
    portraitMql.addEventListener("change", syncMobileOrientation);
    return () => {
      mobileMql.removeEventListener("change", syncMobileOrientation);
      portraitMql.removeEventListener("change", syncMobileOrientation);
    };
  }, [loading]);

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
            <p className="text-sm">No active leaflet</p>
            <p className="px-4 text-center text-xs opacity-60">Create and activate a layout in the admin panel</p>
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
              onClick={() => setOrientation(o)}
              title={o === "landscape" ? "Landscape" : "Portrait"}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${orientation === o ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]" : "border-black/10 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"}`}
            >
              <OrientIcon orientation={o} />
              <span className="capitalize">{o}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400"
        >
          <FullscreenIcon active={isFullscreen} />
        </button>
      </div>

      {/* A4 frame — fills the full available space; prev/next arrows overlay on top, vertically centered */}
      <div className="relative flex flex-1 min-h-0 w-full justify-center">
        <div ref={frameWrapRef} className="flex h-full min-h-0 min-w-0 w-full items-start justify-center">
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
            <LeafletPage page={currentPage} deals={deals} />

            <button
              type="button"
              onClick={prev}
              disabled={page === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl border border-black/10 bg-white/90 p-2 text-zinc-500 shadow-sm backdrop-blur transition-all hover:bg-white disabled:opacity-0 dark:border-white/10 dark:bg-zinc-900/90 dark:text-zinc-400"
              aria-label="Previous page"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={next}
              disabled={page === totalPages - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-black/10 bg-white/90 p-2 text-zinc-500 shadow-sm backdrop-blur transition-all hover:bg-white disabled:opacity-0 dark:border-white/10 dark:bg-zinc-900/90 dark:text-zinc-400"
              aria-label="Next page"
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
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
