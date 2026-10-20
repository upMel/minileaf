// Server-side data access for the storefront.
//
// Every function degrades instead of throwing: if Supabase isn't configured
// (local dev, previews) it serves the demo data in ./fallback; if a query
// fails it logs and returns an empty result, so one bad query never takes the
// whole page down. `cache()` de-duplicates calls within a single request —
// the layout, header and page can all ask for the store info and it's fetched
// once.

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { escapeLike, searchTerms } from "@/lib/greek";
import { FALLBACK_CATEGORY_ROWS } from "@/lib/data/fallback";
import {
  buildCategoryTree,
  CATALOG_FIELDS,
  CATEGORY_FIELDS,
  DEFAULT_STORE_INFO,
  parseStoreInfo,
  STORE_CONFIG_KEY,
  toProduct,
  type CatalogRow,
  type Category,
  type CategoryRow,
  type Product,
  type StoreInfo,
} from "@/types/catalog";

/** True when the site is running on demo data (no Supabase configured). */
export function isDemoMode(): boolean {
  return createSupabaseServerClient() === undefined;
}

export const getStoreInfo = cache(async (): Promise<StoreInfo> => {
  const supabase = createSupabaseServerClient();
  if (!supabase) return DEFAULT_STORE_INFO;

  const { data, error } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", STORE_CONFIG_KEY)
    .maybeSingle();

  if (error) {
    console.error("[storefront] store info:", error.message);
    return DEFAULT_STORE_INFO;
  }
  return parseStoreInfo(data?.value);
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = createSupabaseServerClient();
  if (!supabase) return buildCategoryTree(FALLBACK_CATEGORY_ROWS);

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_FIELDS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[storefront] categories:", error.message);
    return [];
  }
  return buildCategoryTree((data ?? []) as CategoryRow[]);
});

export type ProductSearchResult = { products: Product[]; total: number };

/**
 * Accent- and case-insensitive product search on name + size. Every word of
 * the query must appear. Super-price products first, then by name.
 */
export async function searchProducts(query: string, limit = 6): Promise<ProductSearchResult> {
  const terms = searchTerms(query).slice(0, 6);
  if (terms.length === 0) return { products: [], total: 0 };

  const supabase = createSupabaseServerClient();
  if (!supabase) return { products: [], total: 0 };

  let request = supabase.from("catalog").select(CATALOG_FIELDS, { count: "exact" });
  for (const term of terms) request = request.ilike("search_key", `%${escapeLike(term)}%`);

  const { data, count, error } = await request
    .order("is_super_price", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[storefront] search:", error.message);
    return { products: [], total: 0 };
  }
  return { products: ((data ?? []) as CatalogRow[]).map(toProduct), total: count ?? data?.length ?? 0 };
}
