import { COMPETITOR_S3_URL } from "@/lib/competitor";

export interface CompetitorPrice {
  merchant: string;
  price: number;
}

export interface CompetitorLookupResult {
  name: string | null;
  category: string | null;      // root/parent category name
  sub_category: string | null;  // subcategory name (more specific)
  image_url: string | null;
  prices: CompetitorPrice[];
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode")?.trim();

  if (!barcode) {
    return Response.json({ error: "barcode required" }, { status: 400 });
  }

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

  const result = (data as any)?.context?.MAPP_PRODUCTS?.result;
  if (!result) {
    return Response.json({ name: null, category: null, sub_category: null, image_url: null, prices: [] } satisfies CompetitorLookupResult);
  }

  const merchants: Array<{ merchant_uuid: number; display_name: string }> = result.merchants ?? [];
  const merchantMap = new Map<number, string>(
    merchants.map((m) => [m.merchant_uuid, m.display_name]),
  );

  // Build flat maps: UUID → root name, UUID → sub name
  const categoryMap = new Map<number, string>();
  const subCategoryMap = new Map<number, string>();
  for (const cat of (result.categories as any[]) ?? []) {
    categoryMap.set(cat.uuid as number, cat.name as string);
    for (const sub of (cat.sub_categories as any[]) ?? []) {
      categoryMap.set(sub.uuid as number, cat.name as string);      // sub → parent name
      subCategoryMap.set(sub.uuid as number, sub.name as string);   // sub → sub name
    }
  }

  const product = (result.products as any[]).find((p) => p.barcode === barcode);
  if (!product) {
    return Response.json({ name: null, category: null, sub_category: null, image_url: null, prices: [] } satisfies CompetitorLookupResult);
  }

  const categoryIds: number[] = Array.isArray(product.category) ? product.category : [];
  const category = categoryIds.map((id) => categoryMap.get(id)).find(Boolean) ?? null;
  const sub_category = categoryIds.map((id) => subCategoryMap.get(id)).find(Boolean) ?? null;

  const imgBase: string = (result.img_base_url as string) ?? "";
  const image_url = product.image
    ? imgBase + product.image.split("/").map(encodeURIComponent).join("/")
    : null;

  const prices: CompetitorPrice[] = (product.prices as any[])
    .map((p) => ({
      merchant: merchantMap.get(p.merchant_uuid) ?? String(p.merchant_uuid),
      price: p.price as number,
    }))
    .sort((a, b) => a.price - b.price);

  return Response.json({ name: product.name, category, sub_category, image_url, prices } satisfies CompetitorLookupResult);
}
