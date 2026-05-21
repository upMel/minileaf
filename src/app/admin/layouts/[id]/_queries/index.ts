"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ProductRow } from "@/types/admin";

type Client = ReturnType<typeof createSupabaseBrowserClient>;

export type LayoutPage = {
  id: string;
  layout_id: string;
  page_order: number;
  template_id: string;
  slots: Record<string, string | null>;
};

export type Layout = {
  id: string;
  name: string;
  orientation: "portrait" | "landscape";
  is_active: boolean;
  pages: LayoutPage[];
};

// ── Queries ───────────────────────────────────────────────────────────────────

export function layoutDetailQueryOptions(layoutId: string | null, isAuthorized: boolean) {
  return queryOptions<Layout>({
    queryKey: ["layout", layoutId],
    queryFn: async () => {
      const res = await fetch(`/api/layouts/${layoutId}`);
      if (!res.ok) throw new Error("Layout not found");
      return res.json() as Promise<Layout>;
    },
    enabled: isAuthorized && !!layoutId,
  });
}

export function activeProductsQueryOptions(supabase: Client, isAuthorized: boolean) {
  return queryOptions<ProductRow[]>({
    queryKey: ["active-products"],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from("products")
        .select("id,name,image_url,is_active")
        .eq("is_active", true)
        .order("name");
      return (data ?? []) as ProductRow[];
    },
    enabled: isAuthorized && !!supabase,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Update layout name or orientation. */
export function useUpdateLayout(layoutId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<Layout, "name" | "orientation">>) =>
      fetch(`/api/layouts/${layoutId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update layout");
        return r.json();
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["layout", layoutId] }),
  });
}

/** Add a new page to the layout. */
export function useAddPage(layoutId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      fetch(`/api/layouts/${layoutId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to add page");
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["layout", layoutId] }),
  });
}

/** Delete a page from the layout. */
export function useDeletePage(layoutId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string) =>
      fetch(`/api/layouts/${layoutId}/pages/${pageId}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete page");
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["layout", layoutId] }),
  });
}

/** Save a page's template + slot assignments. No invalidation — PageEditor manages its own draft state. */
export function useSavePage(layoutId: string | null) {
  return useMutation({
    mutationFn: ({
      pageId,
      templateId,
      slots,
    }: {
      pageId: string;
      templateId: string;
      slots: Record<string, string | null>;
    }) =>
      fetch(`/api/layouts/${layoutId}/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, slots }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to save page");
      }),
  });
}

/** Swap two pages' order values. */
export function useMovePage(layoutId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pages,
      pageId,
      direction,
    }: {
      pages: LayoutPage[];
      pageId: string;
      direction: "up" | "down";
    }) => {
      const sorted = [...pages].sort((a, b) => a.page_order - b.page_order);
      const idx = sorted.findIndex((p) => p.id === pageId);
      if (idx === -1) throw new Error("Page not found");
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sorted.length) throw new Error("Out of bounds");
      const [aOrder, bOrder] = [sorted[idx].page_order, sorted[targetIdx].page_order];
      return Promise.all([
        fetch(`/api/layouts/${layoutId}/pages/${sorted[idx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_order: bOrder }),
        }),
        fetch(`/api/layouts/${layoutId}/pages/${sorted[targetIdx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_order: aOrder }),
        }),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["layout", layoutId] }),
  });
}
