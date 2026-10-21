// Offer groups (Προσφορές page: "Για το σπίτι", "Για το μωρό"…) and the
// categories each one covers. Written with the admin's session (row-level
// security: admins only).

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { OFFER_GROUP_FIELDS, type OfferGroupRow } from "@/types/catalog";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export type OfferGroupRecord = {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  show_subcategories: boolean;
  is_visible: boolean;
  /** In the order they're shown. */
  category_ids: string[];
};

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function listOfferGroups(supabase: Client): Promise<OfferGroupRecord[]> {
  const { data, error } = await supabase.from("offer_groups").select(OFFER_GROUP_FIELDS).order("sort_order").order("name");
  fail(error);
  return ((data ?? []) as OfferGroupRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    image_url: row.image_url,
    sort_order: row.sort_order,
    show_subcategories: row.show_subcategories,
    is_visible: row.is_visible,
    category_ids: [...(row.offer_group_categories ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((c) => c.category_id),
  }));
}

export async function addOfferGroup(supabase: Client, name: string, sortOrder: number): Promise<string> {
  const { data, error } = await supabase
    .from("offer_groups")
    .insert({ name: name.trim(), sort_order: sortOrder, is_visible: true })
    .select("id")
    .single();
  fail(error);
  return data!.id as string;
}

export async function updateOfferGroup(
  supabase: Client,
  id: string,
  patch: { name?: string; image_url?: string | null; is_visible?: boolean; show_subcategories?: boolean },
): Promise<void> {
  const { error } = await supabase.from("offer_groups").update(patch).eq("id", id);
  fail(error);
}

export async function deleteOfferGroup(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("offer_groups").delete().eq("id", id);
  fail(error);
}

/** Replaces the group's categories with `categoryIds`, in that order. */
export async function setOfferGroupCategories(supabase: Client, groupId: string, categoryIds: string[]): Promise<void> {
  const { error } = await supabase.from("offer_group_categories").delete().eq("group_id", groupId);
  fail(error);
  if (categoryIds.length === 0) return;
  const { error: insertError } = await supabase
    .from("offer_group_categories")
    .insert(categoryIds.map((category_id, sort_order) => ({ group_id: groupId, category_id, sort_order })));
  fail(insertError);
}

/** Writes 0…n-1 as sort_order in the given order (only rows that changed). */
export async function reorderOfferGroups(supabase: Client, list: OfferGroupRecord[]): Promise<void> {
  const updates = list
    .map((g, i) => ({ id: g.id, from: g.sort_order, to: i }))
    .filter((u) => u.from !== u.to)
    .map((u) => supabase.from("offer_groups").update({ sort_order: u.to }).eq("id", u.id));
  for (const { error } of await Promise.all(updates)) fail(error);
}
