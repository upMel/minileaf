import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { PriceUnit } from "@/lib/price";
import type { ProductRow } from "@/types/admin";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

/** What the editor writes. `supplier` and the old promotion data are left untouched. */
export type ProductPayload = {
  barcode: string | null;
  name: string;
  description: string | null;
  size: string | null;
  category_id: string | null;
  image_url: string | null;
  price: number;
  price_unit: PriceUnit;
  is_super_price: boolean;
  is_bogo: boolean;
  is_active: boolean;
  competitor_name: string | null;
  competitor_price: number | null;
};

const PRODUCT_FIELDS =
  "id,barcode,name,description,size,category_id,image_url,competitor_name,competitor_price,price,price_unit,is_super_price,is_bogo,is_active,updated_at";

export async function fetchProducts(supabase: Client): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .order("updated_at", { ascending: false })
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, price: Number(row.price) })) as ProductRow[];
}

export async function upsertProduct(supabase: Client, payload: ProductPayload, id?: string): Promise<string> {
  const { data, error } = id
    ? await supabase.from("products").update(payload).eq("id", id).select("id").single()
    : await supabase.from("products").insert(payload).select("id").single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

export async function deleteProduct(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
