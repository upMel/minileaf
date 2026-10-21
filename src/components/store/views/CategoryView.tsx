"use client";

import Link from "next/link";

import { useT } from "@/context/LanguageContext";
import type { ProductSort } from "@/lib/data/storefront";
import { routes } from "@/lib/routes";
import type { Category, Product } from "@/types/catalog";

import EmptyState from "../EmptyState";
import { ProductGrid } from "../ProductCard";
import SortSelect from "../SortSelect";
import { useCenterActiveChip } from "../useCenterActiveChip";

type Props = {
  category: Category;
  subcategoryId?: string;
  products: Product[];
  sort: ProductSort;
};

/** Category page: breadcrumb, title + sort, subcategory chips, products. */
export default function CategoryView({ category, subcategoryId, products, sort }: Props) {
  const t = useT().store.category;
  const sub = category.subcategories.find((s) => s.id === subcategoryId);
  const chipsRef = useCenterActiveChip<HTMLDivElement>(subcategoryId ?? "all");

  return (
    <>
      <nav className="ks-crumbs" aria-label={t.breadcrumbLabel}>
        <Link href={routes.home()}>{t.root}</Link>
        <span aria-hidden="true">›</span>
        {sub ? (
          <>
            <Link href={routes.category(category.id)}>{category.name}</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{sub.name}</span>
          </>
        ) : (
          <span aria-current="page">{category.name}</span>
        )}
      </nav>

      <div className="ks-page-head">
        <h1 className="ks-page-title">{sub?.name ?? category.name}</h1>
        {products.length > 1 && <SortSelect value={sort} />}
      </div>

      {category.subcategories.length > 0 && (
        <div className="ks-chips" role="group" aria-label={t.subcategoriesLabel} ref={chipsRef}>
          <Link href={routes.category(category.id)} aria-current={!sub ? "page" : undefined} scroll={false}>
            {t.allProducts}
          </Link>
          {category.subcategories.map((s) => (
            <Link
              key={s.id}
              href={routes.category(category.id, s.id)}
              aria-current={s.id === sub?.id ? "page" : undefined}
              scroll={false}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState
          title={t.emptyTitle}
          text={t.emptyText}
          action={sub ? { href: routes.category(category.id), label: t.emptyButton } : undefined}
        />
      )}
    </>
  );
}
