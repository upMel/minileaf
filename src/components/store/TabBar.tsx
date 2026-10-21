"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useT } from "@/context/LanguageContext";
import { navSection, routes, telHref } from "@/lib/routes";

import { BookIcon, HomeIcon, PhoneIcon, TagIcon } from "./icons";

/** Phone only: Home · Offers · Flyer · Call, fixed to the bottom of the screen. */
export default function TabBar({ phone }: { phone: string }) {
  const t = useT().store;
  const section = navSection(usePathname());
  return (
    <nav className="ks-tabbar" aria-label={t.nav.quick}>
      <Link href={routes.home()} aria-current={section === "home" ? "page" : undefined}>
        <HomeIcon />
        <span>{t.tabs.home}</span>
      </Link>
      <Link href={routes.deals()} aria-current={section === "deals" ? "page" : undefined}>
        <TagIcon />
        <span>{t.tabs.deals}</span>
      </Link>
      <Link href={routes.flyer()} aria-current={section === "flyer" ? "page" : undefined}>
        <BookIcon />
        <span>{t.tabs.flyer}</span>
      </Link>
      <a className="ks-tab-call" href={telHref(phone)}>
        <PhoneIcon />
        <span>{t.tabs.call}</span>
      </a>
    </nav>
  );
}
