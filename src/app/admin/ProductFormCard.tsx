"use client";

import DateRangePickerInput from "@/components/inputs/DateRangePickerInput";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Field from "@/components/ui/Field";
import MoneyInput from "@/components/inputs/MoneyInput";
import PercentInput from "@/components/inputs/PercentInput";
import SelectInput from "@/components/inputs/SelectInput";
import TextInput from "@/components/inputs/TextInput";

import type { ProductFormState, PromotionMode } from "@/types/admin";

type Props = {
  form: ProductFormState;
  onChange: (update: Partial<ProductFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNew: () => void;
  isSaving: boolean;
  saveError: string | null;
};

export default function ProductFormCard({
  form,
  onChange,
  onSubmit,
  onNew,
  isSaving,
  saveError,
}: Props) {
  const set = onChange;

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
            <Field label="SKU">
              <TextInput
                value={form.sku}
                onChange={(v) => set({ sku: v })}
                placeholder="Optional"
              />
            </Field>
            <Field label="Category">
              <TextInput
                value={form.category}
                onChange={(v) => set({ category: v })}
                placeholder="Optional"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name">
              <TextInput value={form.name} onChange={(v) => set({ name: v })} required />
            </Field>
            <Field label="Price">
              <MoneyInput value={form.price} onChange={(v) => set({ price: v })} required />
            </Field>
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
              <TextInput
                value={form.imageUrl}
                onChange={(v) => set({ imageUrl: v })}
                placeholder="Optional"
                type="url"
                inputMode="url"
              />
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
                <div className="flex items-end gap-3">
                  <Checkbox
                    checked={form.promoIsActive}
                    onChange={(v) => set({ promoIsActive: v })}
                    label="Promotion active"
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
            </div>
          </details>
        </div>
      </form>
    </Card>
  );
}
