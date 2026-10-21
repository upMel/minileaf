"use client";

/* eslint-disable @next/next/no-img-element -- admin previews must show any link without next/image host rules */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useT } from "@/context/LanguageContext";
import { templateLabel } from "@/i18n/templates";
import { DEFAULT_TEMPLATE_ID, LAYOUT_TEMPLATES } from "@/lib/layout-templates";
import {
  addFlyerPage,
  deleteFlyer,
  deleteFlyerPage,
  reorderFlyerPages,
  setFlyerActive,
  updateFlyer,
  updateFlyerPage,
  type FlyerDetail,
  type FlyerPageRecord,
  type Orientation,
} from "@/services/flyers";
import { SITE_IMAGES_BUCKET, UploadError, uploadImage } from "@/services/storage";

import ImageField from "../../_components/ImageField";
import ProductPicker from "../../_components/ProductPicker";
import { productImageResolver } from "../../_components/product-image";
import { errorText, useAutoSave } from "../../_components/useAutoSave";
import { adminProductsQueryOptions, categoriesQueryOptions } from "../../products/_queries";
import TemplatePreview, { TemplateMini } from "../TemplatePreview";
import { FLYERS_KEY, flyerKey, flyerQueryOptions } from "../_queries";

const CANVA_MAX_MB = 25;
const CANVA_MAX_SIDE = 2400;

function getTemplate(id: string | null) {
  return LAYOUT_TEMPLATES.find((t) => t.id === id) ?? LAYOUT_TEMPLATES[0];
}

