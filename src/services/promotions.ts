import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { PromotionRow, PromotionType } from "@/types/admin";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export type PromotionPayload = {
  product_id: string;
  type: PromotionType;
  percent_off: number | null;
  promo_price: number | null;
  is_bogo: boolean;
  label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

const PROMO_FIELDS =
  "id,product_id,type,percent_off,promo_price,is_bogo,label,starts_at,ends_at,is_active,updated_at";

export async function fetchPromotionsForProducts(
  supabase: Client,
  productIds: string[]
): Promise<{ data: Record<string, PromotionRow | undefined>; error: string | null }> {
  if (productIds.length === 0) return { data: {}, error: null };

  const { data, error } = await supabase
    .from("promotions")
    .select(PROMO_FIELDS)
    .in("product_id", productIds)
    .order("updated_at", { ascending: false })
    .limit(2000); // one active promo per product — increase if multiple promos per product are introduced

  if (error || !data) return { data: {}, error: error?.message ?? null };

  const map: Record<string, PromotionRow | undefined> = {};
  for (const row of data as PromotionRow[]) {
    if (!map[row.product_id]) map[row.product_id] = row;
  }
  return { data: map, error: null };
}

export async function fetchPromotionForProduct(
  supabase: Client,
  productId: string
): Promise<{ data: PromotionRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("promotions")
    .select(PROMO_FIELDS)
    .eq("product_id", productId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as PromotionRow | null, error: null };
}

export async function deactivatePromotions(
  supabase: Client,
  productId: string,
  exceptId?: string
): Promise<{ error: string | null }> {
  const base = supabase
    .from("promotions")
    .update({ is_active: false })
    .eq("product_id", productId);

  const { error } = exceptId
    ? await base.neq("id", exceptId)
    : await base;

  return { error: error?.message ?? null };
}

export async function upsertPromotion(
  supabase: Client,
  payload: PromotionPayload,
  existingId?: string
): Promise<{ error: string | null }> {
  const { error } = existingId
    ? await supabase.from("promotions").update(payload).eq("id", existingId)
    : await supabase.from("promotions").insert(payload);
  return { error: error?.message ?? null };
}
