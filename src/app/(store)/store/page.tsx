import type { Metadata } from "next";

import StoreView from "@/components/store/views/StoreView";
import { getStoreInfo } from "@/lib/data/storefront";

export const metadata: Metadata = { title: "Το κατάστημα" };

export default async function StorePage() {
  return <StoreView store={await getStoreInfo()} />;
}
