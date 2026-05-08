"use client";

import { useState } from "react";

import DateRangePickerInput from "@/components/inputs/DateRangePickerInput";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Field from "@/components/ui/Field";
import MoneyInput from "@/components/inputs/MoneyInput";
import PercentInput from "@/components/inputs/PercentInput";
import SelectInput from "@/components/inputs/SelectInput";
import TextInput from "@/components/inputs/TextInput";

import type { CompetitorLookupResult } from "@/app/api/competitor-prices/route";
import type { CategoryRow, ProductFormState, PromotionMode } from "@/types/admin";

type Props = {
  form: ProductFormState;
  onChange: (update: Partial<ProductFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNew: () => void;
  isSaving: boolean;
  saveError: string | null;
  categories: CategoryRow[];
};

export default function ProductFormCard({
  form,
  onChange,
  onSubmit,
  onNew,
  isSaving,
  saveError,
  categories,
}: Props) {
  const set = onChange;

  const roots = categories.filter((c) => c.parent_id === null);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const [lookupResult, setLookupResult] = useState<CompetitorLookupResult | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  async function handleLookup() {
    const b = form.barcode.trim();
    if (!b) return;
    setIsLooking(true);
    setLookupResult(null);
    setLookupError(null);
    try {
      const res = await fetch(`/api/competitor-prices?barcode=${encodeURIComponent(b)}`);
      const data: CompetitorLookupResult = await res.json();
      setLookupResult(data);
      if (data.prices.length === 0) setLookupError("No competitor prices found for this barcode.");
    } catch {
      setLookupError("Lookup failed. Try again.");
    } finally {
      setIsLooking(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-black dark:text-zinc-50">Products</h2>
        <Button type="button" onClick={onNew}>
          New
        </Button>
      </div>

      <form onSubmit={onSubmit} className="mt-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Barcode">
              <TextInput
                value={form.barcode}
                onChange={(v) => set({ barcode: v })}
                placeholder="Optional"
              />
            </Field>
            <Field label="Category">
              <SelectInput
                value={form.category}
                onChange={(v) => set({ category: v })}
              >
                <option value="">— select —</option>
                {roots.map((root) => {
                  const subs = childrenOf(root.id);
                  return subs.length > 0 ? (
                    <optgroup key={root.id} label={root.name}>
                      <option value={root.name}>{root.name} (all)</option>
                      {subs.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    <option key={root.id} value={root.name}>
                      {root.name}
                    </option>
                  );
                })}
              </SelectInput>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name">
              <TextInput value={form.name} onChange={(v) => set({ name: v })} required />
            </Field>
            <Field label="Supplier">
              <TextInput value={form.supplier} onChange={(v) => set({ supplier: v })} placeholder="Optional" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Price">
              <MoneyInput value={form.price} onChange={(v) => set({ price: v })} required />
            </Field>
            <div />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Competitor name">
              <TextInput
                value={form.competitorName}
                onChange={(v) => set({ competitorName: v })}
                placeholder="Optional"
              />
            </Field>
            <Field label="Competitor price">
              <MoneyInput
                value={form.competitorPrice}
                onChange={(v) => set({ competitorPrice: v })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Image URL">
              <div className="flex items-center gap-2">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg border border-black/10 bg-zinc-100 object-contain dark:border-white/10 dark:bg-zinc-800"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-zinc-800" />
                )}
                <TextInput
                  value={form.imageUrl}
                  onChange={(v) => set({ imageUrl: v })}
                  placeholder="Optional"
                  type="url"
                  inputMode="url"
                />
              </div>
            </Field>
            <div className="flex items-end gap-3">
              <Checkbox
                checked={form.isActive}
                onChange={(v) => set({ isActive: v })}
                label="Active"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
                className="ml-auto rounded-xl"
              >
                {isSaving ? "Saving…" : form.id ? "Save" : "Add"}
              </Button>
            </div>
          </div>

          {saveError ? (
            <div className="text-sm text-red-600 dark:text-red-400">{saveError}</div>
          ) : null}

          <details className="group mt-2 rounded-2xl border border-black/10 bg-zinc-50 dark:border-white/15 dark:bg-black">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-black outline-none hover:bg-black/[.03] focus-visible:ring-2 focus-visible:ring-black/10 dark:text-zinc-50 dark:hover:bg-white/5 dark:focus-visible:ring-white/10">
              <span>Promotion</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-5 w-5 shrink-0 text-zinc-600 transition-transform duration-200 group-open:rotate-180 dark:text-zinc-400"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>

            <div className="px-3 pb-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Type">
                  <SelectInput
                    value={form.promotionMode}
                    onChange={(v) => set({ promotionMode: v as PromotionMode })}
                  >
                    <option value="NONE">None</option>
                    <option value="PERCENT">Percent discount</option>
                    <option value="PRICE">Promo price</option>
                    <option value="BOGO">BOGO (1+1)</option>
                  </SelectInput>
                </Field>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Date window
                  </label>
                  <DateRangePickerInput
                    startValue={form.promoStartsAt}
                    endValue={form.promoEndsAt}
                    onStartChange={(v) => set({ promoStartsAt: v })}
                    onEndChange={(v) => set({ promoEndsAt: v })}
                    disabled={form.promotionMode === "NONE"}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Percent off">
                  <PercentInput
                    value={form.percentOff}
                    onChange={(v) => set({ percentOff: v })}
                    disabled={form.promotionMode !== "PERCENT"}
                  />
                </Field>
                <Field label="Promo price">
                  <MoneyInput
                    value={form.promoPrice}
                    onChange={(v) => set({ promoPrice: v })}
                    disabled={form.promotionMode !== "PRICE"}
                  />
                </Field>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Label">
                  <TextInput
                    value={form.promoLabel}
                    onChange={(v) => set({ promoLabel: v })}
                    placeholder="Optional (e.g. -30%, 1+1)"
                    disabled={form.promotionMode === "NONE"}
                  />
                </Field>
                <div className="flex items-end gap-3">
                  <Checkbox
                    checked={form.promoIsActive}
                    onChange={(v) => set({ promoIsActive: v })}
                    label="Promotion active"
                    disabled={form.promotionMode === "NONE"}
                  />
                </div>
              </div>
            </div>
          </details>

          <details className="group mt-2 rounded-2xl border border-black/10 bg-zinc-50 dark:border-white/15 dark:bg-black">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-black outline-none hover:bg-black/[.03] focus-visible:ring-2 focus-visible:ring-black/10 dark:text-zinc-50 dark:hover:bg-white/5 dark:focus-visible:ring-white/10">
              <span>Competitor price lookup</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-5 w-5 shrink-0 text-zinc-600 transition-transform duration-200 group-open:rotate-180 dark:text-zinc-400"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </summary>

            <div className="px-3 pb-3">
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                Looks up the <strong>Barcode</strong> field above across 11 Greek supermarkets (e-katanalotis.gov.gr). Data is refreshed daily.
              </p>
              <Button
                type="button"
                onClick={handleLookup}
                disabled={isLooking || !form.barcode.trim()}
              >
                {isLooking ? "Looking up…" : "Look up barcode"}
              </Button>

              {lookupError ? (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{lookupError}</p>
              ) : null}

              {lookupResult && (lookupResult.name || lookupResult.category || lookupResult.image_url) ? (
                <div className="mt-3 rounded-xl border border-black/10 p-3 dark:border-white/10">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Found on e-katanalotis</p>
                  {lookupResult.image_url ? (
                    <img
                      src={lookupResult.image_url}
                      alt={lookupResult.name ?? ""}
                      className="mt-2 h-24 w-full rounded-lg border border-black/10 bg-zinc-100 object-contain dark:border-white/10 dark:bg-zinc-800"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).alt = "Image unavailable"; }}
                    />
                  ) : null}
                  {lookupResult.name ? (
                    <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">Name: </span>{lookupResult.name}
                    </p>
                  ) : null}
                  {lookupResult.category ? (
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">Category: </span>{lookupResult.category}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => set({
                      ...(lookupResult.name ? { name: lookupResult.name } : {}),
                      ...(lookupResult.category ? { category: lookupResult.category } : {}),
                      ...(lookupResult.image_url ? { imageUrl: lookupResult.image_url } : {}),
                    })}
                    className="mt-2 rounded-lg px-2 py-0.5 text-xs font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
                  >
                    Apply name, category &amp; image →
                  </button>
                </div>
              ) : null}

              {lookupResult && lookupResult.prices.length > 0 ? (
                <div className="mt-2 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/10 bg-black/[.03] dark:border-white/10 dark:bg-white/[.03]">
                        <th className="px-3 py-1.5 text-left font-semibold text-zinc-700 dark:text-zinc-300">Supermarket</th>
                        <th className="px-3 py-1.5 text-right font-semibold text-zinc-700 dark:text-zinc-300">Price</th>
                        <th className="px-3 py-1.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lookupResult.prices.map((p, i) => (
                        <tr
                          key={p.merchant}
                          className={`${
                            i === 0 ? "font-semibold text-green-700 dark:text-green-400" : "text-zinc-700 dark:text-zinc-300"
                          } ${i < lookupResult.prices.length - 1 ? "border-b border-black/5 dark:border-white/5" : ""}`}
                        >
                          <td className="px-3 py-1.5">{p.merchant}</td>
                          <td className="px-3 py-1.5 text-right">€{p.price.toFixed(2)}</td>
                          <td className="px-3 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => set({ competitorName: p.merchant, competitorPrice: String(p.price) })}
                              className="rounded-lg px-2 py-0.5 text-xs font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
                            >
                              Use
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </details>
        </div>
      </form>
    </Card>
  );
}
