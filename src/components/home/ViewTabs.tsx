"use client";

import { useView, type ViewId } from "@/context/ViewContext";
import { useT } from "@/context/LanguageContext";

const TAB_IDS: ViewId[] = ["category", "leaflet", "list"];

export default function ViewTabs() {
  const { view, setView } = useView();
  const t = useT();

  const TABS = TAB_IDS.map((id) => ({ id, label: t.viewTabs[id] }));

  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-black/[.05] p-1 dark:bg-white/[.07]">
      {TABS.map((tab) => {
        const active = view === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            aria-pressed={active}
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors sm:px-4 ${
              active
                ? "shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
            style={active ? { backgroundColor: "var(--accent)", color: "var(--accent-fg)" } : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
