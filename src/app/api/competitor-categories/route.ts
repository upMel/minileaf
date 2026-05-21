import { COMPETITOR_S3_URL } from "@/lib/competitor";
import type { RawApiData, RawCat } from "@/types/competitor";

export interface CompetitorSubCategory {
  uuid: number;
  name: string;
}

export interface CompetitorCategory {
  uuid: number;
  name: string;
  sub_categories: CompetitorSubCategory[];
}

export async function GET(): Promise<Response> {
  let data: unknown;
  try {
    const res = await fetch(COMPETITOR_S3_URL, { cache: "no-store" });
    if (!res.ok) {
      return Response.json({ error: "upstream error" }, { status: 502 });
    }
    data = await res.json();
  } catch {
    return Response.json({ error: "fetch failed" }, { status: 502 });
  }

  const raw: RawCat[] = (data as RawApiData)?.context?.MAPP_PRODUCTS?.result?.categories ?? [];

  const categories: CompetitorCategory[] = raw.map((c) => ({
    uuid: c.uuid,
    name: c.name,
    sub_categories: Array.isArray(c.sub_categories)
      ? c.sub_categories.map((s) => ({ uuid: s.uuid, name: s.name }))
      : [],
  }));

  return Response.json(categories);
}
