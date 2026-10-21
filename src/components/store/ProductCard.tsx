"use client";

import Image from "next/image";
import Link from "next/link";

import { useT } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/price";
import { routes } from "@/lib/routes";
import type { Product } from "@/types/catalog";

/** ΣΟΥΠΕΡ ΤΙΜΗ and/or 1+1 badges; renders nothing for a regular product. */
export function OfferBadges({ product }: { product: Pick<Product, "isSuperPrice" | "isBogo"> }) {
  const t = useT().store.products;
  if (!product.isSuperPrice && !product.isBogo) return null;
  return (
    <span className="ks-badges">
      {product.isSuperPrice && <span className="ks-badge">{t.superPrice}</span>}
      {product.isBogo && (
        <span className="ks-badge ks-badge-bogo" title={t.bogoLong}>
          {t.bogo}
        </span>
      )}
    </span>
  );
}

export function usePrice() {
  const kg = useT().units.kg;
  return (p: Pick<Product, "price" | "priceUnit">) => formatPrice(p.price, p.priceUnit, kg);
}

/**
 * Product tile: photo, badges, name, package size and price. The whole card
 * is one link (the name's link stretches over it), so it's a single tab stop.
 */
export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const price = usePrice();
  return (
    <article className="ks-product">
      <div className="ks-photo">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt=""
            width={400}
            height={400}
            sizes="(max-width: 760px) 104px, (max-width: 1100px) 33vw, 300px"
            priority={priority}
          />
        )}
      </div>
      <OfferBadges product={product} />
      <h3>
        <Link className="ks-card-link" href={routes.product(product.id)}>
          {product.name}
        </Link>
      </h3>
      {product.size && <p className="ks-size">{product.size}</p>}
      <div className="ks-price-row">
        <div className="ks-price">{price(product)}</div>
        <span className="ks-go" aria-hidden="true">
          ›
        </span>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className = "" }: { products: Product[]; className?: string }) {
  return (
    <div className={`ks-products ${className}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
