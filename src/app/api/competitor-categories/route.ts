import { COMPETITOR_S3_URL } from "@/lib/competitor";

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
    const res = await fetch(COMPETITOR_S3_URL, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return Response.json({ error: "upstream error" }, { status: 502 });
    }
    data = await res.json();
  } catch {
    return Response.json({ error: "fetch failed" }, { status: 502 });
  }

  const raw: any[] = (data as any)?.context?.MAPP_PRODUCTS?.result?.categories ?? [];

  const categories: CompetitorCategory[] = raw.map((c) => ({
    uuid: c.uuid as number,
    name: c.name as string,
    sub_categories: Array.isArray(c.sub_categories)
      ? (c.sub_categories as any[]).map((s) => ({ uuid: s.uuid as number, name: s.name as string }))
      : [],
  }));

  return Response.json(categories);
}
