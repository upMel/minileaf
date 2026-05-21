"use client";

import { useView, type ViewId } from "@/context/ViewContext";

const TABS: { id: ViewId; label: string }[] = [
  { id: "leaflet", label: "Leaflet" },
  { id: "list", label: "List" },
  { id: "category", label: "Category" },
];

export default function ViewTabs() {
  const { view, setView } = useView();

  return (
    <div className="flex items-center gap-1 rounded-full border border-black/10 bg-black/[.04] p-1 dark:border-white/10 dark:bg-white/[.06]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setView(tab.id)}
          className={
            view === tab.id
              ? "rounded-full px-4 py-1 text-sm font-medium text-white transition-colors"
              : "rounded-full px-4 py-1 text-sm font-medium text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          }
          style={view === tab.id ? { backgroundColor: "var(--accent)" } : undefined}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
