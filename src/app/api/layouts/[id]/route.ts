import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const [layoutRes, pagesRes] = await Promise.all([
    supabase.from("layouts").select("*").eq("id", id).single(),
    supabase
      .from("layout_pages")
      .select("*")
      .eq("layout_id", id)
      .order("page_order", { ascending: true }),
  ]);

  if (layoutRes.error) return NextResponse.json({ error: layoutRes.error.message }, { status: 404 });
  return NextResponse.json({ ...layoutRes.data, pages: pagesRes.data ?? [] });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  let body: { name?: string; orientation?: string; is_active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // If activating this layout, deactivate all others first
  if (body.is_active === true) {
    await supabase.from("layouts").update({ is_active: false }).neq("id", id);
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (body.orientation === "portrait" || body.orientation === "landscape") patch.orientation = body.orientation;
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("layouts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const { error } = await supabase.from("layouts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
