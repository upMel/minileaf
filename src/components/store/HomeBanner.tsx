"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useT } from "@/context/LanguageContext";
import type { ResolvedBanner, ResolvedBannerSlot } from "@/lib/data/storefront";
import { BANNER_TEMPLATES, bannerGridAreas, getBannerTemplate } from "@/lib/banner-templates";
import { routes } from "@/lib/routes";

import { OfferBadges, usePrice } from "./ProductCard";

const ROTATE_MS = 5000;
/** After a finger touches the phone banner, it stops moving on its own for a while. */
const TOUCH_PAUSE_MS = 8000;
const FLASH_LEAD_MS = 260;

/** Remembers when the phone banner was last touched (module-level so render stays pure). */
function stamp(ref: { current: number }) {
  ref.current = Date.now();
}

const PHONE = "(max-width: 760px)";
const REDUCE = "(prefers-reduced-motion: reduce)";

function Slot({ slot, sizes, eager }: { slot: ResolvedBannerSlot; sizes: string; eager: boolean }) {
  const t = useT().store.home;
  const price = usePrice();

  if (slot.kind === "product") {
    const p = slot.product;
    return (
      <Link className="ks-bslot ks-bslot-product" href={routes.product(p.id)} aria-label={`${p.name}, ${price(p)}`}>
        <span className="ks-bslot-photo">
          {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes={sizes} priority={eager} draggable={false} />}
        </span>
        <span className="ks-bslot-info">
          <OfferBadges product={p} />
          <b className="ks-bslot-name">{p.name}</b>
          {p.size && <small>{p.size}</small>}
          <span className="ks-bslot-price">{price(p)}</span>
        </span>
      </Link>
    );
  }

  const picture = <Image src={slot.imageUrl} alt={slot.alt || t.bannerImage} fill sizes={sizes} priority={eager} draggable={false} />;
  if (!slot.href) return <span className="ks-bslot ks-bslot-image">{picture}</span>;
  if (slot.external) {
    return (
      <a className="ks-bslot ks-bslot-image" href={slot.href} target="_blank" rel="noopener noreferrer">
        {picture}
      </a>
    );
  }
  return (
    <Link className="ks-bslot ks-bslot-image" href={slot.href}>
      {picture}
    </Link>
  );
}

/**
 * Top of the home page: the artifact's "Οι προσφορές της εβδομάδας" panel with
 * the admin's banner beside it. On a computer the banner pages take turns every
 * 5 s (a bright flash, then the next page); on a phone every box is its own
 * slide you swipe, and it moves on by itself while nobody touches it.
 */
export default function HomeBanner({ banner }: { banner: ResolvedBanner | null }) {
  const t = useT().store.home;
  const pages = useMemo(() => banner?.pages ?? [], [banner]);
  const slides = useMemo(
    () =>
      pages.flatMap((page) => {
        const template = getBannerTemplate(page.templateId) ?? BANNER_TEMPLATES[0];
        return template.slots.flatMap((s) => (page.slots[s.id] ? [{ key: `${page.id}-${s.id}`, slot: page.slots[s.id] }] : []));
      }),
    [pages],
  );

  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState(0);
  const [slide, setSlide] = useState(0);
  const hovered = useRef(false);
  const focused = useRef(false);
  const touchedAt = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const reduce = window.matchMedia(REDUCE).matches;
      if (window.matchMedia(PHONE).matches) {
        const track = trackRef.current;
        if (!track || slides.length < 2 || Date.now() - touchedAt.current < TOUCH_PAUSE_MS) return;
        const i = Math.round(track.scrollLeft / (track.clientWidth || 1));
        track.scrollTo({ left: ((i + 1) % slides.length) * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
        return;
      }
      if (pages.length < 2 || hovered.current || focused.current) return;
      if (!reduce) setFlash((f) => f + 1);
      window.setTimeout(() => setIndex((i) => (i + 1) % pages.length), reduce ? 0 : FLASH_LEAD_MS);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [pages.length, slides.length]);

  function goToSlide(i: number) {
    const track = trackRef.current;
    if (!track) return;
    stamp(touchedAt);
    const reduce = window.matchMedia(REDUCE).matches;
    track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }

  const current = Math.min(index, Math.max(0, pages.length - 1));

  return (
    <section className="ks-hero" aria-labelledby="hero-title">
      <div className="ks-hero-text">
        <span className="ks-hero-tag">{t.heroTag}</span>
        <h2 id="hero-title">{t.heroTitle}</h2>
        <p>{t.heroText}</p>
        <Link className="ks-btn ks-hero-btn" href={routes.deals()}>
          {t.heroButton}
        </Link>
      </div>

      {pages.length > 0 && (
        <div className="ks-show" role="region" aria-roledescription="carousel" aria-label={t.bannerLabel}>
          {/* Computer: one page at a time, boxes laid out by the page's template */}
          <div
            className="ks-show-pages"
            onMouseEnter={() => (hovered.current = true)}
            onMouseLeave={() => (hovered.current = false)}
            onFocus={() => (focused.current = true)}
            onBlur={() => (focused.current = false)}
          >
            {pages.map((page, i) => {
              const template = getBannerTemplate(page.templateId) ?? BANNER_TEMPLATES[0];
              const on = i === current;
              return (
                <div
                  key={page.id}
                  className={`ks-show-page${on ? " on" : ""}`}
                  style={{ gridTemplateColumns: template.columns, gridTemplateAreas: bannerGridAreas(template) }}
                  aria-hidden={!on}
                  inert={!on}
                  aria-roledescription="slide"
                  aria-label={t.bannerPage(i + 1, pages.length)}
                >
                  {template.slots.map((s) => {
                    const slot = page.slots[s.id];
                    return (
                      <div key={s.id} className={`ks-show-cell${slot ? "" : " empty"}`} style={{ gridArea: s.id }}>
                        {slot && (
                          <Slot slot={slot} sizes={template.slots.length > 1 ? "(max-width: 760px) 1px, 32vw" : "(max-width: 760px) 1px, 60vw"} eager={i === 0} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <span key={flash} className={`ks-show-flash${flash ? " go" : ""}`} aria-hidden="true" />
          </div>
          {pages.length > 1 && (
            <div className="ks-show-dots ks-show-dots-pages">
              {pages.map((page, i) => (
                <button
                  key={page.id}
                  type="button"
                  aria-label={t.bannerShowPage(i + 1)}
                  aria-current={i === current ? "true" : undefined}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          )}

          {/* Phone: every box is its own slide */}
          <div
            ref={trackRef}
            className="ks-show-track"
            onScroll={(e) => {
              const el = e.currentTarget;
              setSlide(Math.round(el.scrollLeft / (el.clientWidth || 1)));
            }}
            onTouchStart={() => stamp(touchedAt)}
            onTouchEnd={() => stamp(touchedAt)}
          >
            {slides.map((s, i) => (
              <div key={s.key} className="ks-show-slide" aria-roledescription="slide" aria-label={t.bannerPage(i + 1, slides.length)}>
                <Slot slot={s.slot} sizes="(max-width: 760px) 100vw, 1px" eager={i === 0} />
              </div>
            ))}
          </div>
          {slides.length > 1 && (
            <div className="ks-show-dots ks-show-dots-slides">
              {slides.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  aria-label={t.bannerShowPage(i + 1)}
                  aria-current={i === slide ? "true" : undefined}
                  onClick={() => goToSlide(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
