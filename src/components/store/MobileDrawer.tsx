"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useT } from "@/context/LanguageContext";
import { routes, telHref } from "@/lib/routes";
import type { Category, StoreInfo } from "@/types/catalog";

import { PhoneIcon } from "./icons";
import OpenStatus from "./OpenStatus";
import StoreLanguageToggle from "./StoreLanguageToggle";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  store: StoreInfo;
};

/** Phone only: the ☰ menu — every category, the store page, phone and hours. */
export default function MobileDrawer({ open, onClose, categories, store }: Props) {
  const t = useT();
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("ks-lock");
    const focusTimer = setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.classList.remove("ks-lock");
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const currentId = pathname.startsWith("/category/") ? pathname.split("/")[2] : null;

  return (
    <>
      <div className={`ks-drawer-bg${open ? " open" : ""}`} aria-hidden="true" onClick={onClose} />
      <nav
        id="ks-drawer"
        className={`ks-drawer${open ? " open" : ""}`}
        aria-label={t.store.nav.openMenu}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="ks-dr-head">
          <b>{t.store.drawer.title}</b>
          <button ref={closeRef} type="button" className="ks-dr-x" aria-label={t.store.drawer.close} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="ks-dr-cats">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={routes.category(c.id)}
              className="ks-dr-cat"
              aria-current={c.id === currentId ? "page" : undefined}
              onClick={onClose}
            >
              {c.imageUrl ? <Image src={c.imageUrl} alt="" width={40} height={40} sizes="40px" /> : <span className="ks-img-blank" />}
              <span>{c.name}</span>
              <i aria-hidden="true">›</i>
            </Link>
          ))}
        </div>
        <div className="ks-dr-foot">
          <Link
            href={routes.store()}
            className="ks-dr-store"
            aria-current={pathname === routes.store() ? "page" : undefined}
            onClick={onClose}
          >
            {t.store.drawer.storeAndHours} ›
          </Link>
          <a href={telHref(store.phone)} className="ks-dr-tel">
            <PhoneIcon />
            {store.phone}
          </a>
          <OpenStatus hours={store.hours} />
          <StoreLanguageToggle />
        </div>
      </nav>
    </>
  );
}