/** One flyer: its details, its pages (products or Canva) and the page being edited. Saves as you go. */
export default function FlyerEditorPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const a = t.admin;
  const f = a.flyers;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { supabase, adminState } = useAdminAuthContext();
  const enabled = adminState.status === "authorized" && Boolean(supabase);

  const flyer = useQuery(flyerQueryOptions(supabase!, id, enabled));
  const products = useQuery(adminProductsQueryOptions(supabase!, enabled));
  const categories = useQuery(categoriesQueryOptions(supabase!, enabled));

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(null);
  const [confirm, setConfirm] = useState<"page" | "flyer" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const key = flyerKey(id);
  const { save, run, pending, saved, error, setError } = useAutoSave<FlyerDetail>(key, FLYERS_KEY);

  const productsById = useMemo(() => new Map((products.data ?? []).map((p) => [p.id, p])), [products.data]);
  const imageFor = useMemo(() => productImageResolver(categories.data ?? []), [categories.data]);

  const data = flyer.data;
  const pages = data?.pages ?? [];
  const pageIndex = Math.max(
    0,
    pages.findIndex((p) => p.id === selectedPageId),
  );
  const page: FlyerPageRecord | undefined = pages[pageIndex];
  const landscape = data?.orientation === "landscape";
  const aspect = landscape ? "297 / 210" : "210 / 297";

  function updatePage(pageId: string, patch: Partial<Pick<FlyerPageRecord, "template_id" | "slots" | "image_url">>) {
    void save(
      (d) => ({ ...d, pages: d.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)) }),
      () =>
        updateFlyerPage(supabase!, pageId, {
          ...(patch.template_id ? { template_id: patch.template_id } : {}),
          ...(patch.slots ? { slots: patch.slots } : {}),
          ...(patch.image_url ? { image_url: patch.image_url } : {}),
        }),
    );
  }

  function updateDetails(patch: { name?: string; orientation?: Orientation }) {
    void save((d) => ({ ...d, ...patch }), () => updateFlyer(supabase!, id, patch));
  }

  function setLive(live: boolean) {
    void save(
      (d) => ({ ...d, is_active: live }),
      () => setFlyerActive(supabase!, id, live),
    );
  }

  function selectPage(pageId: string) {
    setSelectedPageId(pageId);
    setSelectedSlot(null);
    setConfirm(null);
  }

  function move(index: number, delta: -1 | 1) {
    const list = [...pages];
    const [moved] = list.splice(index, 1);
    list.splice(index + delta, 0, moved);
    void save(
      (d) => ({ ...d, pages: list.map((p, i) => ({ ...p, page_order: i })) }),
      () => reorderFlyerPages(supabase!, list),
    );
  }

  const lastOrder = pages.reduce((max, p) => Math.max(max, p.page_order), -1);

  async function addPages(make: (order: number, i: number) => Promise<string>, count: number) {
    let newest: string | null = null;
    await run(
      async () => {
        for (let i = 0; i < count; i += 1) {
          newest = await make(lastOrder + i, i);
          setUpload((u) => (u ? { ...u, done: i + 1 } : u));
        }
      },
      (e) => {
        const kind = e instanceof UploadError ? e.kind : null;
        return kind === "not-image"
          ? a.products.errors.imageType
          : kind === "too-large"
            ? a.image.tooLarge(CANVA_MAX_MB)
            : errorText(a.common.failed, e);
      },
    );
    setUpload(null);
    if (newest) selectPage(newest);
  }

  function addTemplatePage() {
    void addPages((order) => addFlyerPage(supabase!, id, { kind: "template", template_id: DEFAULT_TEMPLATE_ID }, order), 1);
  }

  function addCanvaPages(files: File[]) {
    if (files.length === 0) return;
    setUpload({ done: 0, total: files.length });
    void addPages(async (order, i) => {
      const url = await uploadImage(supabase!, files[i], {
        bucket: SITE_IMAGES_BUCKET,
        folder: "flyers",
        maxSide: CANVA_MAX_SIDE,
        maxInputBytes: CANVA_MAX_MB * 1024 * 1024,
      });
      return addFlyerPage(supabase!, id, { kind: "image", image_url: url }, order);
    }, files.length);
  }

  function removePage(target: FlyerPageRecord) {
    const index = pages.findIndex((p) => p.id === target.id);
    const next = pages[index + 1] ?? pages[index - 1];
    setConfirm(null);
    setSelectedSlot(null);
    setSelectedPageId(next?.id ?? null);
    void save(
      (d) => ({ ...d, pages: d.pages.filter((p) => p.id !== target.id) }),
      () => deleteFlyerPage(supabase!, target.id),
    );
  }

  async function removeFlyer() {
    setError(null);
    try {
      await deleteFlyer(supabase!, id);
      queryClient.removeQueries({ queryKey: key });
      await queryClient.invalidateQueries({ queryKey: FLYERS_KEY, exact: true });
      router.push("/admin/flyers");
    } catch (e) {
      setError(errorText(a.common.failed, e));
    }
  }

  function pickSlot(slotId: string) {
    setSelectedSlot(slotId);
    requestAnimationFrame(() => pickerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }

  function setSlot(slotId: string, productId: string | null) {
    if (!page) return;
    const slots = { ...page.slots };
    if (productId) slots[slotId] = productId;
    else delete slots[slotId];
    updatePage(page.id, { slots });
  }

  function changeTemplate(templateId: string) {
    if (!page || templateId === page.template_id) return;
    const ids = new Set(getTemplate(templateId).slots.map((s) => s.id));
    const slots = Object.fromEntries(Object.entries(page.slots).filter(([k, v]) => ids.has(k) && v));
    setSelectedSlot(null);
    updatePage(page.id, { template_id: templateId, slots });
  }

  const back = (
    <Link className="ka-back" href="/admin/flyers">
      ‹ {f.allFlyers}
    </Link>
  );

  if (flyer.isError) {
    return (
      <>
        <div className="ka-intro">{back}</div>
        <section className="ka-card">
          <div className="ka-empty">
            <h3>{f.notFound}</h3>
            <p>{flyer.error.message}</p>
          </div>
        </section>
      </>
    );
  }

  if (!data) {
    return (
      <div className="ka-intro">
        {back}
        <p className="ka-hint">{a.common.loading}</p>
      </div>
    );
  }

  const template = page?.kind === "template" ? getTemplate(page.template_id) : null;
  const slotIndex = template && selectedSlot ? template.slots.findIndex((s) => s.id === selectedSlot) : -1;

  return (
    <>
      <div className="ka-intro">
        {back}
        <h1>{data.name}</h1>
        <span>
          {f.pages(pages.length)} · {data.is_active ? f.live : f.notLive}
        </span>
      </div>

      <div className="ka-status" role="status" aria-live="polite">
        {upload ? f.uploadingPages(upload.done, upload.total) : pending > 0 ? a.common.saving : saved ? f.saved : ""}
      </div>
      {error && (
        <p className="ka-error" role="alert">
          {error}
        </p>
      )}

      <div className="ka-builder">
        <div className="ka-builder-side">
          <section className="ka-card">
            <div className="ka-card-title">
              <h2>{f.settings}</h2>
            </div>
            <label className="ka-field">
              {f.name}
              <input
                value={name ?? data.name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                onBlur={() => {
                  const next = name?.trim();
                  if (next && next !== data.name) updateDetails({ name: next });
                  setName(null);
                }}
              />
            </label>
            <div className="ka-field">
              <span>{f.orientation}</span>
              <div className="ka-seg" role="group" aria-label={f.orientation}>
                {(["portrait", "landscape"] as const).map((o) => (
                  <button key={o} type="button" aria-pressed={data.orientation === o} onClick={() => data.orientation !== o && updateDetails({ orientation: o })}>
                    {o === "portrait" ? f.portrait : f.landscape}
                  </button>
                ))}
              </div>
            </div>
            <label className="ka-check">
              <input type="checkbox" checked={data.is_active} onChange={(e) => setLive(e.target.checked)} />
              <span>
                <strong>{f.showInShop}</strong>
                <small>{f.liveHint}</small>
              </span>
            </label>
            <div className="ka-actions">
              <Link className="ka-text-btn" href="/flyer" target="_blank">
                {f.viewLive} ↗
              </Link>
            </div>
          </section>

          <section className="ka-card">
            <div className="ka-card-title">
              <h2>{f.pagesTitle}</h2>
              <span className="ka-count">{pages.length}</span>
            </div>
            {pages.length > 0 && (
              <ol className="ka-rows">
                {pages.map((p, i) => {
                  const tpl = p.kind === "template" ? getTemplate(p.template_id) : null;
                  return (
                    <li key={p.id} className={p.id === page?.id ? "current" : undefined}>
                      <button
                        type="button"
                        className="ka-row"
                        aria-current={p.id === page?.id ? "true" : undefined}
                        onClick={() => selectPage(p.id)}
                      >
                        <span className="ka-row-pic" style={{ aspectRatio: aspect }}>
                          {tpl ? <TemplateMini template={tpl} landscape={landscape} /> : p.image_url && <img src={p.image_url} alt="" loading="lazy" />}
                        </span>
                        <span className="ka-row-text">
                          <b>{f.pageN(i + 1)}</b>
                          <small>{tpl ? templateLabel(t, tpl.id, tpl).name : f.canvaPage}</small>
                        </span>
                      </button>
                      <span className="ka-row-tools">
                        <button type="button" aria-label={`${f.moveUp}: ${f.pageN(i + 1)}`} disabled={i === 0} onClick={() => move(i, -1)}>
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`${f.moveDown}: ${f.pageN(i + 1)}`}
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
            {pages.length === 0 && (
              <div className="ka-empty">
                <h3>{f.noPagesTitle}</h3>
                <p>{f.noPagesText}</p>
              </div>
            )}
            <div className="ka-rows-add">
              <button type="button" className="ka-btn-small" disabled={Boolean(upload)} onClick={addTemplatePage}>
                {f.addTemplatePage}
              </button>
              <button type="button" className="ka-btn-small" disabled={Boolean(upload)} onClick={() => fileRef.current?.click()}>
                {upload ? f.uploadingPages(upload.done, upload.total) : f.addImagePage}
              </button>
              <input
                ref={fileRef}
                className="ka-file"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                tabIndex={-1}
                aria-label={f.addImagePage}
                onChange={(e) => {
                  addCanvaPages(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </div>
            <small className="ka-hint">{f.addImageHint(CANVA_MAX_MB)}</small>
          </section>
        </div>

        {page && (
          <section className="ka-card ka-builder-main" aria-label={f.pageN(pageIndex + 1)}>
            <div className="ka-card-title">
              <h2>
                {f.pageN(pageIndex + 1)}
                <small>{page.kind === "image" ? f.canvaPage : f.productPage}</small>
              </h2>
            </div>

            {template && (
              <>
                <div className="ka-field">
                  <span>{f.template}</span>
                  <div className="ka-tpl-choices">
                    {LAYOUT_TEMPLATES.map((tpl) => {
                      const label = templateLabel(t, tpl.id, tpl);
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          aria-pressed={tpl.id === template.id}
                          title={label.description}
                          onClick={() => changeTemplate(tpl.id)}
                        >
                          <TemplateMini template={tpl} landscape={landscape} />
                          <span>{label.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ka-field">
                  <span>{f.slotsTitle}</span>
                  <small>{f.slotsHint}</small>
                </div>
                <div className={`ka-fedit${landscape ? " wide" : ""}`}>
                  <TemplatePreview
                    template={template}
                    landscape={landscape}
                    slots={page.slots}
                    productsById={productsById}
                    imageFor={imageFor}
                    selectedSlot={selectedSlot}
                    onSelect={pickSlot}
                  />
                  <div className="ka-fslot" ref={pickerRef}>
                    {selectedSlot && slotIndex >= 0 ? (
                      <>
                        <div className="ka-fslot-head">
                          <h3>{f.slotN(slotIndex + 1)}</h3>
                          <button type="button" className="ka-text-btn" onClick={() => setSelectedSlot(null)}>
                            {a.common.closeEdit}
                          </button>
                        </div>
                        {products.isPending ? (
                          <p className="ka-hint">{a.common.loading}</p>
                        ) : (
                          <ProductPicker
                            products={products.data ?? []}
                            categories={categories.data ?? []}
                            selectedId={page.slots[selectedSlot] ?? null}
                            onPick={(pid) => setSlot(selectedSlot, pid)}
                            emptyLabel={f.auto}
                            emptyHint={f.autoHint}
                          />
                        )}
                      </>
                    ) : (
                      <div className="ka-fslot-empty">
                        <b aria-hidden="true">☝</b>
                        <p>{f.pickSlot}</p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="ka-hint ka-note">{f.phoneNote}</p>
              </>
            )}

            {page.kind === "image" && (
              <ImageField
                label={f.canvaTitle}
                value={page.image_url}
                onChange={(url) => url && updatePage(page.id, { image_url: url })}
                folder="flyers"
                maxSide={CANVA_MAX_SIDE}
                maxMb={CANVA_MAX_MB}
                removable={false}
                aspect={aspect}
                hint={f.canvaHint}
              />
            )}

            {confirm === "page" ? (
              <div className="ka-confirm">
                <span>{f.deletePageConfirm}</span>
                <button type="button" className="ka-danger" onClick={() => removePage(page)}>
                  {a.common.yesDelete}
                </button>
                <button type="button" className="ka-text-btn" onClick={() => setConfirm(null)}>
                  {a.common.no}
                </button>
              </div>
            ) : (
              <button type="button" className="ka-danger" onClick={() => setConfirm("page")}>
                {f.deletePage}
              </button>
            )}
          </section>
        )}
      </div>

      <section className="ka-card ka-flyer-danger">
        {confirm === "flyer" ? (
          <div className="ka-confirm">
            <span>{f.deleteFlyerConfirm}</span>
            <button type="button" className="ka-danger" onClick={() => void removeFlyer()}>
              {a.common.yesDelete}
            </button>
            <button type="button" className="ka-text-btn" onClick={() => setConfirm(null)}>
              {a.common.no}
            </button>
          </div>
        ) : (
          <button type="button" className="ka-text-btn ka-text-danger" onClick={() => setConfirm("flyer")}>
            {f.deleteFlyer}
          </button>
        )}
      </section>
    </>
  );
}
