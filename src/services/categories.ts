import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { CategoryRow } from "@/types/admin";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export async function fetchCategories(
  supabase: Client,
): Promise<{ data: CategoryRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,parent_id,sort_order")
    .order("sort_order")
    .order("name");
  if (error || !data) return { data: [], error: error?.message ?? "Failed to load categories." };
  return { data: data as CategoryRow[], error: null };
}

export async function insertCategory(
  supabase: Client,
  name: string,
  parentId?: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("categories")
    .insert({ name: name.trim(), parent_id: parentId ?? null });
  return { error: error?.message ?? null };
}

export async function deleteCategory(
  supabase: Client,
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function renameCategory(
  supabase: Client,
  id: string,
  name: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("categories").update({ name: name.trim() }).eq("id", id);
  return { error: error?.message ?? null };
}

/** Import a list of {name, parentId?} pairs — skips names that already exist at the same level. */
export async function importCategories(
  supabase: Client,
  entries: Array<{ name: string; sort_order: number; parent_id: string | null }>,
): Promise<{ error: string | null }> {
  if (entries.length === 0) return { error: null };

  // Fetch existing names to avoid duplicates
  const { data: existing } = await supabase.from("categories").select("name,parent_id");
  const existingSet = new Set(
    (existing ?? []).map(
      (c: { name: string; parent_id: string | null }) =>
        `${c.name.toLowerCase()}::${c.parent_id ?? ""}`,
    ),
  );

  const toInsert = entries.filter(
    (e) => !existingSet.has(`${e.name.toLowerCase()}::${e.parent_id ?? ""}`),
  );

  if (toInsert.length === 0) return { error: null };

  const { error } = await supabase.from("categories").insert(toInsert);
  return { error: error?.message ?? null };
}

/**
 * Remove all categories. Nulls out products.category_id first to satisfy the
 * FK RESTRICT constraint, then deletes root categories (cascades to children).
 */
export async function clearAllCategories(supabase: Client): Promise<{ error: string | null }> {
  const { error: unlinkErr } = await supabase
    .from("products")
    .update({ category_id: null })
    .not("category_id", "is", null);
  if (unlinkErr) return { error: unlinkErr.message };

  const { error } = await supabase.from("categories").delete().is("parent_id", null);
  return { error: error?.message ?? null };
}
