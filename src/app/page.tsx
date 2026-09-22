import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toPriceUnit } from "@/lib/price";
import HomeContent from "@/components/home/HomeContent";
import HomeHeader from "@/components/home/HomeHeader";
import type { Deal, CategoryNode, SupabaseDealRow, SupabaseCategoryRow } from "@/types/deals";
import { ViewProvider } from "@/context/ViewContext";

function buildCategoryTree(rows: SupabaseCategoryRow[]): CategoryNode[] {
  const roots = rows.filter((r) => r.parent_id === null);
  return roots.map((root) => ({
    id: root.id,
    name: root.name,
    children: rows
      .filter((r) => r.parent_id === root.id)
      .map((sub) => ({ id: sub.id, name: sub.name, children: [] })),
  }));
}

const demoDeals: Deal[] = [
  { id: "1", name: "Greek yogurt 200g", category: "Dairy", price: 1.99, priceUnit: "piece", originalPrice: 3.49, promoLabel: "-43%" },
  { id: "2", name: "Pasta 500g", category: "Dry goods", price: 0.99, priceUnit: "piece", originalPrice: 1.89, promoLabel: "-48%" },
  { id: "3", name: "Tomatoes", category: "Produce", price: 1.49, priceUnit: "kg", originalPrice: 2.2, promoLabel: "-32%" },
];

function mapPromoLabel(row: SupabaseDealRow): string | undefined {
  if (row.promotion_label) return row.promotion_label;
  if (row.promotion_type === "BOGO" || row.is_bogo) return "1+1";
  if (typeof row.effective_percent_off === "number") return `-${row.effective_percent_off}%`;
  return undefined;
}

async function getPageData(): Promise<{ deals: Deal[]; categoryTree: CategoryNode[]; source: "demo" | "supabase" }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { deals: demoDeals, categoryTree: [], source: "demo" };

  const [dealsResult, catsResult] = await Promise.all([
    supabase
      .from("deals")
      .select("product_id,name,description,price_unit,category,category_id,image_url,competitor_name,competitor_price,regular_price,effective_price,promotion_label,effective_percent_off,promotion_type,is_bogo")
      .order("effective_percent_off", { ascending: false, nullsFirst: false })
      .limit(100),
    supabase
      .from("categories")
      .select("id,name,parent_id")
      .order("sort_order", { ascending: true }),
  ]);

  if (dealsResult.error || !dealsResult.data) return { deals: demoDeals, categoryTree: [], source: "demo" };

  const deals = (dealsResult.data as SupabaseDealRow[]).map((row) => ({
    id: row.product_id,
    name: row.name,
    description: row.description ?? undefined,
    priceUnit: toPriceUnit(row.price_unit),
    categoryId: row.category_id ?? undefined,
    category: row.category ?? undefined,
    imageUrl: row.image_url ?? undefined,
    price: Number(row.effective_price),
    originalPrice: row.effective_price !== row.regular_price ? Number(row.regular_price) : undefined,
    promoLabel: mapPromoLabel(row),
    competitorName: row.competitor_name ?? undefined,
    competitorPrice: typeof row.competitor_price === "number" ? Number(row.competitor_price) : undefined,
  }));

  const categoryTree = buildCategoryTree((catsResult.data ?? []) as SupabaseCategoryRow[]);
  return { deals, categoryTree, source: "supabase" };
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const { deals, categoryTree, source } = await getPageData();

  return (
    <ViewProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-page font-sans">
        <HomeHeader />

        <HomeContent deals={deals} source={source} categoryTree={categoryTree} />
      </div>
    </ViewProvider>
  );
}

