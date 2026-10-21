import type { ReactNode } from "react";

import StoreFooter from "@/components/store/StoreFooter";
import StoreHeader from "@/components/store/StoreHeader";
import TabBar from "@/components/store/TabBar";
import { getCategories, getStoreInfo, isDemoMode } from "@/lib/data/storefront";

import "./store.css";

// Prices, offers and opening hours come from the database on every request.
export const dynamic = "force-dynamic";

/** Shell shared by every storefront page: header, footer, phone tab bar. */
export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [categories, store] = await Promise.all([getCategories(), getStoreInfo()]);

  return (
    <div className="ks">
      <div className="ks-wrap">
        <StoreHeader categories={categories} store={store} />
        <main id="main" className="ks-main">
          {children}
        </main>
        <StoreFooter store={store} demo={isDemoMode()} />
      </div>
      <TabBar phone={store.phone} />
    </div>
  );
}
