import { useCallback, useEffect, useState } from "react";

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
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [promotionsByProductId, setPromotionsByProductId] = useState<
    Record<string, PromotionRow | undefined>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    setError(null);

    const { data: rows, error: fetchError } = await fetchProducts(supabase);
    if (fetchError) {
      setError(fetchError);
      setProducts([]);
      setPromotionsByProductId({});
      setIsLoading(false);
      return;
    }

    setProducts(rows);
    const { data: promos } = await fetchPromotionsForProducts(
      supabase,
      rows.map((p) => p.id)
    );
    setPromotionsByProductId(promos);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!enabled) {
      setProducts([]);
      setPromotionsByProductId({});
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  async function toggleActive(p: ProductRow) {
    if (!supabase) return;
    const { error: err } = await toggleProductActive(supabase, p.id, !p.is_active);
    if (err) setError(err);
    else await refresh();
  }

  async function deactivate(id: string): Promise<{ error: string | null }> {
    if (!supabase) return { error: null };
    const result = await toggleProductActive(supabase, id, false);
    if (!result.error) await refresh();
    return result;
  }

  async function remove(id: string): Promise<{ error: string | null }> {
    if (!supabase) return { error: null };
    const result = await deleteProduct(supabase, id);
    if (!result.error) await refresh();
    return result;
  }

  return {
    products,
    promotionsByProductId,
    isLoading,
    error,
    refresh,
    toggleActive,
    deactivate,
    remove,
  };
}
