import { NextResponse, type NextRequest } from "next/server";

import { searchProducts } from "@/lib/data/storefront";

const MAX_QUERY_LENGTH = 80;

/** Search-box suggestions: GET /api/search?q=γάλα → { products, total }. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, MAX_QUERY_LENGTH);
  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 12 ? limitParam : 6;

  const result = await searchProducts(q, limit);
  return NextResponse.json(result, {
    // Prices change rarely; a short private cache keeps typing snappy.
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
