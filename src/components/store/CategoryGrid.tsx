"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

import { useT } from "@/context/LanguageContext";
import { routes } from "@/lib/routes";
import { softHyphenate } from "@/lib/text";
import type { Category } from "@/types/catalog";

import { ChevronDownIcon } from "./icons";

const CLOSE_DELAY_MS = 140;

/**
 * Home-page category tiles.
 *  • Computer with a mouse: hovering a tile opens its subcategories below it;
 *    clicking the tile goes straight to the category.
 *  • Touch / keyboard: a tap (or Enter) opens the subcategories instead.
 *  • Phone: tiles sit in two rows that scroll sideways; the subcategories
 *    open in a panel under the rows.
 */
export default function CategoryGrid({ categories }: { categories: Category[] }) {
  const t = useT().store.categoryMenu;
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef<string>("mouse");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [openId, setOpenId] = useState<string | null>(null);

  const open = categories.find((c) => c.id === openId) ?? null;

  // Close on outside click / Escape.
  useEffect(() => {
    if (!openId) return;
    const onPointerDown = (e: globalThis.PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenId(null);
      rootRef.current?.querySelector<HTMLElement>(`[data-cat="${openId}"]`)?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  // Bring the opened list (computer) or panel (phone) into view if it's below the fold.
  useEffect(() => {
    if (!openId) return;
    const phone = window.matchMedia("(max-width: 760px)").matches;
    const el = phone ? panelRef.current : rootRef.current?.querySelector<HTMLElement>(`#ks-sub-${openId}`);
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight - 16) {
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "nearest", behavior: smooth ? "smooth" : "auto" });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [openId]);

  function isMouse() {
    return lastPointer.current === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function onTileClick(e: MouseEvent<HTMLButtonElement>, c: Category) {
    // A real mouse click goes to the category; touch and keyboard toggle the list.
    if (isMouse() && e.detail > 0 && !window.matchMedia("(max-width: 760px)").matches) {
      setOpenId(null);
      router.push(routes.category(c.id));
      return;
    }
    setOpenId((cur) => (cur === c.id ? null : c.id));
  }

  function onEnter(e: PointerEvent, c: Category) {
    if (e.pointerType !== "mouse" || window.matchMedia("(max-width: 760px)").matches) return;
    clearTimeout(closeTimer.current);
    if (c.subcategories.length > 0) setOpenId(c.id);
  }

  function onLeave(e: PointerEvent, c: Category) {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId((cur) => (cur === c.id ? null : cur)), CLOSE_DELAY_MS);
  }

  const subLinks = (c: Category) => (
    <>
      <Link className="ks-sub-all" href={routes.category(c.id)} onClick={() => setOpenId(null)}>
        {t.allProducts}
      </Link>
      {c.subcategories.map((s) => (
        <Link key={s.id} href={routes.category(c.id, s.id)} onClick={() => setOpenId(null)}>
          {s.name}
        </Link>
      ))}
    </>
  );

  return (
    <>
      <div className="ks-cats" ref={rootRef} onPointerDown={(e) => (lastPointer.current = e.pointerType)}>
        {categories.map((c) => {
          const isOpen = c.id === openId;
          return (
            <div
              key={c.id}
              className={`ks-cat-group${isOpen ? " open" : ""}`}
              onPointerEnter={(e) => onEnter(e, c)}
              onPointerLeave={(e) => onLeave(e, c)}
            >
              <button
                type="button"
                className="ks-cat"
                data-cat={c.id}
                aria-expanded={isOpen}
                aria-controls={`ks-sub-${c.id}`}
                onClick={(e) => onTileClick(e, c)}
              >
                {/* Inner block so the name wraps around the floated picture on phones. */}
                <span className="ks-cat-inner">
                  <span className="ks-cat-pic">
                    {c.imageUrl && <Image src={c.imageUrl} alt="" width={160} height={160} sizes="(max-width: 760px) 50px, 80px" />}
                  </span>
                  <span className="ks-cat-name">
                    {softHyphenate(c.name)} <ChevronDownIcon className="ks-chev" />
                  </span>
                </span>
              </button>
              <nav id={`ks-sub-${c.id}`} className="ks-submenu" aria-label={t.subcategoriesOf(c.name)} hidden={!isOpen}>
                {subLinks(c)}
              </nav>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="ks-cat-panel" ref={panelRef}>
          <div className="ks-cat-panel-head">
            <b>{open.name}</b>
            <button type="button" className="ks-cat-panel-x" aria-label={t.close} onClick={() => setOpenId(null)}>
              ✕
            </button>
          </div>
          <nav className="ks-cat-panel-list" aria-label={t.subcategoriesOf(open.name)}>
            {subLinks(open)}
          </nav>
        </div>
      )}
    </>
  );
}
