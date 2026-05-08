export type ProductRow = {
  id: string;
  sku: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  competitor_name: string | null;
  competitor_price: number | null;
  price: number;
  is_active: boolean;
  updated_at: string;
};

export type PromotionType = "PERCENT" | "PRICE" | "BOGO";

export type PromotionRow = {
  id: string;
  product_id: string;
  type: PromotionType;
  percent_off: number | null;
  promo_price: number | null;
  is_bogo: boolean;
  label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  updated_at: string;
};

export type PromotionMode = "NONE" | PromotionType;

export type ProductFormState = {
  id?: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  competitorName: string;
  competitorPrice: string;
  price: string;
  isActive: boolean;

  promotionId?: string;
  promotionMode: PromotionMode;
  percentOff: string;
  promoPrice: string;
  promoLabel: string;
  promoStartsAt: string;
  promoEndsAt: string;
  promoIsActive: boolean;
};

export const emptyForm: ProductFormState = {
  sku: "",
  name: "",
  brand: "",
  category: "",
  imageUrl: "",
  competitorName: "",
  competitorPrice: "",
  price: "",
  isActive: true,
  promotionMode: "NONE",
  percentOff: "",
  promoPrice: "",
  promoLabel: "",
  promoStartsAt: "",
  promoEndsAt: "",
  promoIsActive: true,
};

export function parseOptionalMoney(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value)) return null;
  return value;
}

export function parseOptionalInteger(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return Math.trunc(value);
}

export function parseOptionalDateTimeLocal(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let normalized = trimmed;
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(normalized)) {
    normalized = normalized.replace(" ", "T");
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized = `${normalized}T00:00`;
  }
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function toDateOnlyValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
