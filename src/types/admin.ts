import type { PriceUnit } from "@/lib/price";

/** A `products` row as the admin reads it (hidden products included). */
export type ProductRow = {
  id: string;
  barcode: string | null;
  name: string;
  description: string | null;
  size: string | null;
  category_id: string | null; // a top-level category or a subcategory
  image_url: string | null;
  competitor_name: string | null;
  competitor_price: number | null;
  price: number;
  price_unit: PriceUnit;
  is_super_price: boolean;
  is_bogo: boolean;
  is_active: boolean; // "show in the catalogue"
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  image_url?: string | null;
};

/** The product editor's fields, as typed (strings for the number inputs). */
export type ProductFormState = {
  id?: string;
  barcode: string;
  name: string;
  description: string;
  size: string;
  categoryId: string; // top-level
  subcategoryId: string; // "" = none
  imageUrl: string;
  price: string;
  priceUnit: PriceUnit;
  isSuperPrice: boolean;
  isBogo: boolean;
  isActive: boolean;
  competitorName: string;
  competitorPrice: string;
};

export const emptyProductForm: ProductFormState = {
  barcode: "",
  name: "",
  description: "",
  size: "",
  categoryId: "",
  subcategoryId: "",
  imageUrl: "",
  price: "",
  priceUnit: "piece",
  isSuperPrice: false,
  isBogo: false,
  isActive: true,
  competitorName: "",
  competitorPrice: "",
};

/** "4,99" or "4.99" → 4.99; "" → null; anything else → NaN. */
export function parseMoney(input: string): number | null {
  const trimmed = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return Number.NaN;
  return Number(trimmed);
}

/** 4.99 → "4,99" for the price inputs. */
export function moneyText(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2).replace(".", ",") : "";
}
