"use client";

import { useRef, useState, type FormEvent } from "react";

import type { CompetitorLookupResult } from "@/app/api/competitor-prices/route";
import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useT } from "@/context/LanguageContext";
import { foldGreek } from "@/lib/greek";
import { safeImageUrl } from "@/lib/image-url";
import { formatEUR } from "@/lib/price";
import { UploadError, uploadProductImage } from "@/services/storage";
import { moneyText, type CategoryRow, type ProductFormState } from "@/types/admin";

type Props = {
  form: ProductFormState;
  setField: (patch: Partial<ProductFormState>) => void;
  categories: CategoryRow[];
  busy: boolean;
  error: string | null;
  message: string | null;
  onSubmit: () => void;
  onNew: () => void;
  onDelete: () => void;
};

/** Matches the price list's category names to ours (accent-insensitive). */
function matchCategory(categories: CategoryRow[], root: string | null, sub: string | null) {
  if (!root) return null;
  const r = categories.find((c) => !c.parent_id && foldGreek(c.name) === foldGreek(root));
  if (!r) return null;
  const s = sub ? categories.find((c) => c.parent_id === r.id && foldGreek(c.name) === foldGreek(sub)) : undefined;
  return { categoryId: r.id, subcategoryId: s?.id ?? "" };
}

