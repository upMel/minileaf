import Link from "next/link";
import Image from "next/image";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import ThemeToggle from "@/components/ThemeToggle";
import ViewTabs from "@/components/ViewTabs";
import HomeContent from "@/components/HomeContent";
import type { Deal } from "@/components/DealsGrid";
import type { CategoryNode } from "@/components/SearchBar";
import { ViewProvider } from "@/context/ViewContext";

type SupabaseDealRow = {
  product_id: string;
  name: string;
  category: string | null;
  category_id: string | null;
  image_url: string | null;
  competitor_name: string | null;
  competitor_price: number | null;
  regular_price: number;
  effective_price: number;
  promotion_label: string | null;
  effective_percent_off: number | null;
  promotion_type: "PERCENT" | "PRICE" | "BOGO" | null;
  is_bogo: boolean | null;
};

type SupabaseCategoryRow = { id: string; name: string; parent_id: string | null };

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
  { id: "1", name: "Greek yogurt 200g", category: "Dairy", price: 1.99, originalPrice: 3.49, promoLabel: "-43%" },
  { id: "2", name: "Pasta 500g", category: "Dry goods", price: 0.99, originalPrice: 1.89, promoLabel: "-48%" },
  { id: "3", name: "Shampoo 400ml", category: "Personal care", price: 4.5, promoLabel: "1+1" },
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
      .select("product_id,name,category,category_id,image_url,competitor_name,competitor_price,regular_price,effective_price,promotion_label,effective_percent_off,promotion_type,is_bogo")
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
        <header className="shrink-0 border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
          <div className="grid w-full grid-cols-3 items-center px-4 py-3">
            <div className="flex items-center gap-3">
              <Image src="/miniLeaf.png" alt="MiniLeaf" width={36} height={36} className="rounded-xl" priority />
              <h1 className="text-base font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
                Today&apos;s deals
              </h1>
            </div>
            <div className="flex justify-center">
              <ViewTabs />
            </div>
            <div className="flex items-center justify-end gap-3">
              <ThemeToggle />
              <Link
                href="/admin"
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-white/10"
              >
                Owner
              </Link>
            </div>
          </div>
        </header>

        <HomeContent deals={deals} source={source} categoryTree={categoryTree} />
      </div>
    </ViewProvider>
  );
}

