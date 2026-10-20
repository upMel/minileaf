"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useT } from "@/context/LanguageContext";
import type { OfferFilter, ProductSort } from "@/lib/data/storefront";
import { routes } from "@/lib/routes";
import { softHyphenate } from "@/lib/text";
import type { Category, OfferGroup, Product } from "@/types/catalog";

import EmptyState from "../EmptyState";
import { ProductGrid } from "../ProductCard";
import SortSelect from "../SortSelect";
import { useCenterActiveChip } from "../useCenterActiveChip";

export type DealsState = {
  groupId?: string;
  categoryId?: string;
  subcategoryId?: string;
  offer: OfferFilter;
  sort: ProductSort;
};

type Props = {
  groups: OfferGroup[];
  categories: Category[];
  state: DealsState;
  products: Product[];
};

/** /deals?group=…&cat=…&sub=…&type=super|bogo&sort=asc|desc */
function dealsHref(s: Partial<DealsState>): string {
  const p = new URLSearchParams();
  if (s.groupId) p.set("group", s.groupId);
  if (s.categoryId) p.set("cat", s.categoryId);
  if (s.subcategoryId) p.set("sub", s.subcategoryId);
  if (s.offer && s.offer !== "any") p.set("type", s.offer);
  if (s.sort && s.sort !== "default") p.set("sort", s.sort);
  const qs = p.toString();
  return qs ? `${routes.deals()}?${qs}` : routes.deals();
}

/** Thin scroll indicator under the phone's sideways row of group tiles. */
function useScrollTrack() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [track, setTrack] = useState<{ width: number; left: number } | null>(null);
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const update = () => {
      const { clientWidth: w, scrollWidth: sw, scrollLeft: x } = row;
      if (sw <= w + 1) return setTrack(null);
      const f = w / sw;
      setTrack({ width: f * 100, left: (x / (sw - w)) * (1 - f) * 100 });
    };
    update();
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      row.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return { rowRef, track };
}

export default function DealsView({ groups, categories, state, products }: Props) {
  const t = useT().store;
  const d = t.deals;
  const group = groups.find((g) => g.id === state.groupId) ?? null;
  const groupCategories = group
    ? group.categoryIds.map((id) => categories.find((c) => c.id === id)).filter((c): c is Category => Boolean(c))
    : [];
  const single = groupCategories.length === 1 ? groupCategories[0] : null;
  const showSubs = Boolean(group?.showSubcategories && single && single.subcategories.length > 0);

  const { rowRef, track } = useScrollTrack();
  const chipsRef = useCenterActiveChip<HTMLDivElement>(`${state.categoryId}-${state.subcategoryId}`);

  // After picking a group, glide down to its results if they're out of sight.
  const resultsRef = useRef<HTMLElement>(null);
  const prevGroup = useRef(state.groupId);
  useEffect(() => {
    if (prevGroup.current === state.groupId) return;
    prevGroup.current = state.groupId;
    const el = resultsRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top > window.innerHeight * 0.6 || top < 0) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollBy({ top: top - 80, behavior: smooth ? "smooth" : "auto" });
    }
  }, [state.groupId]);

  const base = { groupId: state.groupId, offer: state.offer, sort: state.sort };

  return (
    <>
      <div className="ks-page-head ks-page-gap">
        <h1 className="ks-page-title">{d.title}</h1>
      </div>

      <nav className="ks-groups" aria-label={d.groupsLabel} ref={rowRef}>
        {groups.map((g) => {
          const active = g.id === state.groupId;
          return (
            <Link
              key={g.id}
              href={dealsHref(active ? { offer: state.offer, sort: state.sort } : { groupId: g.id, offer: state.offer, sort: state.sort })}
              className="ks-group"
              aria-current={active ? "true" : undefined}
              scroll={false}
            >
              <span className="ks-group-name">{softHyphenate(g.name)}</span>
              {g.imageUrl && (
                <span className="ks-group-photo">
                  <Image src={g.imageUrl} alt="" width={108} height={108} sizes="54px" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      {track && (
        <div className="ks-track" aria-hidden="true">
          <i style={{ width: `${track.width}%`, transform: `translateX(${(track.left / track.width) * 100}%)` }} />
        </div>
      )}

      <section className="ks-deal-results" ref={resultsRef} aria-live="polite">
        <div className="ks-deal-bar">
          <div>
            <h2>{group?.name ?? d.all}</h2>
            <p className="ks-count">{t.products.count(products.length)}</p>
          </div>
          <div className="ks-deal-tools">
            <div className="ks-seg" role="group" aria-label={d.typeLabel}>
              {(["any", "super", "bogo"] as const).map((o) => (
                <Link
                  key={o}
                  href={dealsHref({ ...state, offer: o })}
                  aria-pressed={state.offer === o}
                  scroll={false}
                  replace
                >
                  {o === "any" ? d.typeAny : o === "super" ? t.products.superPrice : t.products.bogo}
                </Link>
              ))}
            </div>
            {products.length > 1 && <SortSelect value={state.sort} />}
          </div>
        </div>

        {group && (
          <div className="ks-chips" role="group" aria-label={d.filtersLabel} ref={chipsRef}>
            <Link className="ks-chip-reset" href={dealsHref({ offer: state.offer, sort: state.sort })} scroll={false}>
              ✕ {d.reset}
            </Link>
            {groupCategories.length > 1 && (
              <>
                <Link href={dealsHref(base)} aria-pressed={!state.categoryId} scroll={false}>
                  {d.groupAll}
                </Link>
                {groupCategories.map((c) => (
                  <Link key={c.id} href={dealsHref({ ...base, categoryId: c.id })} aria-pressed={state.categoryId === c.id} scroll={false}>
                    {c.name}
                  </Link>
                ))}
              </>
            )}
            {showSubs && single && (
              <>
                <Link href={dealsHref(base)} aria-pressed={!state.subcategoryId} scroll={false}>
                  {d.subAll}
                </Link>
                {single.subcategories.map((s) => (
                  <Link
                    key={s.id}
                    href={dealsHref({ ...base, subcategoryId: s.id })}
                    aria-pressed={state.subcategoryId === s.id}
                    scroll={false}
                  >
                    {s.name}
                  </Link>
                ))}
              </>
            )}
          </div>
        )}

        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            title={group ? d.emptyGroup : d.emptyAll}
            text={d.emptyText}
            action={{ href: routes.flyer(), label: d.seeFlyer }}
          />
        )}
      </section>
    </>
  );
}
