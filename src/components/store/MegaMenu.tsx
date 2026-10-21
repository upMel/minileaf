"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useT } from "@/context/LanguageContext";
import { routes } from "@/lib/routes";
import type { Category } from "@/types/catalog";

type Props = {
  categories: Category[];
  /** The «Κατηγορίες ▾» button that opened the menu; null = closed. */
  anchor: HTMLElement | null;
  onClose: () => void;
};

/** Computer only: every category in columns, opened from «Κατηγορίες ▾» on any page. */
export default function MegaMenu({ categories, anchor, onClose }: Props) {
  const t = useT();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  // Position under the button, spanning the page's content width.
  useLayoutEffect(() => {
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const wrap = anchor.closest(".ks")?.querySelector<HTMLElement>(".ks-wrap") ?? document.body;
    const w = wrap.getBoundingClientRect();
    const pad = 16;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measuring layout must happen before paint
    setBox({ top: Math.round(r.bottom + 8), left: Math.round(w.left + pad), width: Math.round(w.width - pad * 2) });
  }, [anchor]);

  // Close on outside click, Escape, resize, or when the opening button scrolls away.
  useEffect(() => {
    if (!anchor) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchor.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        anchor.focus();
      }
    };
    const onScroll = () => {
      if (!anchor.closest(".ks-mini") && anchor.getBoundingClientRect().bottom < 0) onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onClose);
    };
  }, [anchor, onClose]);

  if (!anchor || !box) return null;
  const currentId = pathname.startsWith("/category/") ? pathname.split("/")[2] : null;

  return (
    <div
      ref={panelRef}
      id="ks-mega"
      className="ks-mega"
      role="dialog"
      aria-label={t.store.categoryMenu.title}
      style={{ top: box.top, left: box.left, width: box.width }}
    >
      <div className="ks-mega-grid">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={routes.category(c.id)}
            className="ks-mega-item"
            aria-current={c.id === currentId ? "page" : undefined}
            onClick={onClose}
          >
            {c.imageUrl ? <Image src={c.imageUrl} alt="" width={44} height={44} sizes="44px" /> : <span className="ks-img-blank" />}
            <span>{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
