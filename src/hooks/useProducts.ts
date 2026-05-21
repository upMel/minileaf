import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  deleteProduct,
  fetchProducts,
  toggleProductActive,
} from "@/services/products";
import { fetchPromotionsForProducts } from "@/services/promotions";
import type { ProductRow, PromotionRow } from "@/types/admin";

type Client = ReturnType<typeof createSupabaseBrowserClient>;

export function useProducts(supabase: Client, enabled: boolean) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data: rows, error: fetchError } = await fetchProducts(supabase!);
      if (fetchError) throw new Error(fetchError);
      const { data: promos } = await fetchPromotionsForProducts(
        supabase!,
        rows.map((p) => p.id)
      );
      return { products: rows, promotionsByProductId: promos };
    },
    enabled: !!supabase && enabled,
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  const toggleActiveMutation = useMutation({
    mutationFn: async (p: ProductRow) => {
      if (!supabase) return;
      const { error: err } = await toggleProductActive(supabase, p.id, !p.is_active);
      if (err) throw new Error(err);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  // Preserve { error: string | null } return shape so existing callers destructure safely.
  const deactivateMutation = useMutation({
    mutationFn: (id: string): Promise<{ error: string | null }> => {
      if (!supabase) return Promise.resolve({ error: null });
      return toggleProductActive(supabase, id, false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string): Promise<{ error: string | null }> => {
      if (!supabase) return Promise.resolve({ error: null });
      return deleteProduct(supabase, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  return {
    products: enabled ? (data?.products ?? []) : [],
    promotionsByProductId: enabled
      ? (data?.promotionsByProductId ?? ({} as Record<string, PromotionRow | undefined>))
      : ({} as Record<string, PromotionRow | undefined>),
    isLoading,
    error: error ? error.message : null,
    refresh,
    toggleActive: (p: ProductRow) => toggleActiveMutation.mutateAsync(p),
    deactivate: (id: string) => deactivateMutation.mutateAsync(id),
    remove: (id: string) => removeMutation.mutateAsync(id),
  };
}
