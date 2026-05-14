import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LAYOUT_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  emptyConfig,
  type ActiveLayoutConfig,
} from "@/lib/layout-templates";

const CONFIG_KEY = "active_layout";

function defaultConfig(): ActiveLayoutConfig {
  const template =
    LAYOUT_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID) ??
    LAYOUT_TEMPLATES[0];
  return emptyConfig(template);
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(defaultConfig());
  }

  const { data, error } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", CONFIG_KEY)
    .single();

  if (error || !data) {
    return NextResponse.json(defaultConfig());
  }

  return NextResponse.json(data.value as ActiveLayoutConfig);
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let body: ActiveLayoutConfig;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate templateId exists
  const template = LAYOUT_TEMPLATES.find((t) => t.id === body.templateId);
  if (!template) {
    return NextResponse.json({ error: "Unknown templateId" }, { status: 400 });
  }

  // Validate slot keys — only allow keys that belong to this template
  const validSlotIds = new Set(template.slots.map((s) => s.id));
  const sanitizedSlots: Record<string, string | null> = {};
  for (const [slotId, productId] of Object.entries(body.slots ?? {})) {
    if (validSlotIds.has(slotId)) {
      sanitizedSlots[slotId] = typeof productId === "string" ? productId : null;
    }
  }

  const config: ActiveLayoutConfig = {
    templateId: body.templateId,
    slots: sanitizedSlots,
  };

  const { error } = await supabase.from("site_config").upsert(
    { key: CONFIG_KEY, value: config, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(config);
}
