"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useT } from "@/context/LanguageContext";
import { BANNER_TEMPLATES, DEFAULT_BANNER_TEMPLATE_ID, getBannerTemplate } from "@/lib/banner-templates";
import {
  addBannerPage,
  deleteBannerPage,
  reorderBannerPages,
  updateBannerPage,
  type BannerPageRecord,
  type BannerSlots,
} from "@/services/banner";
import type { BannerSlot } from "@/types/catalog";

import { productImageResolver } from "../_components/product-image";
import { useAutoSave } from "../_components/useAutoSave";
import { adminProductsQueryOptions, categoriesQueryOptions, offerGroupsQueryOptions } from "../products/_queries";
import BannerPreview, { BannerMini } from "./BannerPreview";
import BannerSlotEditor from "./BannerSlotEditor";
import { BANNER_KEY, bannerQueryOptions } from "./_queries";

function templateOf(id: string) {
  return getBannerTemplate(id) ?? BANNER_TEMPLATES[0];
}

/** Banner: the pages at the top of the home page, each a layout of boxes. Saves as you go. */
export default function AdminBannerPage() {
  const a = useT().admin;
  const b = a.banner;
  const { supabase, adminState } = useAdminAuthContext();
  const enabled = adminState.status === "authorized" && Boolean(supabase);

  const pagesQuery = useQuery(bannerQueryOptions(supabase!, enabled));
  const products = useQuery(adminProductsQueryOptions(supabase!, enabled));
  const categories = useQuery(categoriesQueryOptions(supabase!, enabled));
  const groups = useQuery(offerGroupsQueryOptions(supabase!, enabled));
  const { save, run, pending, saved, error } = useAutoSave<BannerPageRecord[]>(BANNER_KEY);

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const productsById = useMemo(() => new Map((products.data ?? []).map((p) => [p.id, p])), [products.data]);
  const imageFor = useMemo(() => productImageResolver(categories.data ?? []), [categories.data]);

  const pages = pagesQuery.data ?? [];
  const pageIndex = Math.max(
    0,
    pages.findIndex((p) => p.id === selectedPageId),
  );
  const page = pages[pageIndex];
  const template = page ? templateOf(page.template_id) : null;
  const showingOwnPages = pages.some((p) => p.is_visible && Object.values(p.slots).some(Boolean));

  function selectPage(id: string) {
    setSelectedPageId(id);
    setSelectedSlot(null);
    setConfirm(false);
  }

  function updatePage(id: string, patch: { template_id?: string; slots?: BannerSlots; is_visible?: boolean }) {
    void save(
      (list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      () => updateBannerPage(supabase!, id, patch),
    );
  }

  function move(index: number, delta: -1 | 1) {
    const list = [...pages];
    const [moved] = list.splice(index, 1);
    list.splice(index + delta, 0, moved);
    void save(
      () => list.map((p, i) => ({ ...p, page_order: i })),
      () => reorderBannerPages(supabase!, list),
    );
  }

  async function addPage() {
    const order = pages.reduce((max, p) => Math.max(max, p.page_order), -1) + 1;
    const id = await run(() => addBannerPage(supabase!, DEFAULT_BANNER_TEMPLATE_ID, order));
    if (id) selectPage(id);
  }

  function removePage(target: BannerPageRecord) {
    const index = pages.findIndex((p) => p.id === target.id);
    const next = pages[index + 1] ?? pages[index - 1];
    setConfirm(false);
    setSelectedSlot(null);
    setSelectedPageId(next?.id ?? null);
    void save(
      (list) => list.filter((p) => p.id !== target.id),
      () => deleteBannerPage(supabase!, target.id),
    );
  }

  function changeTemplate(templateId: string) {
    if (!page || templateId === page.template_id) return;
    const ids = new Set(templateOf(templateId).slots.map((s) => s.id));
    const slots = Object.fromEntries(Object.entries(page.slots).filter(([k, v]) => ids.has(k) && v));
    setSelectedSlot(null);
    updatePage(page.id, { template_id: templateId, slots });
  }

  function setSlot(slotId: string, slot: BannerSlot | null) {
    if (!page) return;
    const slots = { ...page.slots };
    if (slot) slots[slotId] = slot;
    else delete slots[slotId];
    updatePage(page.id, { slots });
  }

  function pickSlot(slotId: string) {
    setSelectedSlot(slotId);
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }

  const filled = (p: BannerPageRecord) => templateOf(p.template_id).slots.filter((s) => p.slots[s.id]).length;
  const slotIndex = template && selectedSlot ? template.slots.findIndex((s) => s.id === selectedSlot) : -1;

  return (
    <>
      <div className="ka-intro">
        <p>{a.eyebrow}</p>
        <h1>{b.title}</h1>
        <span>{b.subtitle}</span>
      </div>

      <div className="ka-status" role="status" aria-live="polite">
        {pending > 0 ? a.common.saving : saved ? b.saved : ""}
      </div>
      {error && (
        <p className="ka-error" role="alert">
          {error}
        </p>
      )}
      {pagesQuery.error && (
        <p className="ka-error">
          {a.common.loadFailed} ({pagesQuery.error.message})
        </p>
      )}
      {pagesQuery.isSuccess && !showingOwnPages && (
        <div className="ka-notice">
          <b>{b.autoTitle}</b>
          <span>{b.autoText}</span>
        </div>
      )}

      <div className="ka-flyer">
        <div className="ka-flyer-side">
          <section className="ka-card">
            <div className="ka-card-title">
              <h2>{b.pagesTitle}</h2>
              <span className="ka-count">{pages.length}</span>
            </div>
            {pagesQuery.isPending && enabled && <p className="ka-hint">{a.common.loading}</p>}
            {pages.length > 0 && (
              <ol className="ka-fpages">
                {pages.map((p, i) => {
                  const tpl = templateOf(p.template_id);
                  return (
                    <li key={p.id} className={p.id === page?.id ? "current" : undefined}>
                      <button
                        type="button"
                        className="ka-fpage"
                        aria-current={p.id === page?.id ? "true" : undefined}
                        onClick={() => selectPage(p.id)}
                      >
                        <span className="ka-fpage-pic wide">
                          <BannerMini template={tpl} />
                        </span>
                        <span className="ka-fpage-text">
                          <b>{b.pageN(i + 1)}</b>
                          <small>
                            {b.templates[tpl.id] ?? tpl.name} · {b.boxes(filled(p))}
                            {!p.is_visible && <em className="ka-off"> · {b.hiddenTag}</em>}
                          </small>
                        </span>
                      </button>
                      <span className="ka-fpage-tools">
                        <button type="button" aria-label={`${a.flyers.moveUp}: ${b.pageN(i + 1)}`} disabled={i === 0} onClick={() => move(i, -1)}>
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`${a.flyers.moveDown}: ${b.pageN(i + 1)}`}
                          disabled={i === pages.length - 1}
                          onClick={() => move(i, 1)}
                        >
                          ↓
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            {pagesQuery.isSuccess && pages.length === 0 && (
              <div className="ka-empty">
                <h3>{b.noPagesTitle}</h3>
                <p>{b.noPagesText}</p>
              </div>
            )}
            <div className="ka-fpages-add">
              <button type="button" className="ka-btn-small" disabled={!enabled || pending > 0} onClick={() => void addPage()}>
                {b.addPage}
              </button>
              <Link className="ka-text-btn" href="/" target="_blank">
                {b.viewLive} ↗
              </Link>
            </div>
          </section>
        </div>

        {page && template && (
          <section className="ka-card ka-flyer-main" aria-label={b.pageN(pageIndex + 1)}>
            <div className="ka-card-title">
              <h2>
                {b.pageN(pageIndex + 1)}
                {!page.is_visible && <small>{b.hiddenTag}</small>}
              </h2>
            </div>

            <div className="ka-field">
              <span>{b.template}</span>
              <div className="ka-tpl-choices ka-btpl-choices">
                {BANNER_TEMPLATES.map((tpl) => (
                  <button key={tpl.id} type="button" aria-pressed={tpl.id === template.id} onClick={() => changeTemplate(tpl.id)}>
                    <BannerMini template={tpl} />
                    <span>{b.templates[tpl.id] ?? tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="ka-check">
              <input type="checkbox" checked={page.is_visible} onChange={(e) => updatePage(page.id, { is_visible: e.target.checked })} />
              <span>
                <strong>{b.visible}</strong>
                <small>{b.visibleHint}</small>
              </span>
            </label>

            <div className="ka-field">
              <span>{b.boxesTitle}</span>
              <small>{b.boxesHint}</small>
            </div>
            <BannerPreview
              template={template}
              slots={page.slots}
              productsById={productsById}
              imageFor={imageFor}
              selectedSlot={selectedSlot}
              onSelect={pickSlot}
            />

            <div className="ka-fslot ka-bslot-wrap" ref={editorRef}>
              {selectedSlot && slotIndex >= 0 ? (
                <BannerSlotEditor
                  key={`${page.id}:${selectedSlot}`}
                  template={template}
                  slotId={selectedSlot}
                  slotNumber={slotIndex + 1}
                  slot={page.slots[selectedSlot] ?? null}
                  onChange={(slot) => setSlot(selectedSlot, slot)}
                  onClose={() => setSelectedSlot(null)}
                  products={products.data ?? []}
                  productsLoading={products.isPending}
                  categories={categories.data ?? []}
                  groups={groups.data ?? []}
                />
              ) : (
                <div className="ka-fslot-empty">
                  <b aria-hidden="true">☝</b>
                  <p>{b.pickBox}</p>
                </div>
              )}
            </div>

            {confirm ? (
              <div className="ka-confirm">
                <span>{b.deletePageConfirm}</span>
                <button type="button" className="ka-danger" onClick={() => removePage(page)}>
                  {a.common.yesDelete}
                </button>
                <button type="button" className="ka-text-btn" onClick={() => setConfirm(false)}>
                  {a.common.no}
                </button>
              </div>
            ) : (
              <button type="button" className="ka-danger" onClick={() => setConfirm(true)}>
                {b.deletePage}
              </button>
            )}
          </section>
        )}
      </div>
    </>
  );
}
