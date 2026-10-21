"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { useT } from "@/context/LanguageContext";
import { foldGreek, searchTerms } from "@/lib/greek";
import { formatPrice } from "@/lib/price";
import { routes } from "@/lib/routes";
import type { Category, Product } from "@/types/catalog";

import { SearchIcon } from "./icons";
import { useTypingPlaceholder } from "./useTypingPlaceholder";

type Props = {
  categories: Category[];
  /** Shared between the header and the scrolled mini-bar so typing carries over. */
  value: string;
  onChange: (value: string) => void;
};

type Suggestions = { query: string; products: Product[]; total: number };

type Option =
  | { kind: "category"; key: string; href: string; label: string; context?: string; imageUrl?: string }
  | { kind: "product"; key: string; href: string; product: Product };

const DEBOUNCE_MS = 140;
const MAX_CATEGORY_HITS = 3;

/** Categories (and subcategories) whose name contains every word of the query. */
function matchCategories(categories: Category[], query: string): Option[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];
  const hits: Option[] = [];
  const matches = (name: string) => {
    const folded = foldGreek(name);
    return terms.every((term) => folded.includes(term));
  };
  for (const c of categories) {
    if (matches(c.name)) hits.push({ kind: "category", key: c.id, href: routes.category(c.id), label: c.name, imageUrl: c.imageUrl });
    for (const s of c.subcategories) {
      if (matches(s.name)) {
        hits.push({ kind: "category", key: s.id, href: routes.category(c.id, s.id), label: s.name, context: c.name, imageUrl: c.imageUrl });
      }
    }
    if (hits.length >= MAX_CATEGORY_HITS) break;
  }
  return hits.slice(0, MAX_CATEGORY_HITS);
}

export default function SearchBox({ categories, value, onChange }: Props) {
  const t = useT();
  const s = t.store.search;
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);

  const query = value.trim();
  const placeholder = useTypingPlaceholder(s.phrases, !focused && !value);

  // Fetch product suggestions, debounced; stale responses are dropped.
  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`, { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { products: Product[]; total: number };
        setSuggestions({ query, products: data.products, total: data.total });
      } catch {
        // aborted or offline — keep whatever is showing
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close when the visitor taps or clicks anywhere else.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const fresh = suggestions && suggestions.query === query ? suggestions : null;
  const loading = Boolean(query) && !fresh;
  const options = useMemo<Option[]>(() => {
    const cats = matchCategories(categories, query);
    const products: Option[] = (fresh?.products ?? []).map((p) => ({
      kind: "product",
      key: p.id,
      href: routes.product(p.id),
      product: p,
    }));
    return [...cats, ...products];
  }, [categories, query, fresh]);

  const showPanel = open && Boolean(query);

  function go(href: string) {
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    router.push(href);
  }

  function submit() {
    if (active >= 0 && options[active]) return go(options[active].href);
    go(query ? routes.search(query) : routes.home());
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && options.length > 0) {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      const n = options.length;
      setActive((i) => {
        // −1 is "back in the input"; cycle −1 → 0 … n−1 → −1.
        const current = i >= n ? -1 : i;
        const next = current + step;
        if (next >= n) return -1;
        if (next < -1) return n - 1;
        return next;
      });
    }
  }

  // Wrap active index into [-1, options.length - 1] (−1 = back in the input).
  const activeIndex = active >= options.length ? -1 : active;
  const activeId = activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined;
  const productStart = options.findIndex((o) => o.kind === "product");

  return (
    <div className="ks-search" ref={rootRef}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <SearchIcon className="ks-search-icon" />
        <input
          ref={inputRef}
          type="search"
          name="q"
          autoComplete="off"
          enterKeyHint="search"
          value={value}
          placeholder={placeholder}
          aria-label={s.label}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="ks-search-btn">
          {s.button}
        </button>
      </form>

      <div className="ks-suggest" id={listId} role="listbox" aria-label={s.label} hidden={!showPanel}>
        {options.map((o, i) => {
          const heading =
            o.kind === "category" && i === 0 ? s.categories : o.kind === "product" && i === productStart && productStart > 0 ? s.products : null;
          return (
            <div key={`${o.kind}-${o.key}`}>
              {heading && <p className="ks-suggest-head">{heading}</p>}
              <a
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                href={o.href}
                onPointerEnter={() => setActive(i)}
                onClick={(e) => {
                  e.preventDefault();
                  go(o.href);
                }}
              >
                <span className="ks-suggest-pic">
                  {(o.kind === "product" ? o.product.imageUrl : o.imageUrl) ? (
                    <Image
                      src={(o.kind === "product" ? o.product.imageUrl : o.imageUrl) as string}
                      alt=""
                      width={44}
                      height={44}
                      sizes="44px"
                    />
                  ) : null}
                </span>
                {o.kind === "product" ? (
                  <>
                    <span className="ks-suggest-text">
                      <strong>{o.product.name}</strong>
                      {o.product.size && <small>{o.product.size}</small>}
                    </span>
                    <b>{formatPrice(o.product.price, o.product.priceUnit, t.units.kg)}</b>
                  </>
                ) : (
                  <span className="ks-suggest-text">
                    <strong>{o.label}</strong>
                    {o.context && <small>{o.context}</small>}
                  </span>
                )}
              </a>
            </div>
          );
        })}
        {loading && options.length === 0 && <p className="ks-suggest-msg">{s.searching}</p>}
        {!loading && options.length === 0 && <p className="ks-suggest-msg">{s.noResults}</p>}
        {fresh && fresh.total > 0 && (
          <a
            className="ks-suggest-all"
            href={routes.search(query)}
            onClick={(e) => {
              e.preventDefault();
              go(routes.search(query));
            }}
          >
            {s.allResults(fresh.total)}
          </a>
        )}
      </div>
    </div>
  );
}
