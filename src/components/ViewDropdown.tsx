"use client";

import { useState, useRef, useEffect } from "react";

const VIEWS = [
  { id: "leaflet", label: "Leaflet view" },
  // Future views can be added here, e.g.:
  { id: "list",    label: "List view" },
  { id: "category", label: "Category view" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export default function ViewDropdown() {
  const [current, setCurrent] = useState<ViewId>("leaflet");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel = VIEWS.find((v) => v.id === current)?.label ?? "Leaflet view";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
      >
        <span>{currentLabel}</span>
        {/* Chevron */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[140px] rounded-xl border border-black/10 bg-white py-1 shadow-lg dark:border-white/15 dark:bg-zinc-900">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => { setCurrent(v.id); setOpen(false); }}
              className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                current === v.id
                  ? "font-medium text-black dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/5"
              }`}
            >
              {v.label}
              {current === v.id && (
                <span className="ml-2 text-xs" style={{ color: "var(--accent)" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
