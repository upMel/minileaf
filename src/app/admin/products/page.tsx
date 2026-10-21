"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useT } from "@/context/LanguageContext";
import { safeImageUrl } from "@/lib/image-url";
import { toPriceUnit } from "@/lib/price";
import { deleteProduct, upsertProduct, type ProductPayload } from "@/services/products";
import { emptyProductForm, moneyText, parseMoney, type CategoryRow, type ProductFormState, type ProductRow } from "@/types/admin";

import ProductEditor from "./ProductEditor";
import ProductInventory from "./ProductInventory";
import { ADMIN_PRODUCTS_KEY, adminProductsQueryOptions, categoriesQueryOptions } from "./_queries";

/** Fills the editor from a saved product (category_id may be a subcategory). */
function toForm(p: ProductRow, categories: CategoryRow[]): ProductFormState {
  const cat = categories.find((c) => c.id === p.category_id);
  return {
    id: p.id,
    barcode: p.barcode ?? "",
    name: p.name,
    description: p.description ?? "",
    size: p.size ?? "",
    categoryId: cat?.parent_id ?? cat?.id ?? "",
    subcategoryId: cat?.parent_id ? cat.id : "",
    imageUrl: p.image_url ?? "",
    price: moneyText(p.price),
    priceUnit: toPriceUnit(p.price_unit),
    isSuperPrice: p.is_super_price,
    isBogo: p.is_bogo,
    isActive: p.is_active,
    competitorName: p.competitor_name ?? "",
    competitorPrice: moneyText(p.competitor_price),
  };
}

export default function AdminProductsPage() {
  const t = useT().admin;
  const p = t.products;
  const { supabase, adminState } = useAdminAuthContext();
  const enabled = adminState.status === "authorized" && Boolean(supabase);
  const queryClient = useQueryClient();

  const products = useQuery(adminProductsQueryOptions(supabase!, enabled));
  const categories = useQuery(categoriesQueryOptions(supabase!, enabled));

  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // Bumped whenever the editor starts over, so it also clears its own state (lookup panel etc.).
  const [version, setVersion] = useState(0);

  const setField = (patch: Partial<ProductFormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setMessage(null);
  };

  function startNew() {
    setVersion((v) => v + 1);
    setForm(emptyProductForm);
    setError(null);
    setMessage(null);
  }

  function startEdit(row: ProductRow) {
    setVersion((v) => v + 1);
    setForm(toForm(row, categories.data ?? []));
    setError(null);
    setMessage(null);
    // On a phone the editor sits above the list: bring it into view.
    if (window.matchMedia("(max-width: 800px)").matches) {
      document.getElementById("product-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function save() {
    if (!supabase) return;
    const price = parseMoney(form.price);
    const competitorPrice = parseMoney(form.competitorPrice);
    const problem = !form.name.trim()
      ? p.errors.name
      : price === null || Number.isNaN(price)
        ? p.errors.price
        : !form.categoryId
          ? p.errors.category
          : Number.isNaN(competitorPrice)
            ? p.errors.competitorPrice
            : form.imageUrl.trim() && !safeImageUrl(form.imageUrl)
              ? p.errors.imageUrl
              : null;
    if (problem) {
      setError(problem);
      return;
    }

    const payload: ProductPayload = {
      barcode: form.barcode.trim() || null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      size: form.size.trim() || null,
      category_id: form.subcategoryId || form.categoryId,
      image_url: form.imageUrl.trim() || null,
      price: price as number,
      price_unit: form.priceUnit,
      is_super_price: form.isSuperPrice,
      is_bogo: form.isBogo,
      is_active: form.isActive,
      competitor_name: form.competitorName.trim() || null,
      competitor_price: competitorPrice,
    };

    setBusy(true);
    setError(null);
    try {
      const id = await upsertProduct(supabase, payload, form.id);
      await queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
      if (form.id) {
        setForm((f) => ({ ...f, id }));
        setMessage(t.common.saved);
      } else {
        setVersion((v) => v + 1);
        setForm(emptyProductForm); // ready for the next one
        setMessage(p.added);
      }
    } catch (e) {
      setError(`${p.errors.save} (${e instanceof Error ? e.message : String(e)})`);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!supabase || !form.id) return;
    setBusy(true);
    setError(null);
    try {
      await deleteProduct(supabase, form.id);
      await queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
      setVersion((v) => v + 1);
      setForm(emptyProductForm);
      setMessage(p.deleted);
    } catch (e) {
      setError(`${p.errors.save} (${e instanceof Error ? e.message : String(e)})`);
    } finally {
      setBusy(false);
    }
  }

  const loadError = products.error ?? categories.error;

  return (
    <>
      <div className="ka-intro">
        <p>{t.eyebrow}</p>
        <h1>{p.title}</h1>
        <span>{p.subtitle}</span>
      </div>

      {loadError && (
        <p className="ka-error" role="alert">
          {t.common.loadFailed} ({loadError.message}){" "}
          <button type="button" className="ka-text-btn" onClick={() => void products.refetch()}>
            {t.common.retry}
          </button>
        </p>
      )}

      <div className="ka-layout">
        <ProductEditor
          key={version}
          form={form}
          setField={setField}
          categories={categories.data ?? []}
          busy={busy}
          error={error}
          message={message}
          onSubmit={() => void save()}
          onNew={startNew}
          onDelete={() => void remove()}
        />
        {products.isPending ? (
          <section className="ka-card">
            <p className="ka-hint">{t.common.loading}</p>
          </section>
        ) : (
          <ProductInventory
            products={products.data ?? []}
            categories={categories.data ?? []}
            editingId={form.id}
            disabled={busy}
            onEdit={startEdit}
          />
        )}
      </div>
    </>
  );
}
