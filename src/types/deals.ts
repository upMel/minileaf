import type { PriceUnit } from "@/lib/price";

export type Deal = {
  id: string;
  name: string;
  description?: string;
  /** UUID — used for filtering */
  categoryId?: string;
  /** Display name (legacy fallback) */
  category?: string;
  imageUrl?: string;
  price: number;
  priceUnit: PriceUnit;
  originalPrice?: number;
  promoLabel?: string;
  competitorName?: string;
  competitorPrice?: number;
};

export type CategoryNode = {
  id: string;
  name: string;
  children: CategoryNode[];
};

export type SupabaseDealRow = {
  product_id: string;
  name: string;
  description: string | null;
  price_unit: string | null;
  category: string | null;
  category_id: string | null;
  image_url: string | null;
  competitor_name: string | null;
  competitor_price: number | null;
  regular_price: number;
  effective_price: number;
  promotion_label: string | null;
  effective_percent_off: number | null;
  promotion_type: "PERCENT" | "PRICE" | "BOGO" | null;
  is_bogo: boolean | null;
};

export type SupabaseCategoryRow = { id: string; name: string; parent_id: string | null };
