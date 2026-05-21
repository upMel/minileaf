import { COMPETITOR_S3_URL } from "@/lib/competitor";
import type { RawApiData, RawCat, RawProduct } from "@/types/competitor";

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

  const result = (data as RawApiData)?.context?.MAPP_PRODUCTS?.result;
  if (!result) {
    return Response.json({ name: null, category: null, sub_category: null, image_url: null, prices: [] } satisfies CompetitorLookupResult);
  }

  const merchants = result.merchants ?? [];
  const merchantMap = new Map<number, string>(
    merchants.map((m) => [m.merchant_uuid, m.display_name]),
  );

  // Build flat maps: UUID → root name, UUID → sub name
  const categoryMap = new Map<number, string>();
  const subCategoryMap = new Map<number, string>();
  for (const cat of (result.categories ?? []) as RawCat[]) {
    categoryMap.set(cat.uuid, cat.name);
    for (const sub of cat.sub_categories ?? []) {
      categoryMap.set(sub.uuid, cat.name);   // sub → parent name
      subCategoryMap.set(sub.uuid, sub.name); // sub → sub name
    }
  }

  const product = (result.products ?? [] as RawProduct[]).find((p) => p.barcode === barcode);
  if (!product) {
    return Response.json({ name: null, category: null, sub_category: null, image_url: null, prices: [] } satisfies CompetitorLookupResult);
  }

  const categoryIds: number[] = Array.isArray(product.category) ? product.category : [];
  const category = categoryIds.map((id) => categoryMap.get(id)).find(Boolean) ?? null;
  const sub_category = categoryIds.map((id) => subCategoryMap.get(id)).find(Boolean) ?? null;

  const imgBase: string = result.img_base_url ?? "";
  const image_url = product.image
    ? imgBase + product.image.split("/").map(encodeURIComponent).join("/")
    : null;

  const prices: CompetitorPrice[] = (product.prices ?? [])
    .map((p) => ({
      merchant: merchantMap.get(p.merchant_uuid) ?? String(p.merchant_uuid),
      price: p.price,
    }))
    .sort((a, b) => a.price - b.price);

  return Response.json({ name: product.name, category, sub_category, image_url, prices } satisfies CompetitorLookupResult);
}
