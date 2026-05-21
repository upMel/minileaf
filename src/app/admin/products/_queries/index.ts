"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchCategories } from "@/services/categories";
import { deleteProduct, fetchProducts, toggleProductActive } from "@/services/products";
import { fetchPromotionsForProducts } from "@/services/promotions";
import type { CategoryRow, ProductRow, PromotionRow } from "@/types/admin";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

// ── Queries ───────────────────────────────────────────────────────────────────

/** Categories for the product form dropdown. Shared query key with the categories page. */
export function categoriesQueryOptions(supabase: Client, isAuthorized: boolean) {
  return queryOptions<CategoryRow[]>({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(supabase).then((r) => r.data),
    enabled: isAuthorized,
  });
}

/** Products list with promotions. Mirrors the logic in useProducts.ts. */
export function productsQueryOptions(supabase: Client, enabled: boolean) {
  return queryOptions<{ products: ProductRow[]; promotionsByProductId: Record<string, PromotionRow | undefined> }>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data: rows, error: fetchError } = await fetchProducts(supabase);
      if (fetchError) throw new Error(fetchError);
      const { data: promos } = await fetchPromotionsForProducts(supabase, rows.map((p) => p.id));
      return { products: rows, promotionsByProductId: promos };
    },
    enabled,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useToggleProductActive(supabase: Client) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (p: ProductRow) => toggleProductActive(supabase, p.id, !p.is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeactivateProduct(supabase: Client) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleProductActive(supabase, id, false),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct(supabase: Client) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(supabase, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}
