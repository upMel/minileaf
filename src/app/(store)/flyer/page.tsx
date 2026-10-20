import type { Metadata } from "next";

import FlyerView from "@/components/store/views/FlyerView";
import { getActiveFlyer } from "@/lib/data/storefront";

export const metadata: Metadata = { title: "Φυλλάδιο προσφορών" };

/** The active flyer: builder pages and/or Canva pages, as a book you leaf through. */
export default async function FlyerPage() {
  return <FlyerView flyer={await getActiveFlyer()} />;
}
