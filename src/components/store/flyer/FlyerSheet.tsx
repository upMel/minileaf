"use client";

import Image from "next/image";
import Link from "next/link";

import { useT } from "@/context/LanguageContext";
import type { ResolvedFlyerPage } from "@/lib/data/storefront";
import { LAYOUT_TEMPLATES, type SlotRole, type SlotSize } from "@/lib/layout-templates";
import { routes } from "@/lib/routes";
import type { Product } from "@/types/catalog";

import { usePrice } from "../ProductCard";

// Everything inside a sheet is sized in container units (cqw = 1% of the page
// width), so names and prices grow with the page: small in the two-page
// spread, large in full screen — never the fixed 8–11px of the old viewer.

function spans(size: SlotSize): { gridColumn: string; gridRow: string } {
  const [w, h] = size.split("x").map(Number);
  return { gridColumn: `span ${w}`, gridRow: `span ${h}` };
}

/** One product on a flyer page. The whole cell opens the product. */
function FlyerCell({ product, role }: { product: Product; role: SlotRole | "phone" }) {
  const t = useT().store.products;
  const price = usePrice();
  return (
    <Link href={routes.product(product.id)} className={`fp-cell fp-${role}`} draggable={false}>
      <span className="fp-img">
        {product.imageUrl && (
          <Image src={product.imageUrl} alt="" fill sizes="(max-width: 760px) 45vw, 25vw" draggable={false} />
        )}
        {(product.isSuperPrice || product.isBogo) && (
          <span className="fp-badges">
            {product.isSuperPrice && <span className="fp-badge">{t.superPrice}</span>}
            {product.isBogo && <span className="fp-badge fp-badge-bogo">{t.bogo}</span>}
          </span>
        )}
      </span>
      <span className="fp-info">
        <span className="fp-name">{product.name}</span>
        {product.size && <span className="fp-size">{product.size}</span>}
        <span className="fp-price">{price(product)}</span>
      </span>
    </Link>
  );
}

/** A full page as designed in the flyer builder (computer). */
export function TemplateSheet({
  page,
  landscape = false,
}: {
  page: Extract<ResolvedFlyerPage, { kind: "template" }>;
  landscape?: boolean;
}) {
  const template = LAYOUT_TEMPLATES.find((tpl) => tpl.id === page.templateId) ?? LAYOUT_TEMPLATES[0];
  return (
    <div className={`fp${landscape ? " fp-landscape" : ""}`} style={{ gridTemplateColumns: `repeat(${template.cols}, minmax(0, 1fr))` }}>
      {template.slots.map((slot, i) => {
        const product = page.cells[i];
        return (
          <div key={slot.id} className="fp-slot" style={spans(slot.size)}>
            {product ? <FlyerCell product={product} role={slot.role} /> : <span className="fp-blank" />}
          </div>
        );
      })}
    </div>
  );
}

/** Phone page: at most four products, two columns, so names and prices stay readable. */
export function PhoneSheet({ products }: { products: Product[] }) {
  return (
    <div className="fp fp-phone">
      {products.map((p) => (
        <div key={p.id} className="fp-slot">
          <FlyerCell product={p} role="phone" />
        </div>
      ))}
    </div>
  );
}

/** A finished page uploaded from Canva. */
export function ImageSheet({ src, label }: { src: string; label: string }) {
  return (
    <div className="fp-image">
      <Image src={src} alt={label} fill sizes="(max-width: 760px) 100vw, 50vw" draggable={false} />
    </div>
  );
}

/** Products of a template page in slot-priority order (hero first). */
export function productsByPriority(page: Extract<ResolvedFlyerPage, { kind: "template" }>): Product[] {
  const template = LAYOUT_TEMPLATES.find((tpl) => tpl.id === page.templateId) ?? LAYOUT_TEMPLATES[0];
  return template.slots
    .map((slot, i) => ({ priority: slot.priority, product: page.cells[i] }))
    .sort((a, b) => a.priority - b.priority)
    .map((x) => x.product)
    .filter((p): p is Product => p !== null);
}
