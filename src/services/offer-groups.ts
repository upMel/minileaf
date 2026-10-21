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