export default function ProductEditor({ form, setField, categories, busy, error, message, onSubmit, onNew, onDelete }: Props) {
  const t = useT().admin;
  const p = t.products;
  const { supabase } = useAdminAuthContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lookup, setLookup] = useState<CompetitorLookupResult | null>(null);
  const [lookupState, setLookupState] = useState<"idle" | "busy" | "none" | "failed">("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const roots = categories.filter((c) => !c.parent_id);
  const subs = categories.filter((c) => c.parent_id === form.categoryId);
  const editing = Boolean(form.id);

  async function onFile(file: File | undefined) {
    if (!file || !supabase) return;
    setUploading(true);
    setUploadError(null);
    try {
      setField({ imageUrl: await uploadProductImage(supabase, file) });
    } catch (e) {
      const kind = e instanceof UploadError ? e.kind : "failed";
      setUploadError(kind === "not-image" ? p.errors.imageType : kind === "too-large" ? p.errors.imageSize : p.errors.upload);
    } finally {
      setUploading(false);
    }
  }

  async function runLookup() {
    const barcode = form.barcode.trim();
    if (!barcode) return;
    setLookupState("busy");
    setLookup(null);
    try {
      const res = await fetch(`/api/competitor-prices?barcode=${encodeURIComponent(barcode)}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as CompetitorLookupResult;
      if (!data.name) return setLookupState("none");
      setLookup(data);
      setLookupState("idle");
    } catch {
      setLookupState("failed");
    }
  }

  function applyLookup() {
    if (!lookup) return;
    const cat = matchCategory(categories, lookup.category, lookup.sub_category);
    setField({
      name: lookup.name ?? form.name,
      imageUrl: lookup.image_url ?? form.imageUrl,
      ...(cat ?? {}),
    });
  }

  const cheapest = lookup?.prices[0];

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <section className="ka-card" id="product-editor">
      <div className="ka-card-title">
        <h2>{editing ? p.editProduct : p.newProduct}</h2>
        {editing && (
          <button type="button" className="ka-text-btn" onClick={onNew} disabled={busy}>
            {p.addNew}
          </button>
        )}
      </div>

      <form onSubmit={submit} noValidate>
        <fieldset disabled={busy} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
          {/* Photo */}
          <div className="ka-field">
            <span>{p.photo}</span>
            <div className="ka-upload">
              {form.imageUrl ? (
                <div className="ka-upload-preview">
                  {/^(https?:\/\/|\/)/.test(form.imageUrl.trim()) && (
                    // Plain <img>: admin previews must render any link without crashing the page.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="" />
                  )}
                </div>
              ) : (
                <button type="button" className="ka-upload-placeholder" style={{ width: "100%", border: 0, background: "none" }} onClick={() => fileRef.current?.click()}>
                  <b>＋</b>
                  <span>{p.photoPick}</span>
                </button>
              )}
              <div className="ka-upload-actions">
                {/* With no photo yet, the big placeholder above is the "choose" button. */}
                {(form.imageUrl || uploading) && (
                  <button type="button" className="ka-btn-small" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? p.photoUploading : p.photoChange}
                  </button>
                )}
                <button type="button" className="ka-btn-small" onClick={() => cameraRef.current?.click()} disabled={uploading}>
                  {p.photoCamera}
                </button>
                {form.imageUrl && (
                  <button type="button" className="ka-text-btn" onClick={() => setField({ imageUrl: "" })}>
                    {p.photoRemove}
                  </button>
                )}
              </div>
              <input ref={fileRef} className="ka-file" type="file" accept="image/jpeg,image/png,image/webp" tabIndex={-1} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
              <input ref={cameraRef} className="ka-file" type="file" accept="image/*" capture="environment" tabIndex={-1} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
              <small className="ka-hint">{p.photoHint}</small>
              {uploadError && <p className="ka-error">{uploadError}</p>}
            </div>
            <input
              className="ka-input"
              type="url"
              inputMode="url"
              placeholder={p.photoUrl}
              aria-label={p.photoUrl}
              value={form.imageUrl}
              onChange={(e) => setField({ imageUrl: e.target.value })}
            />
          </div>

          {/* Barcode + lookup */}
          <label className="ka-field">
            {p.barcode} <small>({t.common.optional})</small>
            <span className="ka-inline">
              <input inputMode="numeric" value={form.barcode} onChange={(e) => setField({ barcode: e.target.value })} />
              <button type="button" className="ka-btn-small" onClick={() => void runLookup()} disabled={!form.barcode.trim() || lookupState === "busy"}>
                {lookupState === "busy" ? p.lookingUp : p.lookup}
              </button>
            </span>
            <small>{p.lookupHint}</small>
          </label>
          {lookupState === "none" && <p className="ka-error">{p.lookupNotFound}</p>}
          {lookupState === "failed" && <p className="ka-error">{p.lookupFailed}</p>}
          {lookup && (
            <div className="ka-lookup">
              <div className="ka-lookup-pic">
                {safeImageUrl(lookup.image_url) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lookup.image_url ?? ""} alt="" />
                )}
              </div>
              <div>
                <p>
                  <b>{lookup.name}</b>
                </p>
                <span className="ka-hint">{[lookup.category, lookup.sub_category].filter(Boolean).join(" › ")}</span>
                {cheapest && <span className="ka-hint">{p.cheapest(cheapest.merchant, formatEUR(cheapest.price))}</span>}
                <div className="ka-lookup-actions">
                  <button type="button" className="ka-btn-small" onClick={applyLookup}>
                    {p.lookupApply}
                  </button>
                  {cheapest && (
                    <button
                      type="button"
                      className="ka-btn-small"
                      onClick={() => setField({ competitorName: cheapest.merchant, competitorPrice: moneyText(cheapest.price) })}
                    >
                      {p.useAsCompetitor}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <label className="ka-field">
            {p.name} *
            <input maxLength={160} value={form.name} placeholder={p.namePlaceholder} onChange={(e) => setField({ name: e.target.value })} />
          </label>

          <div className="ka-pair">
            <label className="ka-field">
              {p.price} *
              <input inputMode="decimal" value={form.price} placeholder="4,99" onChange={(e) => setField({ price: e.target.value })} />
            </label>
            <div className="ka-field">
              <span aria-hidden="true">&nbsp;</span>
              <div className="ka-seg" role="group" aria-label={p.price}>
                <button type="button" aria-pressed={form.priceUnit === "piece"} onClick={() => setField({ priceUnit: "piece" })}>
                  {p.perPiece}
                </button>
                <button type="button" aria-pressed={form.priceUnit === "kg"} onClick={() => setField({ priceUnit: "kg" })}>
                  {p.perKg}
                </button>
              </div>
            </div>
          </div>

          <label className="ka-field">
            {p.size}
            <input maxLength={100} value={form.size} placeholder={p.sizePlaceholder} onChange={(e) => setField({ size: e.target.value })} />
          </label>

          <div className="ka-pair">
            <label className="ka-field">
              {p.category} *
              <select value={form.categoryId} onChange={(e) => setField({ categoryId: e.target.value, subcategoryId: "" })}>
                <option value="">{p.categoryPick}</option>
                {roots.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="ka-field">
              {p.subcategory}
              <select value={form.subcategoryId} disabled={subs.length === 0} onChange={(e) => setField({ subcategoryId: e.target.value })}>
                <option value="">{p.noSubcategory}</option>
                {subs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="ka-field">
            {p.description}
            <textarea rows={4} maxLength={4000} value={form.description} placeholder={p.descriptionPlaceholder} onChange={(e) => setField({ description: e.target.value })} />
          </label>

          <label className="ka-check ka-check-super">
            <input type="checkbox" checked={form.isSuperPrice} onChange={(e) => setField({ isSuperPrice: e.target.checked })} />
            <span>
              <strong>{p.superPrice}</strong>
              <small>{p.superPriceHint}</small>
            </span>
          </label>
          <label className="ka-check ka-check-bogo">
            <input type="checkbox" checked={form.isBogo} onChange={(e) => setField({ isBogo: e.target.checked })} />
            <span>
              <strong>{p.bogo}</strong>
              <small>{p.bogoHint}</small>
            </span>
          </label>
          <label className="ka-check">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setField({ isActive: e.target.checked })} />
            <span>
              <strong>{p.visible}</strong>
              <small>{p.visibleHint}</small>
            </span>
          </label>

          <details className="ka-details" open={Boolean(form.competitorName || form.competitorPrice) || undefined}>
            <summary>
              {p.competitor} <small className="ka-hint">({t.common.optional})</small>
            </summary>
            <div>
              <p className="ka-hint" style={{ margin: "0 0 12px" }}>
                {p.competitorHint}
              </p>
              <div className="ka-pair">
                <label className="ka-field">
                  {p.competitorName}
                  <input value={form.competitorName} onChange={(e) => setField({ competitorName: e.target.value })} />
                </label>
                <label className="ka-field">
                  {p.competitorPrice}
                  <input inputMode="decimal" value={form.competitorPrice} onChange={(e) => setField({ competitorPrice: e.target.value })} />
                </label>
              </div>
            </div>
          </details>
        </fieldset>

        {error && (
          <p className="ka-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="ka-success" role="status">
            {message}
          </p>
        )}

        <div className="ka-actions">
          <button type="submit" className="ka-btn" disabled={busy || uploading}>
            {busy ? t.common.saving : p.saveProduct}
          </button>
          {editing && (
            <button type="button" className="ka-text-btn" onClick={onNew} disabled={busy}>
              {t.common.closeEdit}
            </button>
          )}
        </div>

        {editing &&
          (confirmDelete ? (
            <div className="ka-confirm">
              <span>{p.deleteConfirm}</span>
              <button
                type="button"
                className="ka-danger"
                disabled={busy}
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete();
                }}
              >
                {t.common.yesDelete}
              </button>
              <button type="button" className="ka-text-btn" onClick={() => setConfirmDelete(false)}>
                {t.common.no}
              </button>
            </div>
          ) : (
            <button type="button" className="ka-danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
              {p.deleteProduct}
            </button>
          ))}
      </form>
    </section>
  );
}
