"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";

import { useT } from "@/context/LanguageContext";
import { navSection, routes, type NavSection } from "@/lib/routes";
import type { Category, StoreInfo } from "@/types/catalog";

import { ChevronDownIcon } from "./icons";
import MegaMenu from "./MegaMenu";
import MobileDrawer from "./MobileDrawer";
import SearchBox from "./SearchBox";
import StoreLanguageToggle from "./StoreLanguageToggle";

type Props = { categories: Category[]; store: StoreInfo };

const NAV: { section: Exclude<NavSection, null>; href: string; key: "home" | "deals" | "flyers" | "store" }[] = [
  { section: "home", href: routes.home(), key: "home" },
  { section: "deals", href: routes.deals(), key: "deals" },
  { section: "flyer", href: routes.flyer(), key: "flyers" },
  { section: "store", href: routes.store(), key: "store" },
];

/**
 * Storefront header.
 *  • Computer: logo + search, then the menu band. Once the header scrolls out
 *    of view a thin bar (small logo, search, menu) slides in from the top.
 *  • Phone: one sticky row — small logo, ☰ (opens the drawer), search.
 * «Κατηγορίες ▾» opens the mega menu on every page except Home, where the
 * categories are already on the page.
 */
export default function StoreHeader({ categories, store }: Props) {
  const t = useT();
  const pathname = usePathname();
  const section = navSection(pathname);
  const isHome = pathname === routes.home();

  const headerRef = useRef<HTMLElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const [megaAnchor, setMegaAnchor] = useState<HTMLElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [miniVisible, setMiniVisible] = useState(false);
  const [stuck, setStuck] = useState(false);

  const closeMega = useCallback(() => setMegaAnchor(null), []);
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuBtnRef.current?.focus({ preventScroll: true });
  }, []);

  // Computer: show the mini-bar once the full header is out of view.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setMiniVisible(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Phone: shadow under the sticky row once the page has scrolled.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleMega(e: MouseEvent<HTMLButtonElement>) {
    const btn = e.currentTarget;
    setMegaAnchor((cur) => (cur === btn ? null : btn));
  }

  const categoriesButton = (inMini: boolean) =>
    isHome ? null : (
      <button
        type="button"
        className="ks-nav-cats"
        aria-expanded={Boolean(megaAnchor) && Boolean(megaAnchor?.closest(".ks-mini")) === inMini}
        aria-controls="ks-mega"
        onClick={toggleMega}
      >
        {t.store.nav.categories} <ChevronDownIcon />
      </button>
    );

  const navLinks = NAV.map((item) => (
    <Link key={item.key} href={item.href} aria-current={section === item.section ? "page" : undefined} onClick={closeMega}>
      {t.store.nav[item.key]}
    </Link>
  ));

  return (
    <>
      <header ref={headerRef} className={`ks-top${stuck ? " stuck" : ""}`}>
        <Link className="ks-logo" href={routes.home()} aria-label={t.store.homeLinkLabel}>
          <Image className="ks-logo-big" src="/kaimakidis/logo.webp" alt={t.store.logoAlt} width={1002} height={230} priority />
          <Image className="ks-logo-small" src="/kaimakidis/logo-small.webp" alt={t.store.logoSmallAlt} width={472} height={230} priority />
        </Link>
        <button
          ref={menuBtnRef}
          type="button"
          className="ks-menu-btn"
          aria-label={t.store.nav.openMenu}
          aria-expanded={drawerOpen}
          aria-controls="ks-drawer"
          onClick={() => setDrawerOpen(true)}
        >
          <span className="ks-mb-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>
        {/* The search moves into the mini-bar while it shows; the slot keeps its size. */}
        <div className="ks-search-slot">
          {!miniVisible && <SearchBox categories={categories} value={query} onChange={setQuery} />}
        </div>
        <nav className="ks-nav" aria-label={t.store.nav.main}>
          {categoriesButton(false)}
          {navLinks}
          <StoreLanguageToggle className="ks-nav-lang" />
        </nav>
      </header>

      <div className={`ks-mini${miniVisible ? " show" : ""}`} aria-hidden={!miniVisible} inert={!miniVisible}>
        <div className="ks-mini-in">
          <Link className="ks-mini-logo" href={routes.home()} aria-label={t.store.homeLinkLabel}>
            <Image src="/kaimakidis/logo-small.webp" alt="" width={472} height={230} />
          </Link>
          <div className="ks-mini-search">
            {miniVisible && <SearchBox categories={categories} value={query} onChange={setQuery} />}
          </div>
          <nav className="ks-mini-nav" aria-label={t.store.nav.main}>
            {categoriesButton(true)}
            {navLinks}
          </nav>
        </div>
      </div>

      <MegaMenu categories={categories} anchor={megaAnchor} onClose={closeMega} />
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} categories={categories} store={store} />
    </>
  );
}
