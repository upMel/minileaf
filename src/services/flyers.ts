// Flyers (tables `layouts` + `layout_pages`), written straight from the admin
// with the signed-in user's session. Row-level security allows writes only
// for admins (see supabase/add_kaimakidis_refactor.sql).

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export type Orientation = "portrait" | "landscape";

export type FlyerSummary = {
  id: string;
  name: string;
  orientation: Orientation;
  is_active: boolean;
  created_at: string;
  pageCount: number;
};

export type FlyerPageRecord = {
  id: string;
  layout_id: string;
  page_order: number;
  kind: "template" | "image";
  template_id: string | null;
  image_url: string | null;
  slots: Record<string, string | null>;
};

export type FlyerDetail = Omit<FlyerSummary, "pageCount"> & { pages: FlyerPageRecord[] };

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function toPage(row: Record<string, unknown>): FlyerPageRecord {
  const slots = row.slots && typeof row.slots === "object" && !Array.isArray(row.slots) ? (row.slots as Record<string, string | null>) : {};
  return {
    id: row.id as string,
    layout_id: row.layout_id as string,
    page_order: Number(row.page_order),
    kind: row.kind === "image" ? "image" : "template",
    template_id: (row.template_id as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    slots,
  };
}

export async function listFlyers(supabase: Client): Promise<FlyerSummary[]> {
  const { data, error } = await supabase
    .from("layouts")
    .select("id,name,orientation,is_active,created_at,layout_pages(count)")
    .order("created_at", { ascending: false });
  fail(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    orientation: row.orientation === "landscape" ? "landscape" : "portrait",
    is_active: row.is_active,
    created_at: row.created_at,
    pageCount: (row.layout_pages as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
}

export async function getFlyer(supabase: Client, id: string): Promise<FlyerDetail> {
  const { data, error } = await supabase
    .from("layouts")
    .select("id,name,orientation,is_active,created_at,layout_pages(id,layout_id,page_order,kind,template_id,image_url,slots)")
    .eq("id", id)
    .single();
  fail(error);
  const pages = ((data!.layout_pages ?? []) as Record<string, unknown>[]).map(toPage).sort((a, b) => a.page_order - b.page_order);
  return {
    id: data!.id,
    name: data!.name,
    orientation: data!.orientation === "landscape" ? "landscape" : "portrait",
    is_active: data!.is_active,
    created_at: data!.created_at,
    pages,
  };
}

export async function createFlyer(supabase: Client, name: string, orientation: Orientation): Promise<string> {
  const { data, error } = await supabase.from("layouts").insert({ name, orientation, is_active: false }).select("id").single();
  fail(error);
  return data!.id as string;
}

export async function updateFlyer(supabase: Client, id: string, patch: { name?: string; orientation?: Orientation }): Promise<void> {
  const { error } = await supabase.from("layouts").update(patch).eq("id", id);
  fail(error);
}

/** Only one flyer is live at a time: switching one on switches the others off. */
export async function setFlyerActive(supabase: Client, id: string, active: boolean): Promise<void> {
  if (active) {
    const { error } = await supabase.from("layouts").update({ is_active: false }).neq("id", id).eq("is_active", true);
    fail(error);
  }
  const { error } = await supabase.from("layouts").update({ is_active: active }).eq("id", id);
  fail(error);
}

export async function deleteFlyer(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from("layouts").delete().eq("id", id);
  fail(error);
}

export async function addFlyerPage(
  supabase: Client,
  layoutId: string,
  page: { kind: "template"; template_id: string } | { kind: "image"; image_url: string },
  afterOrder: number,
): Promise<string> {
  const { data, error } = await supabase
    .from("layout_pages")
    .insert({ layout_id: layoutId, page_order: afterOrder + 1, slots: {}, ...page })
    .select("id")
    .single();
  fail(error);
  return data!.id as string;
}

export async function updateFlyerPage(
  supabase: Client,
  pageId: string,
  patch: { template_id?: string; slots?: Record<string, string | null>; image_url?: string },
): Promise<void> {
  const { error } = await supabase.from("layout_pages").update(patch).eq("id", pageId);
  fail(error);
}

export async function deleteFlyerPage(supabase: Client, pageId: string): Promise<void> {
  const { error } = await supabase.from("layout_pages").delete().eq("id", pageId);
  fail(error);
}

/** Writes 0…n-1 as page_order in the given order (only rows that changed). */
export async function reorderFlyerPages(supabase: Client, pages: FlyerPageRecord[]): Promise<void> {
  const updates = pages
    .map((p, i) => ({ id: p.id, from: p.page_order, to: i }))
    .filter((u) => u.from !== u.to)
    .map((u) => supabase.from("layout_pages").update({ page_order: u.to }).eq("id", u.id));
  for (const { error } of await Promise.all(updates)) fail(error);
}
