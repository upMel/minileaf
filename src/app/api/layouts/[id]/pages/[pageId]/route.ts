import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { LAYOUT_TEMPLATES } from "@/lib/layout-templates";

type Params = { params: Promise<{ id: string; pageId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { pageId } = await params;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  let body: { template_id?: string; slots?: Record<string, string | null>; page_order?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (body.template_id !== undefined) {
    const template = LAYOUT_TEMPLATES.find((t) => t.id === body.template_id);
    if (!template) return NextResponse.json({ error: "Unknown template_id" }, { status: 400 });
    patch.template_id = template.id;
  }
  if (body.slots !== undefined) patch.slots = body.slots;
  if (typeof body.page_order === "number") patch.page_order = body.page_order;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("layout_pages")
    .update(patch)
    .eq("id", pageId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { pageId } = await params;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const { error } = await supabase.from("layout_pages").delete().eq("id", pageId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
