// Server-side data access for the storefront.
//
// Every function degrades instead of throwing: if Supabase isn't configured
// (local dev, previews) it serves the demo data in ./fallback; if a query
// fails it logs and returns an empty result, so one bad query never takes the
// whole page down. `cache()` de-duplicates calls within a single request —
// the layout, header and page can all ask for the categories and they're
// fetched once.

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { escapeLike, foldGreek, searchTerms } from "@/lib/greek";
import { FALLBACK_CATEGORY_ROWS, FALLBACK_OFFER_GROUP_ROWS, FALLBACK_PRODUCT_ROWS } from "@/lib/data/fallback";
import {
  buildCategoryTree,
  CATALOG_FIELDS,
  CATEGORY_FIELDS,
  DEFAULT_STORE_INFO,
  OFFER_GROUP_FIELDS,
  parseStoreInfo,
  STORE_CONFIG_KEY,
  toOfferGroup,
  toProduct,
  type CatalogRow,
  type Category,
  type CategoryRow,
  type OfferGroup,
  type OfferGroupRow,
  type Product,
  type StoreInfo,
} from "@/types/catalog";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the site is running on demo data (no Supabase configured). */
export function isDemoMode(): boolean {
  return createSupabaseServerClient() === undefined;
}

/** Ids are uuids in the database and `demo-…` in demo mode; anything else can't exist. */
function isValidId(id: string): boolean {
  return isDemoMode() ? id.startsWith("demo-") : UUID.test(id);
}

// ── Store info ──────────────────────────────────────────────────────────────

export const getStoreInfo = cache(async (): Promise<StoreInfo> => {
  const supabase = createSupabaseServerClient();
  if (!supabase) return DEFAULT_STORE_INFO;

  const { data, error } = await supabase.from("site_config").select("value").eq("key", STORE_CONFIG_KEY).maybeSingle();
  if (error) {
    console.error("[storefront] store info:", error.message);
    return DEFAULT_STORE_INFO;
  }
  return parseStoreInfo(data?.value);
});

// ── Categories & offer groups ───────────────────────────────────────────────

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

export async function getCategory(id: string): Promise<Category | null> {
  return (await getCategories()).find((c) => c.id === id) ?? null;
}

export const getOfferGroups = cache(async (): Promise<OfferGroup[]> => {
  const supabase = createSupabaseServerClient();
  const rows = supabase
    ? await supabase
        .from("offer_groups")
        .select(OFFER_GROUP_FIELDS)
        .order("sort_order", { ascending: true })
        .then(({ data, error }) => {
          if (error) console.error("[storefront] offer groups:", error.message);
          return (data ?? []) as OfferGroupRow[];
        })
    : FALLBACK_OFFER_GROUP_ROWS;
  return rows.map(toOfferGroup).filter((g) => g.isVisible);
});

// ── Products ────────────────────────────────────────────────────────────────

export type ProductSort = "default" | "asc" | "desc";
export type OfferFilter = "any" | "super" | "bogo";

export function toProductSort(value: unknown): ProductSort {
  return value === "asc" || value === "desc" ? value : "default";
}

export function toOfferFilter(value: unknown): OfferFilter {
  return value === "super" || value === "bogo" ? value : "any";
}

export type ProductQuery = {
  /** Top-level category ids (any of). */
  categoryIds?: string[];
  subcategoryId?: string;
  /** Only ΣΟΥΠΕΡ ΤΙΜΗ and/or 1+1 products. Omit for every product. */
  offers?: OfferFilter;
  sort?: ProductSort;
  limit?: number;
};

const DEFAULT_LIMIT = 500;

/** "Suggested" order: offers first (super price, then 1+1), then by name. */
function compareDefault(a: Product, b: Product): number {
  return (
    Number(b.isSuperPrice) - Number(a.isSuperPrice) ||
    Number(b.isBogo) - Number(a.isBogo) ||
    a.name.localeCompare(b.name, "el")
  );
}

export function sortProducts(list: Product[], sort: ProductSort): Product[] {
  const out = [...list];
  if (sort === "asc") out.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name, "el"));
  else if (sort === "desc") out.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name, "el"));
  else out.sort(compareDefault);
  return out;
}

function matchesQuery(p: Product, q: ProductQuery): boolean {
  if (q.categoryIds && !(p.categoryId && q.categoryIds.includes(p.categoryId))) return false;
  if (q.subcategoryId && p.subcategoryId !== q.subcategoryId) return false;
  if (q.offers === "any" && !(p.isSuperPrice || p.isBogo)) return false;
  if (q.offers === "super" && !p.isSuperPrice) return false;
  if (q.offers === "bogo" && !p.isBogo) return false;
  return true;
}

/** Fills in the category picture for products without their own photo. */
async function withCategoryImages(products: Product[]): Promise<Product[]> {
  if (!products.some((p) => !p.imageUrl)) return products;
  const images = new Map((await getCategories()).map((c) => [c.id, c.imageUrl]));
  return products.map((p) => {
    if (p.imageUrl) return p;
    const fallback = p.categoryId ? images.get(p.categoryId) : undefined;
    return fallback ? { ...p, imageUrl: fallback, usesCategoryImage: true } : p;
  });
}

