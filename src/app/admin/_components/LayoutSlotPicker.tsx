"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import {
  LAYOUT_TEMPLATES,
  slotSpanClasses,
  type LayoutTemplate,
  type TemplateSlot,
  type SlotRole,
} from "@/lib/layout-templates";
import type { ProductRow } from "@/types/admin";

// ── Role colours ──────────────────────────────────────────────────────────────
export const ROLE_COLORS: Record<SlotRole, { thumb: string; label: string }> = {
  hero:     { thumb: "bg-[var(--accent)]",                                    label: "Hero"     },
  featured: { thumb: "bg-[color-mix(in_srgb,var(--accent)_40%,transparent)]", label: "Featured" },
  small:    { thumb: "bg-zinc-200 dark:bg-zinc-700",                          label: "Small"    },
};

// ── Template thumbnail ────────────────────────────────────────────────────────
export function TemplateThumbnail({ template }: { template: LayoutTemplate }) {
  return (
    <div
      className="grid gap-[3px] w-full aspect-[4/3]"
      style={{ gridTemplateColumns: `repeat(${template.cols}, 1fr)` }}
    >
      {template.slots.map((slot) => (
        <div
          key={slot.id}
          className={`rounded-sm ${slotSpanClasses(slot.size)} ${ROLE_COLORS[slot.role].thumb}`}
        />
      ))}
    </div>
  );
}

// ── Product thumbnail ─────────────────────────────────────────────────────────
export function ProductThumb({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={24}
        height={24}
        className="size-6 shrink-0 rounded object-cover"
        unoptimized
      />
    );
  }
  return (
    <span className="size-6 shrink-0 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
      <svg className="size-3 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    </span>
  );
}

// ── Searchable product combobox ───────────────────────────────────────────────
export function ProductCombobox({
  value,
  onChange,
  products,
  takenIds,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  products: ProductRow[];
  takenIds: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = value ? (products.find((p) => p.id === value) ?? null) : null;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  function toggle() {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOpenUpward(window.innerHeight - rect.bottom < 280);
    }
    setOpen((o) => !o);
  }

  const available = products.filter((p) => !takenIds.has(p.id) || p.id === value);
  const filtered = query.trim()
    ? available.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : available;

  function select(productId: string | null) {
    onChange(productId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 rounded-lg border border-black/10 bg-zinc-50 px-3 py-1.5 text-left text-sm hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)] dark:border-white/10 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      >
        {selectedProduct ? (
          <>
            <ProductThumb imageUrl={selectedProduct.image_url} name={selectedProduct.name} />
            <span className="flex-1 truncate text-zinc-800 dark:text-zinc-200">{selectedProduct.name}</span>
          </>
        ) : (
          <span className="flex-1 truncate text-zinc-400 dark:text-zinc-500">&mdash; auto-fill &mdash;</span>
        )}
        <svg
          className={`size-4 shrink-0 text-zinc-400 transition-transform ${open ? (openUpward ? "" : "rotate-180") : (openUpward ? "rotate-180" : "")}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className={`absolute left-0 right-0 z-50 flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900 ${openUpward ? "bottom-full mb-1" : "top-full mt-1"}`}>
          <div className="border-b border-black/8 p-2 dark:border-white/8">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-2.5 py-1.5 dark:bg-zinc-800">
              <svg className="size-3.5 shrink-0 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none dark:text-zinc-200"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => select(null)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 ${value === null ? "font-medium text-[var(--accent)]" : "text-zinc-500 dark:text-zinc-400"}`}
              >
                <span className="size-6 shrink-0" />
                &mdash; auto-fill &mdash;
                {value === null && (
                  <svg className="ml-auto size-4 shrink-0 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            </li>
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-zinc-400">No results for &ldquo;{query}&rdquo;</li>
            )}
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => select(p.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 ${p.id === value ? "font-medium text-[var(--accent)]" : "text-zinc-800 dark:text-zinc-200"}`}
                >
                  <ProductThumb imageUrl={p.image_url} name={p.name} />
                  <span className="flex-1 truncate text-left">{p.name}</span>
                  {p.id === value && (
                    <svg className="ml-auto size-4 shrink-0 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Slot card ─────────────────────────────────────────────────────────────────
export function SlotCard({
  slot,
  assignedProductId,
  products,
  takenIds,
  onChange,
}: {
  slot: TemplateSlot;
  assignedProductId: string | null;
  products: ProductRow[];
  takenIds: Set<string>;
  onChange: (slotId: string, productId: string | null) => void;
}) {
  const { thumb, label } = ROLE_COLORS[slot.role];
  return (
    <div className={`${slotSpanClasses(slot.size)} flex flex-col gap-2 rounded-xl border border-black/8 bg-white p-3 dark:border-white/10 dark:bg-zinc-900`}>
      <div className="flex items-center gap-1.5">
        <span className={`size-2 shrink-0 rounded-full ${thumb}`} />
        <span className="truncate text-[11px] font-semibold capitalize text-zinc-500 dark:text-zinc-400">
          {slot.id.replace(/-/g, " ")}
        </span>
        <span className="ml-auto shrink-0 text-[10px] text-zinc-300 dark:text-zinc-600">{label}</span>
      </div>
      <ProductCombobox
        value={assignedProductId}
        onChange={(pid) => onChange(slot.id, pid)}
        products={products}
        takenIds={takenIds}
      />
    </div>
  );
}

// ── Template picker row ───────────────────────────────────────────────────────
export function TemplatePicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (t: LayoutTemplate) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {LAYOUT_TEMPLATES.map((template) => {
        const isSelected = selectedId === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`group flex flex-col gap-2 rounded-2xl border-2 p-3 text-left transition-all ${
              isSelected
                ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
                : "border-black/10 bg-white hover:border-[var(--accent)]/40 dark:border-white/10 dark:bg-zinc-900"
            }`}
          >
            <TemplateThumbnail template={template} />
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{template.name}</span>
              {isSelected && (
                <svg className="size-4 shrink-0 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </div>
            <p className="text-[10px] leading-snug text-zinc-400">{template.description}</p>
          </button>
        );
      })}
    </div>
  );
}
