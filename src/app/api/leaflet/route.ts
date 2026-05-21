import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json(null);

  const { data: layout, error } = await supabase
    .from("layouts")
    .select("id, name, orientation")
    .eq("is_active", true)
    .single();

  if (error || !layout) return NextResponse.json(null);

  const { data: pages } = await supabase
    .from("layout_pages")
    .select("id, page_order, template_id, slots")
    .eq("layout_id", layout.id)
    .order("page_order", { ascending: true });

  return NextResponse.json({ ...layout, pages: pages ?? [] });
}
