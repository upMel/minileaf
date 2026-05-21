"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import type { CompetitorCategory } from "@/app/api/competitor-categories/route";
import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  clearAllCategories,
  deleteCategory,
  fetchCategories,
  importCategories,
  insertCategory,
  relinkProductCategories,
  renameCategory,
} from "@/services/categories";
import type { CategoryRow } from "@/types/admin";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

// ── Query ─────────────────────────────────────────────────────────────────────

export function categoriesQueryOptions(supabase: Client, isAuthorized: boolean) {
  return queryOptions<CategoryRow[]>({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(supabase).then((r) => r.data),
    enabled: isAuthorized,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useInsertCategory(supabase: Client) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      insertCategory(supabase, name, parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory(supabase: Client) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(supabase, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useRenameCategory(supabase: Client) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameCategory(supabase, id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useClearAllCategories(supabase: Client) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearAllCategories(supabase),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useSyncCategories(supabase: Client) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ topCount: number; subCount: number; linked: number }> => {
      const res = await fetch("/api/competitor-categories");
      if (!res.ok) throw new Error("Failed to fetch e-katanalotis categories.");
      const tree: CompetitorCategory[] = await res.json();

      // Insert top-level categories first
      const topEntries = tree.map((c, i) => ({
        name: c.name,
        sort_order: i,
        parent_id: null as string | null,
      }));

      const { error: topError } = await importCategories(supabase, topEntries);
      if (topError) throw new Error(topError);

      // Fetch inserted top-level IDs to use as parent IDs for subcategories
      const { data: topRows } = await supabase
        .from("categories")
        .select("id,name")
        .is("parent_id", null);

      const nameToId = new Map<string, string>(
        (topRows ?? []).map((r: { id: string; name: string }) => [r.name, r.id]),
      );

      // Build and insert subcategory entries
      const subEntries: Array<{ name: string; sort_order: number; parent_id: string | null }> = [];
      tree.forEach((cat) => {
        const parentId = nameToId.get(cat.name);
        if (!parentId) return;
        cat.sub_categories.forEach((sub, si) => {
          subEntries.push({ name: sub.name, sort_order: si, parent_id: parentId });
        });
      });

      if (subEntries.length > 0) {
        const { error: subError } = await importCategories(supabase, subEntries);
        if (subError) throw new Error(subError);
      }

      // Relink products whose category text name matches a synced category
      const { linked } = await relinkProductCategories(supabase);

      return { topCount: topEntries.length, subCount: subEntries.length, linked };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