function demoProducts(): Product[] {
  return FALLBACK_PRODUCT_ROWS.map(toProduct).map((p) => ({ ...p, usesCategoryImage: true }));
}

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  const sort = q.sort ?? "default";
  const limit = q.limit ?? DEFAULT_LIMIT;
  const supabase = createSupabaseServerClient();
  if (!supabase) return sortProducts(demoProducts().filter((p) => matchesQuery(p, q)), sort).slice(0, limit);

  if (q.categoryIds && q.categoryIds.length === 0) return [];

  let request = supabase.from("catalog").select(CATALOG_FIELDS);
  if (q.categoryIds) request = request.in("root_category_id", q.categoryIds);
  if (q.subcategoryId) request = request.eq("subcategory_id", q.subcategoryId);
  if (q.offers === "any") request = request.or("is_super_price.eq.true,is_bogo.eq.true");
  if (q.offers === "super") request = request.eq("is_super_price", true);
  if (q.offers === "bogo") request = request.eq("is_bogo", true);

  if (sort === "asc") request = request.order("price", { ascending: true }).order("name", { ascending: true });
  else if (sort === "desc") request = request.order("price", { ascending: false }).order("name", { ascending: true });
  else {
    request = request
      .order("is_super_price", { ascending: false })
      .order("is_bogo", { ascending: false })
      .order("name", { ascending: true });
  }

  const { data, error } = await request.limit(limit);
  if (error) {
    console.error("[storefront] products:", error.message);
    return [];
  }
  return withCategoryImages(((data ?? []) as CatalogRow[]).map(toProduct));
}

export const getProduct = cache(async (id: string): Promise<Product | null> => {
  if (!isValidId(id)) return null;
  const supabase = createSupabaseServerClient();
  if (!supabase) return demoProducts().find((p) => p.id === id) ?? null;

  const { data, error } = await supabase.from("catalog").select(CATALOG_FIELDS).eq("id", id).maybeSingle();
  if (error) {
    console.error("[storefront] product:", error.message);
    return null;
  }
  if (!data) return null;
  const [product] = await withCategoryImages([toProduct(data as CatalogRow)]);
  return product;
});

/** Other products from the same subcategory first, topped up from the category, up to `limit`. */
export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  if (!product.categoryId) return [];
  const same = product.subcategoryId
    ? await getProducts({ categoryIds: [product.categoryId], subcategoryId: product.subcategoryId, limit: limit + 1 })
    : [];
  const out = same.filter((p) => p.id !== product.id);
  if (out.length < limit) {
    const seen = new Set([product.id, ...out.map((p) => p.id)]);
    const wider = await getProducts({ categoryIds: [product.categoryId], limit: limit + seen.size });
    out.push(...wider.filter((p) => !seen.has(p.id)));
  }
  return out.slice(0, limit);
}

// ── Search ──────────────────────────────────────────────────────────────────

export type ProductSearchResult = { products: Product[]; total: number };

/**
 * Search-box suggestions: accent- and case-insensitive match on name + size.
 * Every word of the query must appear. Super-price products first.
 */
export async function searchProducts(query: string, limit = 6): Promise<ProductSearchResult> {
  const terms = searchTerms(query).slice(0, 6);
  if (terms.length === 0) return { products: [], total: 0 };

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    const hits = sortProducts(
      demoProducts().filter((p) => {
        const key = foldGreek(`${p.name} ${p.size ?? ""}`);
        return terms.every((t) => key.includes(t));
      }),
      "default",
    );
    return { products: hits.slice(0, limit), total: hits.length };
  }

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
  const products = await withCategoryImages(((data ?? []) as CatalogRow[]).map(toProduct));
  return { products, total: count ?? products.length };
}

export type CategoryMatch = { categoryId: string; subcategoryId?: string; name: string; parentName?: string };

/** Categories and subcategories whose name contains every word of the query. */
export async function matchCategories(query: string): Promise<CategoryMatch[]> {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];
  const hit = (name: string) => {
    const folded = foldGreek(name);
    return terms.every((t) => folded.includes(t));
  };
  const out: CategoryMatch[] = [];
  for (const c of await getCategories()) {
    if (hit(c.name)) out.push({ categoryId: c.id, name: c.name });
    for (const s of c.subcategories) {
      if (hit(s.name)) out.push({ categoryId: c.id, subcategoryId: s.id, name: s.name, parentName: c.name });
    }
  }
  return out;
}

/**
 * Search results page: products whose name matches, then products in
 * categories whose name matches (so "κατεψυγμένα" lists the frozen aisle).
 */
export async function searchCatalog(query: string, sort: ProductSort): Promise<{ products: Product[]; categories: CategoryMatch[] }> {
  const [byName, categories] = await Promise.all([searchProducts(query, 200), matchCategories(query)]);

  const byCategory: Product[] = [];
  const wholeCategories = categories.filter((c) => !c.subcategoryId).map((c) => c.categoryId);
  const subcategories = categories.filter((c) => c.subcategoryId);
  if (wholeCategories.length > 0) byCategory.push(...(await getProducts({ categoryIds: wholeCategories, limit: 200 })));
  for (const s of subcategories.slice(0, 5)) {
    byCategory.push(...(await getProducts({ categoryIds: [s.categoryId], subcategoryId: s.subcategoryId, limit: 100 })));
  }

  const seen = new Set<string>();
  const merged: Product[] = [];
  for (const p of [...byName.products, ...byCategory]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    merged.push(p);
  }
  // "Suggested" keeps name matches ahead of category matches; price sorts mix them.
  const products = sort === "default" ? merged : sortProducts(merged, sort);
  return { products, categories };
}
