import { useState } from "react";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { upsertProduct } from "@/services/products";
import { deactivatePromotions, fetchPromotionForProduct, upsertPromotion } from "@/services/promotions";
import {
  emptyForm,
  parseOptionalDateTimeLocal,
  parseOptionalInteger,
  parseOptionalMoney,
  toDateOnlyValue,
} from "@/types/admin";
import type { ProductFormState, ProductRow, PromotionMode, PromotionType } from "@/types/admin";

type Client = ReturnType<typeof createSupabaseBrowserClient>;

export function useProductForm(supabase: Client, onSaveSuccess: () => void) {
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function setField(update: Partial<ProductFormState>) {
    setForm((s) => ({ ...s, ...update }));
  }

  function startNew() {
    setSaveError(null);
    setForm(emptyForm);
  }

  async function startEdit(p: ProductRow) {
    if (!supabase) return;
    setSaveError(null);
    const { data: promotion } = await fetchPromotionForProduct(supabase, p.id);

    setForm({
      id: p.id,
      sku: p.sku ?? "",
      name: p.name,
      brand: p.brand ?? "",
      category: p.category ?? "",
      imageUrl: p.image_url ?? "",
      competitorName: p.competitor_name ?? "",
      competitorPrice: typeof p.competitor_price === "number" ? String(p.competitor_price) : "",
      price: String(p.price),
      isActive: p.is_active,
      promotionId: promotion?.id,
      promotionMode: promotion?.type ?? "NONE",
      percentOff: typeof promotion?.percent_off === "number" ? String(promotion.percent_off) : "",
      promoPrice: typeof promotion?.promo_price === "number" ? String(promotion.promo_price) : "",
      promoLabel: promotion?.label ?? "",
      promoStartsAt: toDateOnlyValue(promotion?.starts_at ?? null),
      promoEndsAt: toDateOnlyValue(promotion?.ends_at ?? null),
      promoIsActive: promotion?.is_active ?? true,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setIsSaving(true);
    setSaveError(null);

    // Validate + parse product fields
    const price = parseOptionalMoney(form.price);
    if (price === null) {
      setSaveError("Price is required.");
      setIsSaving(false);
      return;
    }

    const competitorPrice = parseOptionalMoney(form.competitorPrice);
    if (form.competitorPrice.trim() && competitorPrice === null) {
      setSaveError("Competitor price must be a number.");
      setIsSaving(false);
      return;
    }

    const payload = {
      sku: form.sku.trim() || null,
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category.trim() || null,
      image_url: form.imageUrl.trim() || null,
      competitor_name: form.competitorName.trim() || null,
      competitor_price: competitorPrice,
      price,
      is_active: form.isActive,
    };

    if (!payload.name) {
      setSaveError("Name is required.");
      setIsSaving(false);
      return;
    }

    // Save product
    const { id: finalProductId, error: productError } = await upsertProduct(
      supabase,
      payload,
      form.id
    );
    if (productError || !finalProductId) {
      setSaveError(productError ?? "Failed to save product.");
      setIsSaving(false);
      return;
    }

    // Validate + parse promotion fields
    const { promotionMode, promotionId: currentPromoId } = form;
    const promoLabel = form.promoLabel.trim() || null;
    const promoStartsAt = parseOptionalDateTimeLocal(form.promoStartsAt);
    const promoEndsAt = parseOptionalDateTimeLocal(form.promoEndsAt);

    if (form.promoStartsAt.trim() && promoStartsAt === null) {
      setSaveError("Promotion start date is invalid.");
      setIsSaving(false);
      return;
    }
    if (form.promoEndsAt.trim() && promoEndsAt === null) {
      setSaveError("Promotion end date is invalid.");
      setIsSaving(false);
      return;
    }

    // Save promotion
    if (promotionMode === "NONE") {
      const { error } = await deactivatePromotions(supabase, finalProductId);
      if (error) {
        setSaveError(error);
        setIsSaving(false);
        return;
      }
    } else {
      const percentOffRaw = parseOptionalInteger(form.percentOff);
      const promoPriceRaw = parseOptionalMoney(form.promoPrice);

      if (
        promotionMode === "PERCENT" &&
        (percentOffRaw === null || percentOffRaw < 0 || percentOffRaw > 100)
      ) {
        setSaveError("Percent off must be a number between 0 and 100.");
        setIsSaving(false);
        return;
      }
      if (promotionMode === "PRICE" && promoPriceRaw === null) {
        setSaveError("Promo price is required.");
        setIsSaving(false);
        return;
      }

      const promoPayload = {
        product_id: finalProductId,
        type: promotionMode as PromotionType,
        percent_off: promotionMode === "PERCENT" ? percentOffRaw : null,
        promo_price: promotionMode === "PRICE" ? promoPriceRaw : null,
        is_bogo: promotionMode === "BOGO",
        label: promoLabel,
        starts_at: promoStartsAt,
        ends_at: promoEndsAt,
        is_active: form.promoIsActive,
      };

      // Deactivate other promotions first, then upsert
      await deactivatePromotions(supabase, finalProductId, currentPromoId);
      const { error } = await upsertPromotion(supabase, promoPayload, currentPromoId);
      if (error) {
        setSaveError(error);
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    setForm(emptyForm);
    onSaveSuccess();
  }

  return { form, isSaving, saveError, setField, startNew, startEdit, save };
}
