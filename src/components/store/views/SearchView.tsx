"use client";

import Link from "next/link";

import { useT } from "@/context/LanguageContext";
import type { CategoryMatch, ProductSort } from "@/lib/data/storefront";
import { routes } from "@/lib/routes";
import type { Product } from "@/types/catalog";

import EmptyState from "../EmptyState";
import { ProductGrid } from "../ProductCard";
import SortSelect from "../SortSelect";

type Props = { query: string; products: Product[]; categories: CategoryMatch[]; sort: ProductSort };

export default function SearchView({ query, products, categories, sort }: Props) {
  const t = useT().store;
  const s = t.searchPage;

  if (!query) {
    return (
      <div className="ks-page-gap">
        <EmptyState title={s.promptTitle} text={s.promptText} action={{ href: routes.home(), label: s.allCategories }} />
      </div>
    );
  }

  return (
    <>
      <div className="ks-page-head ks-page-gap">
        <div>
          <h1 className="ks-page-title">{s.title(query)}</h1>
          <p className="ks-count">{t.products.count(products.length)}</p>
        </div>
        {products.length > 1 && <SortSelect value={sort} />}
      </div>

      {categories.length > 0 && (
        <div className="ks-chips" role="group" aria-label={s.matchingCategories}>
          {categories.slice(0, 8).map((c) => (
            <Link key={c.subcategoryId ?? c.categoryId} href={routes.category(c.categoryId, c.subcategoryId)}>
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState title={s.emptyTitle} text={s.emptyText} action={{ href: routes.home(), label: s.allCategories }} />
      )}
    </>
  );
}
