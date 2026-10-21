"use client";

/* eslint-disable @next/next/no-img-element -- admin previews must show any link without next/image host rules */

import { useT } from "@/context/LanguageContext";
import { BANNER_ASPECT, bannerGridAreas, type BannerTemplate } from "@/lib/banner-templates";
import type { BannerSlots } from "@/services/banner";
import type { ProductRow } from "@/types/admin";

const showable = (src: string | null | undefined) => Boolean(src && /^(https?:\/\/|\/)/.test(src));
const FRAME = `${BANNER_ASPECT.width} / ${BANNER_ASPECT.height}`;

/** Tiny picture of a banner template, for the layout chooser and the page list. */
export function BannerMini({ template }: { template: BannerTemplate }) {
  return (
    <span
      className="ka-bmini"
      style={{ aspectRatio: FRAME, gridTemplateColumns: template.columns, gridTemplateAreas: bannerGridAreas(template) }}
      aria-hidden="true"
    >
      {template.slots.map((s) => (
        <i key={s.id} style={{ gridArea: s.id }} />
      ))}
    </span>
  );
}

type Props = {
  template: BannerTemplate;
  slots: BannerSlots;
  productsById: Map<string, ProductRow>;
  imageFor: (p: ProductRow) => string | null;
  selectedSlot: string | null;
  onSelect: (slotId: string) => void;
};

/** The banner page in the shape the shop shows it, every box clickable. */
export default function BannerPreview({ template, slots, productsById, imageFor, selectedSlot, onSelect }: Props) {
  const t = useT().admin;
  const b = t.banner;
  return (
    <div className="ka-bprev" style={{ aspectRatio: FRAME, gridTemplateColumns: template.columns, gridTemplateAreas: bannerGridAreas(template) }}>
      {template.slots.map((s, i) => {
        const slot = slots[s.id];
        const product = slot?.type === "product" ? productsById.get(slot.product_id) : undefined;
        return (
          <button
            key={s.id}
            type="button"
            className={`ka-bprev-slot${slot ? "" : " empty"}`}
            style={{ gridArea: s.id }}
            aria-pressed={selectedSlot === s.id}
            aria-label={b.boxN(i + 1)}
            onClick={() => onSelect(s.id)}
          >
            <span className="ka-tpl-num">{i + 1}</span>
            {slot?.type === "image" && showable(slot.image_url) && <img className="ka-bprev-img" src={slot.image_url} alt="" />}
            {slot?.type === "product" &&
              (product ? (
                <span className="ka-bprev-product">
                  <span className="ka-tpl-pic">{showable(imageFor(product)) && <img src={imageFor(product)!} alt="" />}</span>
                  <span className="ka-tpl-name">{product.name}</span>
                  {!product.is_active && <em className="ka-tpl-warn">{t.products.hiddenTag}</em>}
                </span>
              ) : (
                <span className="ka-tpl-warn">{b.missingProduct}</span>
              ))}
            {!slot && <span className="ka-tpl-auto">{b.emptyBox}</span>}
          </button>
        );
      })}
    </div>
  );
}
