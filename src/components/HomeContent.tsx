"use client";

import { useView } from "@/context/ViewContext";
import LeafletViewer from "@/components/LeafletViewer";
import DealsGrid from "@/components/DealsGrid";
import type { Deal } from "@/components/DealsGrid";
import type { CategoryNode } from "@/components/SearchBar";

type Props = {
  deals: Deal[];
  source: "demo" | "supabase";
  categoryTree: CategoryNode[];
};

export default function HomeContent({ deals, source, categoryTree }: Props) {
  const { view } = useView();

  if (view === "leaflet") {
    return <LeafletViewer deals={deals} />;
  }

  return (
    <main className="mx-auto flex w-full flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
      <DealsGrid deals={deals} source={source} categoryTree={categoryTree} />
    </main>
  );
}
