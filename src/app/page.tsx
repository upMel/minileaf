import Link from "next/link";

type Deal = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  promoLabel?: string;
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

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="sticky top-0 border-b border-black/10 bg-white/90 backdrop-blur dark:border-white/15 dark:bg-black/80">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              MiniLeaf
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
              Today&apos;s deals
            </h1>
          </div>
          <Link
            href="/admin"
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/10"
          >
            Owner
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        {demoDeals.map((deal) => (
          <article
            key={deal.id}
            className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-black"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-black dark:text-zinc-50">
                  {deal.name}
                </h2>
                {deal.promoLabel ? (
                  <span className="rounded-full border border-black/10 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:border-white/15 dark:text-zinc-200">
                    {deal.promoLabel}
                  </span>
                ) : null}
              </div>
              {deal.originalPrice ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="line-through">{formatEUR(deal.originalPrice)}</span>
                  <span className="ml-2">Now</span>
                </div>
              ) : (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Special offer</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-black dark:text-zinc-50">
                {formatEUR(deal.price)}
              </div>
            </div>
          </article>
        ))}

        <p className="pt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Demo data for now. Next step: connect to Supabase so the owner can upload real
          products and promotions.
        </p>
      </main>
    </div>
  );
}
