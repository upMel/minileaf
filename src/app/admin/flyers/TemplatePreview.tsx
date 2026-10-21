"use client";

/* eslint-disable @next/next/no-img-element -- admin previews must show any link without next/image host rules */

import { useT } from "@/context/LanguageContext";
import type { LayoutTemplate, SlotSize } from "@/lib/layout-templates";
import type { ProductRow } from "@/types/admin";

const showable = (src: string | null) => Boolean(src && /^(https?:\/\/|\/)/.test(src));

function spans(size: SlotSize) {
  const [w, h] = size.split("x").map(Number);
  return { gridColumn: `span ${w}`, gridRow: `span ${h}` };
}

/** Tiny picture of a template, for the template chooser and the page list. */
export function TemplateMini({ template, landscape }: { template: LayoutTemplate; landscape: boolean }) {
  return (
    <span
      className="ka-tpl-mini"
      style={{ aspectRatio: landscape ? "297 / 210" : "210 / 297", gridTemplateColumns: `repeat(${template.cols}, 1fr)` }}
      aria-hidden="true"
    >
      {template.slots.map((s) => (
        <i key={s.id} className={`r-${s.role}`} style={spans(s.size)} />
      ))}
    </span>
  );
}

type Props = {
  template: LayoutTemplate;
  landscape: boolean;
  slots: Record<string, string | null>;
  productsById: Map<string, ProductRow>;
  imageFor: (p: ProductRow) => string | null;
  selectedSlot: string | null;
  onSelect: (slotId: string) => void;
};

/** The page as the shopper will see it, with every slot clickable. */
export default function TemplatePreview({ template, landscape, slots, productsById, imageFor, selectedSlot, onSelect }: Props) {
  const admin = useT().admin;
  const t = admin.flyers;
  return (
    <div
      className="ka-tpl"
      style={{ aspectRatio: landscape ? "297 / 210" : "210 / 297", gridTemplateColumns: `repeat(${template.cols}, minmax(0, 1fr))` }}
    >
      {template.slots.map((slot, i) => {
        const product = slots[slot.id] ? productsById.get(slots[slot.id] as string) : undefined;
        return (
          <button
            key={slot.id}
            type="button"
            className={`ka-tpl-slot r-${slot.role}`}
            style={spans(slot.size)}
            aria-pressed={selectedSlot === slot.id}
            onClick={() => onSelect(slot.id)}
          >
            <span className="ka-tpl-num">{i + 1}</span>
            {product ? (
              <>
                <span className="ka-tpl-pic">{showable(imageFor(product)) && <img src={imageFor(product)!} alt="" loading="lazy" />}</span>
                <span className="ka-tpl-name">{product.name}</span>
                {!product.is_active && <em className="ka-tpl-warn">{admin.products.hiddenTag}</em>}
              </>
            ) : (
              <span className="ka-tpl-auto">{slots[slot.id] ? t.missingProduct : t.auto}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
