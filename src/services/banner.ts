// Home-page banner pages (table `banner_pages`), written straight from the
// admin with the signed-in user's session. Row-level security allows writes
// only for admins (see supabase/add_kaimakidis_refactor.sql).

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { BANNER_PAGE_FIELDS, BannerLinkSchema, type BannerPageRow, type BannerSlot } from "@/types/catalog";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export type BannerSlots = Record<string, BannerSlot | null>;

export type BannerPageRecord = {
  id: string;
  page_order: number;
  template_id: string;
  slots: BannerSlots;
  is_visible: boolean;
};

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/**
 * Reads slots for editing. Looser than the storefront's parser: a picture is
 * kept whatever its address, so the admin always sees what's saved (the shop
 * itself only shows https pictures).
 */
function readSlots(value: unknown): BannerSlots {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: BannerSlots = {};
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    const v = raw as Record<string, unknown> | null;
    if (v?.type === "product" && typeof v.product_id === "string") {
      out[id] = { type: "product", product_id: v.product_id };
    } else if (v?.type === "image" && typeof v.image_url === "string") {
      const link = BannerLinkSchema.safeParse(v.link);
      out[id] = {
        type: "image",
        image_url: v.image_url,
        alt: typeof v.alt === "string" ? v.alt : "",
        link: link.success ? link.data : null,
      };
    }
  }
  return out;
}

/** Every page, hidden ones included (admins can read them all). */
export async function listBannerPages(supabase: Client): Promise<BannerPageRecord[]> {
  const { data, error } = await supabase.from("banner_pages").select(BANNER_PAGE_FIELDS).order("page_order").order("created_at");
  fail(error);
  return ((data ?? []) as BannerPageRow[]).map((row) => ({
    id: row.id,
    page_order: row.page_order,
    template_id: row.template_id,
    slots: readSlots(row.slots),
    is_visible: row.is_visible,
  }));
}

export async function addBannerPage(supabase: Client, templateId: string, order: number): Promise<string> {
  const { data, error } = await supabase
    .from("banner_pages")
    .insert({ template_id: templateId, page_order: order, slots: {}, is_visible: true })
    .select("id")
    .single();
  fail(error);
  return data!.id as string;
}

export async function updateBannerPage(
  supabase: Client,
  id: string,
  patch: { template_id?: string; slots?: BannerSlots; is_visible?: boolean },
): Promise<void> {
  const { error } = await supabase.from("banner_pages").update(patch).eq("id", id);
  fail(error);
}

export async function deleteBannerPage(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("banner_pages").delete().eq("id", id);
  fail(error);
}

/** Writes 0…n-1 as page_order in the given order (only rows that changed). */
export async function reorderBannerPages(supabase: Client, pages: BannerPageRecord[]): Promise<void> {
  const updates = pages
    .map((p, i) => ({ id: p.id, from: p.page_order, to: i }))
    .filter((u) => u.from !== u.to)
    .map((u) => supabase.from("banner_pages").update({ page_order: u.to }).eq("id", u.id));
  for (const { error } of await Promise.all(updates)) fail(error);
}
