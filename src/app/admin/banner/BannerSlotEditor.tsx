"use client";

import { useState } from "react";

import { useT } from "@/context/LanguageContext";
import { bannerSlotSize, type BannerTemplate } from "@/lib/banner-templates";
import type { OfferGroupRecord } from "@/services/offer-groups";
import type { CategoryRow, ProductRow } from "@/types/admin";
import type { BannerLink, BannerLinkKind, BannerSlot } from "@/types/catalog";

import ImageField from "../_components/ImageField";
import ProductPicker from "../_components/ProductPicker";

type Kind = "product" | "image" | "empty";
type ImageSlot = Extract<BannerSlot, { type: "image" }>;

type Props = {
  template: BannerTemplate;
  slotId: string;
  slotNumber: number;
  slot: BannerSlot | null;
  onChange: (slot: BannerSlot | null) => void;
  onClose: () => void;
  products: ProductRow[];
  productsLoading: boolean;
  categories: CategoryRow[];
  groups: OfferGroupRecord[];
};

const HTTPS = /^https:\/\/\S+$/;

/**
 * Fills one banner box: a product (photo, name, price, opens the product) or
 * a picture with an optional link, or nothing. Keyed by page + box by the
 * parent, so its drafts start fresh for every box.
 */
export default function BannerSlotEditor({
  template,
  slotId,
  slotNumber,
  slot,
  onChange,
  onClose,
  products,
  productsLoading,
  categories,
  groups,
}: Props) {
  const a = useT().admin;
  const b = a.banner;
  const image: ImageSlot | null = slot?.type === "image" ? slot : null;

  const [kind, setKind] = useState<Kind>(slot?.type ?? "empty");
  const [alt, setAlt] = useState(image?.alt ?? "");
  const [linkKind, setLinkKind] = useState<BannerLinkKind | "none">(image?.link?.kind ?? "none");
  const [url, setUrl] = useState(image?.link?.kind === "url" ? image.link.target : "");
  const [urlError, setUrlError] = useState(false);

  const size = bannerSlotSize(template, slotId);
  const topCategories = categories.filter((c) => !c.parent_id);

  function chooseKind(next: Kind) {
    setKind(next);
    if (next === "empty") onChange(null);
  }

  function saveImage(patch: { image_url?: string; alt?: string; link?: BannerLink | null }) {
    const imageUrl = patch.image_url ?? image?.image_url;
    if (!imageUrl) return;
    onChange({
      type: "image",
      image_url: imageUrl,
      alt: (patch.alt ?? alt).trim(),
      link: patch.link !== undefined ? patch.link : (image?.link ?? null),
    });
  }

  function chooseLinkKind(next: BannerLinkKind | "none") {
    setLinkKind(next);
    setUrlError(false);
    if (next === "none") saveImage({ link: null });
    else if (next === "deals" || next === "flyer") saveImage({ link: { kind: next, target: "" } });
  }

  const linkTarget = image?.link && image.link.kind === linkKind ? image.link.target : "";

  return (
    <div className="ka-bslot-editor">
      <div className="ka-fslot-head">
        <h3>{b.boxN(slotNumber)}</h3>
        <button type="button" className="ka-text-btn" onClick={onClose}>
          {a.common.closeEdit}
        </button>
      </div>

      <div className="ka-field">
        <span>{b.kind}</span>
        <div className="ka-seg" role="group" aria-label={b.kind}>
          {(
            [
              ["product", b.kindProduct],
              ["image", b.kindImage],
              ["empty", b.kindEmpty],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => chooseKind(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {kind === "product" && (
        <div className="ka-field">
          <small>{b.productHint}</small>
          {productsLoading ? (
            <p className="ka-hint">{a.common.loading}</p>
          ) : (
            <ProductPicker
              products={products}
              categories={categories}
              selectedId={slot?.type === "product" ? slot.product_id : null}
              onPick={(id) => id && onChange({ type: "product", product_id: id })}
            />
          )}
        </div>
      )}

      {kind === "image" && (
        <>
          <ImageField
            label={b.picture}
            value={image?.image_url ?? null}
            onChange={(next) => (next ? saveImage({ image_url: next }) : onChange(null))}
            folder="banners"
            maxSide={2000}
            aspect={`${size.width} / ${size.height}`}
            hint={b.bestSize(size.width, size.height)}
          />

          {image && (
            <>
              <label className="ka-field">
                {b.alt}
                <input
                  value={alt}
                  maxLength={140}
                  onChange={(e) => setAlt(e.target.value)}
                  onBlur={() => alt.trim() !== (image.alt ?? "") && saveImage({ alt })}
                />
                <small>{b.altHint}</small>
              </label>

              <label className="ka-field">
                {b.link}
                <select value={linkKind} onChange={(e) => chooseLinkKind(e.target.value as BannerLinkKind | "none")}>
                  <option value="none">{b.linkNone}</option>
                  <option value="deals">{b.linkDeals}</option>
                  <option value="flyer">{b.linkFlyer}</option>
                  <option value="offer_group">{b.linkOfferGroup}</option>
                  <option value="category">{b.linkCategory}</option>
                  <option value="product">{b.linkProduct}</option>
                  <option value="url">{b.linkUrl}</option>
                </select>
              </label>

              {linkKind === "category" && (
                <label className="ka-field">
                  {b.linkPickCategory}
                  <select
                    value={linkTarget}
                    onChange={(e) => e.target.value && saveImage({ link: { kind: "category", target: e.target.value } })}
                  >
                    <option value="">—</option>
                    {topCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {linkKind === "offer_group" && (
                <label className="ka-field">
                  {b.linkPickGroup}
                  <select
                    value={linkTarget}
                    onChange={(e) => e.target.value && saveImage({ link: { kind: "offer_group", target: e.target.value } })}
                  >
                    <option value="">—</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {linkKind === "product" && (
                <div className="ka-field">
                  <span>{b.linkPickProduct}</span>
                  <ProductPicker
                    products={products}
                    categories={categories}
                    selectedId={linkTarget || null}
                    onPick={(id) => id && saveImage({ link: { kind: "product", target: id } })}
                  />
                </div>
              )}

              {linkKind === "url" && (
                <label className="ka-field">
                  {b.linkUrlLabel}
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={url}
                    aria-invalid={urlError || undefined}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setUrlError(false);
                    }}
                    onBlur={() => {
                      const next = url.trim();
                      if (!next) return;
                      if (!HTTPS.test(next)) return setUrlError(true);
                      if (next !== linkTarget) saveImage({ link: { kind: "url", target: next } });
                    }}
                  />
                  {urlError && <small className="ka-error">{b.linkUrlError}</small>}
                </label>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
