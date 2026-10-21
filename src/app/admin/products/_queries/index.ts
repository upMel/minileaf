"use client";

import { queryOptions } from "@tanstack/react-query";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchCategories } from "@/services/categories";
import { listOfferGroups, type OfferGroupRecord } from "@/services/offer-groups";
import { fetchProducts } from "@/services/products";
import type { CategoryRow, ProductRow } from "@/types/admin";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export const ADMIN_PRODUCTS_KEY = ["admin-products"] as const;
export const CATEGORIES_KEY = ["categories"] as const;

/** Categories for the editor and the list. Shared query key with the categories page. */
export function categoriesQueryOptions(supabase: Client, enabled: boolean) {
  return queryOptions<CategoryRow[]>({
    queryKey: CATEGORIES_KEY,
    queryFn: async () => {
      const { data, error } = await fetchCategories(supabase);
      if (error) throw new Error(error);
      return data;
    },
    enabled,
  });
}

/** Every product, hidden ones included, newest changes first. */
export function adminProductsQueryOptions(supabase: Client, enabled: boolean) {
  return queryOptions<ProductRow[]>({
    queryKey: ADMIN_PRODUCTS_KEY,
    queryFn: () => fetchProducts(supabase),
    enabled,
  });
}

export const OFFER_GROUPS_KEY = ["offer-groups"] as const;

/** Offer groups (Προσφορές page). Shared by the banner links and the categories page. */
export function offerGroupsQueryOptions(supabase: Client, enabled: boolean) {
  return queryOptions<OfferGroupRecord[]>({
    queryKey: OFFER_GROUPS_KEY,
    queryFn: () => listOfferGroups(supabase),
    enabled,
  });
}
