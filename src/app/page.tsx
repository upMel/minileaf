import Link from "next/link";
import Image from "next/image";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import ThemeToggle from "@/components/ThemeToggle";
import ViewDropdown from "@/components/ViewDropdown";

type Deal = {
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  promoLabel?: string;
  competitorName?: string;
  competitorPrice?: number;
};

type SupabaseDealRow = {
  product_id: string;
  name: string;
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

const demoDeals: Deal[] = [
  {
    id: "1",
    name: "Greek yogurt 200g",
    price: 1.99,
    originalPrice: 3.49,
    promoLabel: "-43%",
  },
  {
    id: "2",
    name: "Pasta 500g",
    price: 0.99,
    originalPrice: 1.89,
    promoLabel: "-48%",
  },
  {
    id: "3",
    name: "Shampoo 400ml",
    price: 4.5,
    promoLabel: "1+1",
  },
];

function formatEUR(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function mapPromoLabel(row: SupabaseDealRow): string | undefined {
  if (row.promotion_label) return row.promotion_label;
  if (row.promotion_type === "BOGO" || row.is_bogo) return "1+1";
  if (typeof row.effective_percent_off === "number") return `-${row.effective_percent_off}%`;
  return undefined;
}

async function getDeals(): Promise<{ deals: Deal[]; source: "demo" | "supabase" }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { deals: demoDeals, source: "demo" };

  const { data, error } = await supabase
    .from("deals")
    .select(
      "product_id,name,image_url,competitor_name,competitor_price,regular_price,effective_price,promotion_label,effective_percent_off,promotion_type,is_bogo"
    )
    .order("effective_percent_off", { ascending: false, nullsFirst: false })
    .limit(100);

  if (error || !data) return { deals: demoDeals, source: "demo" };

  const deals = (data as SupabaseDealRow[]).map((row) => ({
    id: row.product_id,
    name: row.name,
    imageUrl: row.image_url ?? undefined,
    price: Number(row.effective_price),
    originalPrice:
      row.effective_price !== row.regular_price ? Number(row.regular_price) : undefined,
    promoLabel: mapPromoLabel(row),
    competitorName: row.competitor_name ?? undefined,
    competitorPrice:
      typeof row.competitor_price === "number" ? Number(row.competitor_price) : undefined,
  }));

  return { deals, source: "supabase" };
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const { deals, source } = await getDeals();

  return (
    <div className="flex flex-1 flex-col bg-page font-sans">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto flex w-full items-center justify-between px-4 py-3"> 
          {/* used to be max-w-5xl but i removed it to make the header full-bleed like the rest of the page */}
          {/* Left: logo + title + view picker */}
          <div className="flex items-center gap-3">
            <Image
              src="/icon-192.png"
              alt="MiniLeaf"
              width={36}
              height={36}
              className="rounded-xl"
              priority
            />
            <div className="flex flex-col">
              <h1 className="text-base font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
                Today&apos;s deals
              </h1>
              <ViewDropdown />
            </div>
          </div>

          {/* Right: theme toggle + owner link */}
          <div className="flex items-center gap-3">
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <article
              key={deal.id}
              className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/15"
            >
              {deal.imageUrl ? (
                <img
                  src={deal.imageUrl}
                  alt={deal.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full bg-white object-contain"
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-50" />
              )}

              <div className="absolute inset-0 bg-white/10" />

              <div className="relative flex h-full flex-col justify-between p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="inline-flex max-w-full items-start gap-2 rounded-xl border border-black/10 bg-white/80 px-3 py-2 backdrop-blur dark:border-white/15">
                      <h2 className="truncate text-sm font-semibold leading-snug text-black">
                        {deal.name}
                      </h2>
                      {deal.promoLabel ? (
                        <span className="shrink-0 rounded-full bg-badge px-2 py-0.5 text-xs font-semibold">
                          {deal.promoLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="ml-auto shrink-0 flex flex-col items-end gap-2">
                    <div className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-right text-black backdrop-blur dark:border-white/15">
                      <div className="text-2xl font-semibold leading-none text-accent">{formatEUR(deal.price)}</div>

                      {typeof deal.competitorPrice === "number" ? (
                        <div className="mt-1 text-xs text-zinc-600">
                          <span className="block max-w-[90px] truncate">
                            {deal.competitorName ? deal.competitorName : "Competitor"}
                          </span>
                          <span className="line-through decoration-2 decoration-black/30 opacity-60">
                            {formatEUR(deal.competitorPrice)}
                          </span>
                        </div>
                      ) : null}

                      {deal.originalPrice ? (
                        <div className="mt-1 text-xs text-zinc-600">
                          was {formatEUR(deal.originalPrice)}
                        </div>
                      ) : null}
                    </div>

                    {/* promoLabel is shown in the top-left title chip */}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <p className="pt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {source === "demo"
            ? "Demo data for now. Add Supabase env vars to load real deals."
            : "Loaded from Supabase."}
        </p>
      </main>
    </div>
  );
}
