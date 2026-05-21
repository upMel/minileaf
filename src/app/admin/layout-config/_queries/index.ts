"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ActiveLayoutConfig } from "@/lib/layout-templates";
import type { ProductRow } from "@/types/admin";

type Client = ReturnType<typeof createSupabaseBrowserClient>;

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Fetches the active layout configuration via the Next.js API route.
 *
 * Why a server-side route instead of Supabase directly: the layout config may
 * need service-role access or server-side business logic that cannot be done
 * with the browser anon key.
 */
export function layoutConfigQueryOptions(isAuthorized: boolean) {
  return queryOptions<ActiveLayoutConfig>({
    queryKey: ["layout-config"],
    queryFn: () => fetch("/api/layout").then((r) => r.json()),
    enabled: isAuthorized,
  });
}

/**
 * Fetches active products directly from Supabase using the browser client.
 *
 * Why Supabase directly instead of an API route: products are readable with the
 * anon key and going straight to Supabase avoids an extra server-side hop,
 * making this faster than routing through a Next.js API route.
 */
export function activeProductsQueryOptions(supabase: Client, isAuthorized: boolean) {
  return queryOptions<ProductRow[]>({
    queryKey: ["active-products"],
    queryFn: async () => {
      const { data } = await supabase!
        .from("products")
        .select("id,name,image_url,is_active")
        .eq("is_active", true)
        .order("name");
      return (data ?? []) as ProductRow[];
    },
    enabled: !!supabase && isAuthorized,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Persist the active layout config via the Next.js API route (POST /api/layout). */
export function useSaveLayoutConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: ActiveLayoutConfig) =>
      fetch("/api/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      }).then((r) => {
        if (!r.ok) throw new Error("Save failed");
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["layout-config"] }),
  });
}
