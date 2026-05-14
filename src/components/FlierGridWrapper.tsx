"use client";

// FlierGridWrapper: renders FlierGrid only in "leaflet" view on md+ screens.
// On mobile (< md) the standard DealsGrid always handles rendering.

import { useView } from "@/context/ViewContext";
import FlierGrid from "@/components/FlierGrid";
import type { Deal } from "@/components/DealsGrid";

export default function FlierGridWrapper({ deals }: { deals: Deal[] }) {
  const { view } = useView();

  if (view !== "leaflet") return null;

  return (
    // hidden on mobile, visible on md+
    <div className="hidden md:block">
      <FlierGrid deals={deals} />
    </div>
  );
}
