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
    <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:py-6">
        <DealsGrid deals={deals} source={source} categoryTree={categoryTree} />
      </div>
    </main>
  );
}
