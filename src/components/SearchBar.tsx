"use client";

import { useRef, useState, useEffect } from "react";

import type { SearchFilters, StatusFilter } from "@/types/search";

export type CategoryNode = {
  id: string;
  name: string;
  children: CategoryNode[];
};

type Props = {
  filters: SearchFilters;
  /** Hierarchical category tree for the grouped dropdown */
  categoryTree: CategoryNode[];
  onChange: (filters: SearchFilters) => void;
  /** Show Active / Inactive status toggle — admin only */
  showStatus?: boolean;
  placeholder?: string;
};

// --- Categories multi-select dropdown (grouped) ---
function CategoryDropdown({
  tree,
  selected,
  onToggle,
  onToggleRoot,
}: {
  tree: CategoryNode[];
  selected: string[];  // UUIDs
  onToggle: (id: string) => void;
  onToggleRoot: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Count total leaf selections for label
  const totalLeaves = tree.flatMap((r) => (r.children.length > 0 ? r.children : [r]));
  const selCount = selected.length;
  const label =
    selCount === 0
      ? "Categories"
      : selCount === 1
        ? (totalLeaves.find((n) => n.id === selected[0])?.name ?? "1 category")
        : `${selCount} categories`;

  const hasSelection = selCount > 0;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${
          hasSelection
            ? "border-transparent font-medium text-white"
            : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5"
        }`}
        style={hasSelection ? { backgroundColor: "var(--accent)", color: "var(--accent-fg)" } : undefined}
      >
        <span>{label}</span>
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
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[240px] rounded-xl border border-black/10 bg-white shadow-lg dark:border-white/15 dark:bg-zinc-900">
          {/* Scrollable list area */}
          <div className="max-h-80 overflow-y-auto py-1">
          {tree.length === 0 ? (
            <span className="block px-3 py-2 text-xs text-zinc-400">No categories</span>
          ) : (
            tree.map((root) => {
              const leaves = root.children.length > 0 ? root.children : [root];
              const leafIds = leaves.map((l) => l.id);
              const allSelected = leafIds.every((id) => selected.includes(id));
              const someSelected = leafIds.some((id) => selected.includes(id));

              return (
                <div key={root.id}>
                  {/* Root row — clicking toggles all its leaves */}
                  <button
                    type="button"
                    onClick={() => onToggleRoot(leafIds)}
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-white/5"
                  >
                    <span
                      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors"
                      style={
                        allSelected
                          ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)" }
                          : someSelected
                            ? { backgroundColor: "var(--accent)/40", borderColor: "var(--accent)" }
                            : { borderColor: "rgba(0,0,0,0.2)", backgroundColor: "transparent" }
                      }
                    >
                      {(allSelected || someSelected) && (
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points={allSelected ? "2 6 5 9 10 3" : "2 6 10 6"} />
                        </svg>
                      )}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {root.name}
                    </span>
                  </button>

                  {/* Subcategory rows */}
                  {root.children.map((sub) => {
                    const checked = selected.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className="flex cursor-pointer items-center gap-2.5 pl-7 pr-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/5"
                      >
                        <span
                          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors"
                          style={checked
                            ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)" }
                            : { borderColor: "rgba(0,0,0,0.2)", backgroundColor: "transparent" }
                          }
                        >
                          {checked && (
                            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </span>
                        <input type="checkbox" checked={checked} onChange={() => onToggle(sub.id)} className="sr-only" />
                        {sub.name}
                      </label>
                    );
                  })}
                </div>
              );
            })
          )}
          </div>
          {/* Pinned footer — always visible, outside scroll area */}
          {hasSelection && (
            <div className="border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => onToggleRoot([])}
                className="w-full px-3 py-1.5 text-left text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// --- Status toggle (admin only) ---
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function StatusToggle({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  return (
    <div className="flex h-9 items-center gap-0 rounded-xl border border-black/10 bg-white overflow-hidden dark:border-white/15 dark:bg-zinc-900">
      {STATUS_OPTIONS.map((opt, i) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`h-full px-3 text-sm transition-colors ${
              i > 0 ? "border-l border-black/10 dark:border-white/15" : ""
            } ${
              active
                ? "font-medium text-white"
                : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/5"
            }`}
            style={active ? { backgroundColor: "var(--accent)", color: "var(--accent-fg)" } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Main SearchBar ---
export default function SearchBar({
  filters,
  categoryTree,
  onChange,
  showStatus = false,
  placeholder = "Search products…",
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search input */}
      <div className="relative min-w-[200px] flex-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder={placeholder}
          className="h-9 w-full rounded-xl border border-black/10 bg-white pl-8 pr-8 text-sm text-black outline-none placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
        {filters.query && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, query: "" })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors hover:opacity-70"
            style={{ color: "var(--accent)" }}
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Categories multiselect */}
      <CategoryDropdown
        tree={categoryTree}
        selected={filters.categories}
        onToggle={(id) =>
          onChange({
            ...filters,
            categories: filters.categories.includes(id)
              ? filters.categories.filter((c) => c !== id)
              : [...filters.categories, id],
          })
        }
        onToggleRoot={(ids) => {
          if (ids.length === 0) {
            // clear all
            onChange({ ...filters, categories: [] });
            return;
          }
          const allSelected = ids.every((id) => filters.categories.includes(id));
          if (allSelected) {
            onChange({ ...filters, categories: filters.categories.filter((c) => !ids.includes(c)) });
          } else {
            const merged = Array.from(new Set([...filters.categories, ...ids]));
            onChange({ ...filters, categories: merged });
          }
        }}
      />

      {/* On sale toggle */}
      <button
        type="button"
        onClick={() => onChange({ ...filters, hasPromoOnly: !filters.hasPromoOnly })}
        className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${
          filters.hasPromoOnly
            ? "border-transparent font-medium text-white"
            : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5"
        }`}
        style={filters.hasPromoOnly ? { backgroundColor: "var(--accent)", color: "var(--accent-fg)" } : undefined}
      >
        On sale
      </button>

      {/* Price range */}
      <div className="flex h-9 items-center gap-1 rounded-xl border border-black/10 bg-white px-2 dark:border-white/15 dark:bg-zinc-900">
        <span className="text-xs text-zinc-400">€</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={filters.minPrice}
          onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
          placeholder="Min"
          className="h-full w-14 bg-transparent text-sm text-black outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
        <span className="text-xs text-zinc-300 dark:text-zinc-600">–</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
          placeholder="Max"
          className="h-full w-14 bg-transparent text-sm text-black outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Status toggle — admin only */}
      {showStatus && (
        <StatusToggle
          value={filters.status}
          onChange={(s) => onChange({ ...filters, status: s })}
        />
      )}

      {/* Clear all */}
      {(filters.query !== "" ||
        filters.categories.length > 0 ||
        filters.hasPromoOnly ||
        filters.minPrice !== "" ||
        filters.maxPrice !== "" ||
        filters.status !== "all") && (
        <button
          type="button"
          onClick={() =>
            onChange({
              query: "",
              categories: [],
              hasPromoOnly: false,
              minPrice: "",
              maxPrice: "",
              status: "all",
            })
          }
          className="flex h-9 items-center rounded-xl px-2 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          Clear
        </button>
      )}
    </div>
  );
}
