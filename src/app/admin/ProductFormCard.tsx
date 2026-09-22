"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import DateRangePickerInput from "@/components/inputs/DateRangePickerInput";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Checkbox from "@/components/ui/Checkbox";
import Field from "@/components/ui/Field";
import MoneyInput from "@/components/inputs/MoneyInput";
import PercentInput from "@/components/inputs/PercentInput";
import SelectInput from "@/components/inputs/SelectInput";
import TextInput from "@/components/inputs/TextInput";
import TextAreaInput from "@/components/inputs/TextAreaInput";
import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useT } from "@/context/LanguageContext";
import { uploadProductImage } from "@/services/storage";

import type { CompetitorLookupResult } from "@/app/api/competitor-prices/route";
import type { CategoryRow, ProductFormState, PromotionMode } from "@/types/admin";
import type { PriceUnit } from "@/lib/price";

type Props = {
  form: ProductFormState;
  onChange: (update: Partial<ProductFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNew: () => void;
  isSaving: boolean;
  saveError: string | null;
  categories: CategoryRow[];
  /** When true, renders without the Card wrapper (used inside the drawer) */
  inDrawer?: boolean;
  /** id applied to the <form> element, so an external button can submit it via the `form` attribute */
  formId?: string;
  /** When true, hides the inline submit button (used when the caller renders its own footer button) */
  hideSubmitButton?: boolean;
};

export default function ProductFormCard({
  form,
  onChange,
  onSubmit,
  onNew,
  isSaving,
  saveError,
  categories,
  inDrawer = false,
  formId,
  hideSubmitButton = false,
}: Props) {
  const set = onChange;
  const t = useT();
  const { supabase } = useAdminAuthContext();

  const roots = categories.filter((c) => c.parent_id === null);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const [lookupResult, setLookupResult] = useState<CompetitorLookupResult | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !supabase) return;
    setIsUploading(true);
    setUploadError(null);
    const { url, error } = await uploadProductImage(supabase, file, {
      notAnImage: t.errors.fileMustBeImage,
      tooLarge: t.errors.imageTooLarge,
    });
    if (error || !url) {
      setUploadError(error ?? t.productForm.uploadFailed);
    } else {
      set({ imageUrl: url });
    }
    setIsUploading(false);
  }

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
      if (data.prices.length === 0) setLookupError(t.productForm.noPricesFound);
    } catch {
      setLookupError(t.productForm.lookupFailed);
    } finally {
      setIsLooking(false);
    }
  }

  return (
    <Card style={inDrawer ? { border: "none", borderRadius: 0, background: "transparent", boxShadow: "none", padding: 0 } : undefined}>
      {!inDrawer && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-black dark:text-zinc-50">{t.productForm.products}</h2>
          <Button type="button" onClick={onNew}>
            {t.productForm.new}
          </Button>
        </div>
      )}

      <form id={formId} onSubmit={onSubmit} className={inDrawer ? "p-4" : "mt-4"}>
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.productForm.barcode}>
              <TextInput
                value={form.barcode}
                onChange={(v) => set({ barcode: v })}
                placeholder={t.common.optional}
              />
            </Field>
            <Field label={t.productForm.category}>
              <SelectInput
                value={form.categoryId}
                onChange={(v) => set({ categoryId: v })}
              >
                <option value="">{t.productForm.selectPlaceholder}</option>
                {roots.map((root) => {
                  const subs = childrenOf(root.id);
                  return subs.length > 0 ? (
                    <optgroup key={root.id} label={root.name}>
                      <option value={root.id}>{t.productForm.allSuffix(root.name)}</option>
                      {subs.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    <option key={root.id} value={root.id}>
                      {root.name}
                    </option>
                  );
                })}
              </SelectInput>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.productForm.name}>
              <TextInput value={form.name} onChange={(v) => set({ name: v })} required />
            </Field>
            <Field label={t.productForm.supplier}>
              <TextInput value={form.supplier} onChange={(v) => set({ supplier: v })} placeholder={t.common.optional} />
            </Field>
          </div>

          <Field label={t.productForm.description}>
            <TextAreaInput
              value={form.description}
              onChange={(v) => set({ description: v })}
              placeholder={t.productForm.descriptionPlaceholder}
              rows={3}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.productForm.price}>
              <MoneyInput value={form.price} onChange={(v) => set({ price: v })} required />
            </Field>
            <Field label={t.productForm.pricedPer}>
              <div className="flex h-[38px] items-center overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/15 dark:bg-black">
                {(["piece", "kg"] as PriceUnit[]).map((unit, i) => {
                  const active = form.priceUnit === unit;
                  return (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => set({ priceUnit: unit })}
                      className={`h-full flex-1 text-sm transition-colors ${
                        i > 0 ? "border-l border-black/10 dark:border-white/15" : ""
                      } ${
                        active
                          ? "font-medium"
                          : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/5"
                      }`}
                      style={active ? { backgroundColor: "var(--accent)", color: "var(--accent-fg)" } : undefined}
                    >
                      {unit === "piece" ? t.productForm.perPiece : t.productForm.perKg}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.productForm.competitorName}>
              <TextInput
                value={form.competitorName}
                onChange={(v) => set({ competitorName: v })}
                placeholder={t.common.optional}
              />
            </Field>
            <Field label={t.productForm.competitorPrice}>
              <MoneyInput
                value={form.competitorPrice}
                onChange={(v) => set({ competitorPrice: v })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.productForm.image}>
              <div className="flex items-center gap-2">
                {form.imageUrl ? (
                  <Image
                    src={form.imageUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-lg border border-black/10 bg-zinc-100 object-contain dark:border-white/10 dark:bg-zinc-800"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-zinc-800" />
                )}
                <TextInput
                  value={form.imageUrl}
                  onChange={(v) => set({ imageUrl: v })}
                  placeholder={t.productForm.pasteImageUrl}
                  type="url"
                  inputMode="url"
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleFileSelected(e)}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => void handleFileSelected(e)}
                />
              </div>
              {uploadError ? (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">{uploadError}</div>
              ) : null}
            </Field>
            <div className="flex flex-wrap items-center gap-3 sm:pt-6">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !supabase}
                  className="text-xs"
                >
                  {isUploading ? t.productForm.uploading : t.productForm.uploadPhoto}
                </Button>
                <Button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading || !supabase}
                  className="text-xs"
                >
                  {t.productForm.takePhoto}
                </Button>
              <Checkbox
                checked={form.isActive}
                onChange={(v) => set({ isActive: v })}
                label={t.common.active}
              />
              {!hideSubmitButton && (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="ml-auto rounded-xl"
                >
                  {isSaving ? t.common.saving : form.id ? t.common.save : t.common.add}
                </Button>
              )}
            </div>
          </div>

          {saveError ? (
            <div className="text-sm text-red-600 dark:text-red-400">{saveError}</div>
          ) : null}

          <details className="group mt-2 rounded-2xl border border-black/10 bg-zinc-50 dark:border-white/15 dark:bg-black">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-black outline-none hover:bg-black/[.03] focus-visible:ring-2 focus-visible:ring-black/10 dark:text-zinc-50 dark:hover:bg-white/5 dark:focus-visible:ring-white/10">
              <span>{t.productForm.promotion}</span>
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
              {/* Row 1: Type + conditional value field */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t.productForm.type}>
                  <SelectInput
                    value={form.promotionMode}
                    onChange={(v) => set({ promotionMode: v as PromotionMode })}
                  >
                    <option value="NONE">{t.common.none}</option>
                    <option value="PERCENT">{t.productForm.percentDiscount}</option>
                    <option value="PRICE">{t.productForm.promoPrice}</option>
                    <option value="BOGO">{t.productForm.bogo}</option>
                  </SelectInput>
                </Field>
                {form.promotionMode === "PERCENT" ? (
                  <Field label={t.productForm.percentOff}>
                    <PercentInput
                      value={form.percentOff}
                      onChange={(v) => set({ percentOff: v })}
                    />
                  </Field>
                ) : form.promotionMode === "PRICE" ? (
                  <Field label={t.productForm.promoPrice}>
                    <MoneyInput
                      value={form.promoPrice}
                      onChange={(v) => set({ promoPrice: v })}
                    />
                  </Field>
                ) : (
                  <div />
                )}
              </div>

              {/* Row 2: Date window — full width for space */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {t.productForm.dateWindow}
                </label>
                <DateRangePickerInput
                  startValue={form.promoStartsAt}
                  endValue={form.promoEndsAt}
                  onStartChange={(v) => set({ promoStartsAt: v })}
                  onEndChange={(v) => set({ promoEndsAt: v })}
                  disabled={form.promotionMode === "NONE"}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t.productForm.label}>
                  <TextInput
                    value={form.promoLabel}
                    onChange={(v) => set({ promoLabel: v })}
                    placeholder={t.productForm.labelPlaceholder}
                    disabled={form.promotionMode === "NONE"}
                  />
                </Field>
                <div className="flex items-end gap-3">
                  <Checkbox
                    checked={form.promoIsActive}
                    onChange={(v) => set({ promoIsActive: v })}
                    label={t.productForm.promotionActive}
                    disabled={form.promotionMode === "NONE"}
                  />
                </div>
              </div>
            </div>
          </details>

          <details className="group mt-2 rounded-2xl border border-black/10 bg-zinc-50 dark:border-white/15 dark:bg-black">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-black outline-none hover:bg-black/[.03] focus-visible:ring-2 focus-visible:ring-black/10 dark:text-zinc-50 dark:hover:bg-white/5 dark:focus-visible:ring-white/10">
              <span>{t.productForm.competitorLookup}</span>
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
                {t.productForm.lookupHintPrefix} <strong>{t.productForm.barcode}</strong> {t.productForm.lookupHintSuffix}
              </p>
              <Button
                type="button"
                onClick={handleLookup}
                disabled={isLooking || !form.barcode.trim()}
              >
                {isLooking ? t.productForm.lookingUp : t.productForm.lookUpBarcode}
              </Button>

              {lookupError ? (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{lookupError}</p>
              ) : null}

              {lookupResult && (lookupResult.name || lookupResult.category || lookupResult.image_url) ? (
                <div className="mt-3 rounded-xl border border-black/10 p-3 dark:border-white/10">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{t.productForm.foundOnSource}</p>
                  {lookupResult.image_url ? (
                    <div className="relative mt-2 h-24 w-full rounded-lg border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-zinc-800">
                      <Image
                        src={lookupResult.image_url}
                        alt={lookupResult.name ?? ""}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-contain"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).alt = t.productForm.imageUnavailable; }}
                      />
                    </div>
                  ) : null}
                  {lookupResult.name ? (
                    <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{t.productForm.nameLabel}</span>{lookupResult.name}
                    </p>
                  ) : null}
                  {lookupResult.category ? (
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{t.productForm.categoryLabel}</span>
                      {lookupResult.sub_category
                        ? `${lookupResult.category} › ${lookupResult.sub_category}`
                        : lookupResult.category}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      // Match subcategory first (more specific), then fall back to root
                      const matchedCat = (() => {
                        if (lookupResult.sub_category) {
                          const sub = categories.find(
                            (c) => c.parent_id !== null &&
                              c.name.toLowerCase() === lookupResult.sub_category!.toLowerCase()
                          );
                          if (sub) return sub;
                        }
                        if (lookupResult.category) {
                          return categories.find(
                            (c) => c.name.toLowerCase() === lookupResult.category!.toLowerCase()
                          ) ?? null;
                        }
                        return null;
                      })();
                      set({
                        ...(lookupResult.name ? { name: lookupResult.name } : {}),
                        ...(matchedCat ? { categoryId: matchedCat.id } : {}),
                        ...(lookupResult.image_url ? { imageUrl: lookupResult.image_url } : {}),
                      });
                    }}
                    className="mt-2 rounded-lg px-2 py-0.5 text-xs font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
                  >
                    {t.productForm.applyFromLookup}
                  </button>
                </div>
              ) : null}

              {lookupResult && lookupResult.prices.length > 0 ? (
                <div className="mt-2 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/10 bg-black/[.03] dark:border-white/10 dark:bg-white/[.03]">
                        <th className="px-3 py-1.5 text-left font-semibold text-zinc-700 dark:text-zinc-300">{t.productForm.supermarket}</th>
                        <th className="px-3 py-1.5 text-right font-semibold text-zinc-700 dark:text-zinc-300">{t.productForm.price}</th>
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
                              {t.productForm.use}
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
