"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { useT } from "@/context/LanguageContext";
import type { ResolvedFlyer } from "@/lib/data/storefront";

import { ImageSheet, PhoneSheet, TemplateSheet, productsByPriority } from "./FlyerSheet";

// ── Layout rules ────────────────────────────────────────────────────────────
// Computer: a book. Portrait flyers open as two-page spreads — the cover alone
// on the right, then 2–3, 4–5… — and pages turn like paper. Landscape flyers
// show one page at a time with the same turn.
// Phone: one page at a time in a row you swipe; builder pages are re-flowed to
// at most four products per page.

const TURN_MS = 560;
const STRIPS = 12;
const PHONE_PER_PAGE = 4;

function subscribeWide(cb: () => void) {
  const mq = window.matchMedia("(min-width: 761px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
/** true / false on the client, null while server-rendering. */
function useWide(): boolean | null {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia("(min-width: 761px)").matches,
    () => null,
  );
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

type Turning = {
  direction: 1 | -1;
  next: number;
  front: number | null;
  back: number | null;
  base: (number | null)[];
};

/**
 * Bends the turning sheet: it's cut into thin vertical strips and each strip
 * rotates a little more than the one before it, so the paper curves as it
 * turns (same motion as the artifact).
 */
function animatePaper(sheet: HTMLElement, direction: 1 | -1): Promise<void> {
  const strips = Array.from(sheet.children) as HTMLElement[];
  const count = strips.length;
  const width = sheet.getBoundingClientRect().width;
  const step = width / count;
  return new Promise((resolve) => {
    let start: number | undefined;
    const frame = (now: number) => {
      if (!sheet.isConnected) return resolve();
      if (start === undefined) start = now;
      const t = Math.min(1, (now - start) / TURN_MS);
      const p = t * t * (3 - 2 * t);
      let x = 0;
      let z = 0;
      strips.forEach((strip, i) => {
        const angle = Math.PI * p + Math.sin(Math.PI * p) * 0.36 * Math.sin((Math.PI * (i + 0.5)) / count);
        const left = direction > 0 ? x : width - x - step;
        strip.style.width = `${step + 1.5}px`;
        strip.style.transformOrigin = direction > 0 ? "left center" : "right center";
        strip.style.transform = `translate3d(${left}px,0,${z}px) rotateY(${direction > 0 ? -angle : angle}rad)`;
        strip.style.setProperty("--paper-shade", String(Math.sin(Math.PI * p) * (0.06 + (0.13 * i) / count)));
        x += step * Math.cos(angle);
        z += step * Math.sin(angle);
      });
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

export default function FlyerReader({ flyer }: { flyer: ResolvedFlyer }) {
  const t = useT().store.flyer;
  const wide = useWide();
  const readerRef = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Computer pages: as designed. Phone pages: builder pages split into fours.
  const deskSheets = useMemo<ReactNode[]>(
    () =>
      flyer.pages.map((p, i) =>
        p.kind === "image" ? (
          <ImageSheet key={p.id} src={p.imageUrl} label={t.pageLabel(i + 1)} />
        ) : (
          <TemplateSheet key={p.id} page={p} landscape={flyer.orientation === "landscape"} />
        ),
      ),
    [flyer, t],
  );
  const phoneSheets = useMemo<ReactNode[]>(
    () =>
      flyer.pages.flatMap((p, i) =>
        p.kind === "image"
          ? [<ImageSheet key={p.id} src={p.imageUrl} label={t.pageLabel(i + 1)} />]
          : chunk(productsByPriority(p), PHONE_PER_PAGE).map((products, j) => <PhoneSheet key={`${p.id}-${j}`} products={products} />),
      ),
    [flyer, t],
  );

  // Fullscreen: the real API where it exists, a fixed overlay otherwise (iOS Safari).
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === readerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  useEffect(() => {
    if (!fullscreen || document.fullscreenElement) return;
    document.documentElement.classList.add("ks-lock");
    return () => document.documentElement.classList.remove("ks-lock");
  }, [fullscreen]);

  async function toggleFullscreen() {
    const el = readerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (fullscreen) return setFullscreen(false);
    if (el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        return;
      } catch {
        // fall through to the overlay
      }
    }
    setFullscreen(true);
  }

  const portrait = flyer.orientation === "portrait";
  const pageRatio = portrait ? 210 / 297 : 297 / 210;

  return (
    <section
      ref={readerRef}
      className={`ks-reader${fullscreen ? " is-full" : ""}`}
      aria-label={t.title}
    >
      <div className="ks-reader-bar">
        <span>{t.browse}</span>
        <button type="button" className="ks-btn-ghost" onClick={() => void toggleFullscreen()}>
          {fullscreen ? t.exitFullscreen : t.fullscreen}
        </button>
      </div>

      {wide === null ? (
        <div className="ks-stage">
          <div className="ks-book ks-book-pending" style={{ "--ar": portrait ? pageRatio * 2 : pageRatio } as CSSProperties} />
        </div>
      ) : wide ? (
        <Book key="book" sheets={deskSheets} spread={portrait} pageRatio={pageRatio} />
      ) : (
        <Slider key="slider" sheets={phoneSheets} />
      )}

      <p className="ks-help">{wide === false ? t.helpTouch : t.helpDesk}</p>
    </section>
  );
}

// ── Computer: the book ──────────────────────────────────────────────────────

function Book({ sheets, spread, pageRatio }: { sheets: ReactNode[]; spread: boolean; pageRatio: number }) {
  const t = useT().store.flyer;
  const n = sheets.length;
  const [pos, setPos] = useState(0);
  const [turning, setTurning] = useState<Turning | null>(null);
  const turnRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const pagesAt = useCallback(
    (at: number): (number | null)[] => {
      if (!spread) return [at];
      if (at === 0) return [null, 0];
      return [at * 2 - 1, at * 2].map((i) => (i < n ? i : null));
    },
    [spread, n],
  );
  const lastPos = spread ? Math.floor(n / 2) : n - 1;

  const turn = useCallback(
    (direction: 1 | -1) => {
      if (turning) return;
      const next = pos + direction;
      if (next < 0 || next > lastPos) return;
      if (reducedMotion()) return setPos(next);
      const oldP = pagesAt(pos);
      const newP = pagesAt(next);
      setTurning(
        spread
          ? {
              direction,
              next,
              front: oldP[direction > 0 ? 1 : 0],
              back: newP[direction > 0 ? 0 : 1],
              base: direction > 0 ? [oldP[0], newP[1]] : [newP[0], oldP[1]],
            }
          : { direction, next, front: oldP[0], back: newP[0], base: newP },
      );
    },
    [turning, pos, lastPos, pagesAt, spread],
  );

  // Run the paper animation once the turning sheet is on screen.
  useLayoutEffect(() => {
    if (!turning || !turnRef.current) return;
    let alive = true;
    void animatePaper(turnRef.current, turning.direction).then(() => {
      if (!alive) return;
      setPos(turning.next);
      setTurning(null);
    });
    return () => {
      alive = false;
    };
  }, [turning]);

  const leaves = turning ? turning.base : pagesAt(pos);
  const shown = pagesAt(pos).filter((i): i is number => i !== null).map((i) => i + 1);
  const pager = shown.length > 1 ? t.pages(shown[0], shown[1], n) : t.page(shown[0] ?? 1, n);
  // Neighbouring pages, rendered invisibly so their photos are loaded before a turn.
  const preload = turning
    ? []
    : [...(pos > 0 ? pagesAt(pos - 1) : []), ...(pos < lastPos ? pagesAt(pos + 1) : [])].filter((i): i is number => i !== null);

  const sheet = (i: number | null) => (i === null ? null : sheets[i]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      turn(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      turn(-1);
    }
  }

  return (
    <>
      <div className="ks-stage" tabIndex={0} onKeyDown={onKeyDown} aria-roledescription="flyer">
        <button type="button" className="ks-arrow" aria-label={t.prev} disabled={pos === 0 || Boolean(turning)} onClick={() => turn(-1)}>
          ‹
        </button>
        <div
          className={`ks-book${spread ? "" : " single"}`}
          style={{ "--ar": spread ? pageRatio * 2 : pageRatio } as CSSProperties}
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY, moved: false };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) d.moved = true;
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            if (!d) return;
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) turn(dx < 0 ? 1 : -1);
          }}
          onClickCapture={(e) => {
            // A drag that turned the page must not also open the product under the pointer.
            if (drag.current?.moved) {
              e.preventDefault();
              e.stopPropagation();
            }
            drag.current = null;
          }}
          onDragStart={(e) => e.preventDefault()}
        >
          {leaves.map((i, k) => (
            <div key={`${k}-${i}`} className={`ks-leaf${i === null ? " blank" : ""}`}>
              {sheet(i)}
            </div>
          ))}

          {turning && (
            <div ref={turnRef} className={`ks-turning ${turning.direction > 0 ? "forward" : "backward"}`} aria-hidden="true">
              {Array.from({ length: STRIPS }, (_, i) => {
                const slice = turning.direction > 0 ? i : STRIPS - 1 - i;
                return (
                  <div key={i} className="ks-strip">
                    <div className="ks-face front" style={{ "--slice": slice } as CSSProperties}>
                      <div className="ks-face-in">{sheet(turning.front)}</div>
                    </div>
                    <div className="ks-face back" style={{ "--slice": STRIPS - 1 - slice } as CSSProperties}>
                      <div className="ks-face-in">{sheet(turning.back)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="ks-preload" aria-hidden="true" inert>
            {preload.map((i) => (
              <div key={i} className="ks-leaf">
                {sheet(i)}
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="ks-arrow"
          aria-label={t.next}
          disabled={pos >= lastPos || Boolean(turning)}
          onClick={() => turn(1)}
        >
          ›
        </button>
      </div>
      <p className="ks-pager" role="status" aria-live="polite">
        {pager}
      </p>
    </>
  );
}

// ── Phone: a row of pages you swipe ────────────────────────────────────────

function Slider({ sheets }: { sheets: ReactNode[] }) {
  const t = useT().store.flyer;
  const n = sheets.length;
  const rowRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0);

  function go(i: number) {
    const row = rowRef.current;
    if (!row) return;
    const next = Math.max(0, Math.min(n - 1, i));
    row.scrollTo({ left: next * row.clientWidth, behavior: reducedMotion() ? "auto" : "smooth" });
  }

  return (
    <>
      <div className="ks-stage">
        <button type="button" className="ks-arrow" aria-label={t.prev} disabled={pos === 0} onClick={() => go(pos - 1)}>
          ‹
        </button>
        <div
          ref={rowRef}
          className="ks-book slider"
          tabIndex={0}
          onScroll={(e) => {
            const row = e.currentTarget;
            const i = Math.round(row.scrollLeft / (row.clientWidth || 1));
            if (i !== pos && i >= 0 && i < n) setPos(i);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(pos + 1);
            if (e.key === "ArrowLeft") go(pos - 1);
          }}
        >
          {sheets.map((s, i) => (
            <div key={i} className="ks-slide" aria-label={t.pageLabel(i + 1)}>
              {s}
            </div>
          ))}
        </div>
        <button type="button" className="ks-arrow" aria-label={t.next} disabled={pos >= n - 1} onClick={() => go(pos + 1)}>
          ›
        </button>
      </div>
      <p className="ks-pager" role="status" aria-live="polite">
        {t.page(pos + 1, n)}
      </p>
    </>
  );
}
