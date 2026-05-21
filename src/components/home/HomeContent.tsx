"use client";

import { useView } from "@/context/ViewContext";
import LeafletViewer from "@/components/home/LeafletViewer";
import DealsGrid from "@/components/DealsGrid";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { Deal } from "@/types/deals";
import type { CategoryNode } from "@/types/deals";

type Props = {
  deals: Deal[];
  source: "demo" | "supabase";
  categoryTree: CategoryNode[];
};

export default function HomeContent({ deals, source, categoryTree }: Props) {
  const { view } = useView();

  if (view === "leaflet") {
    return (
      <ErrorBoundary>
        <LeafletViewer deals={deals} />
      </ErrorBoundary>
    );
  }

  return (
    <main className="mx-auto flex w-full flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
      <DealsGrid deals={deals} source={source} categoryTree={categoryTree} />
    </main>
  );
}
