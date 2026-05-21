import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { LAYOUT_TEMPLATES } from "@/lib/layout-templates";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id: layout_id } = await params;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  let body: { template_id?: string; slots?: Record<string, string | null>; page_order?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const template = LAYOUT_TEMPLATES.find((t) => t.id === body.template_id);
  if (!template) return NextResponse.json({ error: "Unknown template_id" }, { status: 400 });

  // Determine page_order: max existing + 1
  const { data: existing } = await supabase
    .from("layout_pages")
    .select("page_order")
    .eq("layout_id", layout_id)
    .order("page_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].page_order as number) + 1 : 0;

  const { data, error } = await supabase
    .from("layout_pages")
    .insert({
      layout_id,
      page_order: body.page_order ?? nextOrder,
      template_id: template.id,
      slots: body.slots ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
