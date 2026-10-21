// Catalogue categories (table `categories`: top level + one level of
// subcategories), written with the admin's session (row-level security:
// admins only). Products point at a category or a subcategory; the database
// refuses to delete a category that still has products.

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { CategoryRow } from "@/types/admin";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

/** Postgres error codes the admin turns into plain messages. */
export const FK_VIOLATION = "23503";
export const UNIQUE_VIOLATION = "23505";

export class CategoryError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

function fail(error: { message: string; code?: string } | null): void {
  if (error) throw new CategoryError(error.message, error.code);
}

export async function fetchCategories(supabase: Client): Promise<{ data: CategoryRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,parent_id,sort_order,image_url")
    .order("sort_order")
    .order("name");
  if (error || !data) return { data: [], error: error?.message ?? "Failed to load categories." };
  return { data: data as CategoryRow[], error: null };
}

/** Adds a category (or a subcategory when `parentId` is given) at the end; returns its id. */
export async function addCategory(supabase: Client, name: string, parentId: string | null, sortOrder: number): Promise<string> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: name.trim(), parent_id: parentId, sort_order: sortOrder })
    .select("id")
    .single();
  fail(error);
  return data!.id as string;
}

export async function updateCategory(
  supabase: Client,
  id: string,
  patch: { name?: string; image_url?: string | null },
): Promise<void> {
  const { error } = await supabase.from("categories").update(patch).eq("id", id);
  fail(error);
}

/** Deletes a category and its subcategories. Fails with FK_VIOLATION while products still use them. */
export async function deleteCategory(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  fail(error);
}

/** Writes 0…n-1 as sort_order in the given order (only rows that changed). */
export async function reorderCategories(supabase: Client, list: CategoryRow[]): Promise<void> {
  const updates = list
    .map((c, i) => ({ id: c.id, from: c.sort_order, to: i }))
    .filter((u) => u.from !== u.to)
    .map((u) => supabase.from("categories").update({ sort_order: u.to }).eq("id", u.id));
  for (const { error } of await Promise.all(updates)) fail(error);
}

// ── e-katanalotis sync ──────────────────────────────────────────────────────

/** Inserts the names that don't exist yet at the same level; returns how many were added. */
async function importCategories(
  supabase: Client,
  entries: Array<{ name: string; sort_order: number; parent_id: string | null }>,
): Promise<number> {
  if (entries.length === 0) return 0;
  const { data: existing, error } = await supabase.from("categories").select("name,parent_id");
  fail(error);
  const seen = new Set(
    (existing ?? []).map((c: { name: string; parent_id: string | null }) => `${c.name.toLowerCase()}::${c.parent_id ?? ""}`),
  );
  const toInsert = entries.filter((e) => !seen.has(`${e.name.toLowerCase()}::${e.parent_id ?? ""}`));
  if (toInsert.length === 0) return 0;
  const { error: insertError } = await supabase.from("categories").insert(toInsert);
  fail(insertError);
  return toInsert.length;
}

/** Products that only have the old text `category` get the matching category id. */
async function relinkProductCategories(supabase: Client): Promise<number> {
  const { data: orphans, error } = await supabase
    .from("products")
    .select("id,category")
    .is("category_id", null)
    .not("category", "is", null);
  fail(error);
  if (!orphans || orphans.length === 0) return 0;

  const { data: cats, error: catError } = await supabase.from("categories").select("id,name");
  fail(catError);
  const nameToId = new Map((cats ?? []).map((c: { id: string; name: string }) => [c.name.toLowerCase(), c.id]));

  const updates = (orphans as Array<{ id: string; category: string | null }>).flatMap((p) => {
    const categoryId = p.category ? nameToId.get(p.category.toLowerCase()) : undefined;
    return categoryId ? [{ id: p.id, category_id: categoryId }] : [];
  });
  await Promise.all(updates.map((u) => supabase.from("products").update({ category_id: u.category_id }).eq("id", u.id)));
  return updates.length;
}

type CompetitorTree = Array<{ name: string; sub_categories: Array<{ name: string }> }>;

/**
 * Adds the e-katanalotis categories and subcategories that are missing here.
 * Never renames, moves or deletes anything the shop already has.
 */
export async function syncCategoriesFromCompetitor(supabase: Client): Promise<{ added: number; linked: number }> {
  const res = await fetch("/api/competitor-categories");
  if (!res.ok) throw new Error(`e-katanalotis: ${res.status}`);
  const tree = (await res.json()) as CompetitorTree;

  const { data: roots, error } = await supabase.from("categories").select("id,name,sort_order").is("parent_id", null);
  fail(error);
  const start = (roots ?? []).reduce((max, r: { sort_order: number }) => Math.max(max, r.sort_order), -1) + 1;
  let added = await importCategories(
    supabase,
    tree.map((c, i) => ({ name: c.name, sort_order: start + i, parent_id: null })),
  );

  const { data: topRows, error: topError } = await supabase.from("categories").select("id,name").is("parent_id", null);
  fail(topError);
  const idByName = new Map((topRows ?? []).map((r: { id: string; name: string }) => [r.name.toLowerCase(), r.id]));
  const subs = tree.flatMap((c) => {
    const parentId = idByName.get(c.name.toLowerCase());
    return parentId ? c.sub_categories.map((s, i) => ({ name: s.name, sort_order: i, parent_id: parentId })) : [];
  });
  added += await importCategories(supabase, subs);

  return { added, linked: await relinkProductCategories(supabase) };
}
