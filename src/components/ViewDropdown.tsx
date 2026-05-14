"use client";

import { useState, useRef, useEffect } from "react";
import { useView } from "@/context/ViewContext";
import type { ViewId } from "@/context/ViewContext";

const VIEWS: { id: ViewId; label: string; icon: React.ReactNode }[] = [
  {
    id: "leaflet",
    label: "Leaflet",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "list",
    label: "List",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <line x1="9" y1="6" x2="20" y2="6" />
        <line x1="9" y1="12" x2="20" y2="12" />
        <line x1="9" y1="18" x2="20" y2="18" />
        <circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "category",
    label: "Category",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h7M3 12h7M3 19h7" />
        <path d="M14 5h7M14 12h7M14 19h7" />
      </svg>
    ),
  },
];

export default function ViewDropdown() {
  const { view: current, setView } = useView();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentView = VIEWS.find((v) => v.id === current) ?? VIEWS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all"
        style={{
          borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--accent) 9%, transparent)",
          color: "var(--accent)",
        }}
      >
        {currentView.icon}
        <span>{currentView.label}</span>
        <svg
          width="9" height="9" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[148px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900">
          {VIEWS.map((v) => {
            const active = v.id === current;
            return (
              <button
                key={v.id}
                onClick={() => { setView(v.id); setOpen(false); }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors"
                style={active ? {
                  backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                  color: "var(--accent)",
                  fontWeight: 600,
                } : undefined}
              >
                <span className={active ? "" : "text-zinc-400 dark:text-zinc-500"}>{v.icon}</span>
                <span className={active ? "" : "text-zinc-700 dark:text-zinc-300"}>{v.label}</span>
                {active && (
                  <svg className="ml-auto" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
