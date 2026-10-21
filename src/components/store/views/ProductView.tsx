"use client";

import Image from "next/image";
import Link from "next/link";

import { useT } from "@/context/LanguageContext";
import { routes } from "@/lib/routes";
import type { Category, Product } from "@/types/catalog";

import { OfferBadges, ProductGrid, usePrice } from "../ProductCard";

type Props = { product: Product; category: Category | null; related: Product[] };

/** Product page: big photo, name, size, badges, price, description, related. */
export default function ProductView({ product, category, related }: Props) {
  const t = useT().store;
  const price = usePrice();
  const sub = category?.subcategories.find((s) => s.id === product.subcategoryId);

  return (
    <>
      <nav className="ks-crumbs" aria-label={t.category.breadcrumbLabel}>
        <Link href={routes.home()}>{t.category.root}</Link>
        {category && (
          <>
            <span aria-hidden="true">›</span>
            <Link href={routes.category(category.id)}>{category.name}</Link>
          </>
        )}
        {category && sub && (
          <>
            <span aria-hidden="true">›</span>
            <Link href={routes.category(category.id, sub.id)}>{sub.name}</Link>
          </>
        )}
      </nav>

      <section className="ks-pd">
        <div className="ks-pd-photo">
          {product.imageUrl && (
            <Image src={product.imageUrl} alt={product.name} width={800} height={800} sizes="(max-width: 760px) 340px, 520px" priority />
          )}
        </div>
        <div className="ks-pd-info">
          <h1>{product.name}</h1>
          {product.size && <p className="ks-pd-size">{product.size}</p>}
          <OfferBadges product={product} />
          {product.isBogo && <p className="ks-pd-bogo">{t.products.bogoLong}</p>}
          <p className="ks-pd-price">{price(product)}</p>
          <div className="ks-pd-desc">
            <h2>{t.product.description}</h2>
            <p>{product.description || t.product.noDescription}</p>
            {product.usesCategoryImage && <p className="ks-pd-note">{t.product.imageNote}</p>}
          </div>
        </div>
      </section>

      <section aria-labelledby="related-title">
        <div className="ks-section-head">
          <h2 id="related-title">{t.product.related}</h2>
        </div>
        {related.length > 0 ? <ProductGrid products={related} /> : <p className="ks-muted">{t.product.noRelated}</p>}
      </section>
    </>
  );
}
