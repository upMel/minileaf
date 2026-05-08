import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ProductRow } from "@/types/admin";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export type ProductPayload = {
  barcode: string | null;
  name: string;
  supplier: string | null;
  category: string | null;
  image_url: string | null;
  competitor_name: string | null;
  competitor_price: number | null;
  price: number;
  is_active: boolean;
};

const PRODUCT_FIELDS =
  "id,barcode,name,supplier,category,image_url,competitor_name,competitor_price,price,is_active,updated_at";

export async function fetchProducts(
  supabase: Client
): Promise<{ data: ProductRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .order("updated_at", { ascending: false })
    .limit(500); // increase if catalogue grows beyond 500

  if (error || !data) {
    return { data: [], error: error?.message ?? "Failed to load products." };
  }
  return { data: data as ProductRow[], error: null };
}

export async function upsertProduct(
  supabase: Client,
  payload: ProductPayload,
  id?: string
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = id
    ? await supabase.from("products").update(payload).eq("id", id).select("id").maybeSingle()
    : await supabase.from("products").insert(payload).select("id").maybeSingle();

  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string } | null)?.id ?? id ?? null, error: null };
}

export async function toggleProductActive(
  supabase: Client,
  id: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteProduct(
  supabase: Client,
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  return { error: error?.message ?? null };
}
