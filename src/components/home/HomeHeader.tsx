"use client";

import Image from "next/image";

import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import ViewTabs from "@/components/home/ViewTabs";
import { useT } from "@/context/LanguageContext";

/**
 * Storefront header. Split out of the (server) page so it can read the
 * client-side language context.
 *
 * Deliberately has no link to /admin — the shop owner navigates there directly.
 */
export default function HomeHeader() {
  const t = useT();

  return (
    <header className="shrink-0 border-b border-black/[.07] bg-white/95 backdrop-blur-sm dark:border-white/[.08] dark:bg-zinc-950/95">
      {/* Mobile: logo + controls row */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 sm:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <Image src="/miniLeaf.png" alt="MiniLeaf" width={34} height={34} className="shrink-0 rounded-full" priority />
          <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
            {t.home.todaysDeals}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageToggle />
          <ThemeToggle showPalette={false} />
        </div>
      </div>
      {/* Mobile: tabs row */}
      <div className="flex justify-center px-4 pb-2 sm:hidden">
        <ViewTabs />
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden w-full grid-cols-3 items-center px-5 py-3 sm:grid">
        <div className="flex min-w-0 items-center gap-3">
          <Image src="/miniLeaf.png" alt="MiniLeaf" width={38} height={38} className="shrink-0 rounded-full" priority />
          <h1 className="truncate text-base font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
            {t.home.todaysDeals}
          </h1>
        </div>
        <div className="flex justify-center">
          <ViewTabs />
        </div>
        <div className="flex items-center justify-end gap-2.5">
          <LanguageToggle />
          <ThemeToggle showPalette={false} />
        </div>
      </div>
    </header>
  );
}
