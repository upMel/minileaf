"use client";

import { queryOptions } from "@tanstack/react-query";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchCategories } from "@/services/categories";
import { fetchProducts } from "@/services/products";
import type { CategoryRow, ProductRow } from "@/types/admin";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export const ADMIN_PRODUCTS_KEY = ["admin-products"] as const;

/** Categories for the editor and the list. Shared query key with the categories page. */
export function categoriesQueryOptions(supabase: Client, enabled: boolean) {
  return queryOptions<CategoryRow[]>({
    queryKey: ["categories"],
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
