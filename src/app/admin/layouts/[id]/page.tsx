"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { LAYOUT_TEMPLATES, type LayoutTemplate } from "@/lib/layout-templates";
import type { ProductRow } from "@/types/admin";
import {
  ROLE_COLORS,
  SlotCard,
  TemplatePicker,
} from "@/app/admin/_components/LayoutSlotPicker";
import type { SlotRole } from "@/lib/layout-templates";
import ConfirmModal from "@/app/admin/ConfirmModal";
import {
  layoutDetailQueryOptions,
  activeProductsQueryOptions,
  useUpdateLayout,
  useAddPage,
  useDeletePage,
  useSavePage,
  useMovePage,
  type LayoutPage,
  type Layout,
} from "./_queries";

// ── Single page editor ────────────────────────────────────────────────────────
function PageEditor({
  page,
  products,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onSave,
}: {
  page: LayoutPage;
  products: ProductRow[];
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onSave: (templateId: string, slots: Record<string, string | null>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(page.template_id);
  const [slots, setSlots] = useState<Record<string, string | null>>(page.slots ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const template = LAYOUT_TEMPLATES.find((t) => t.id === templateId) ?? LAYOUT_TEMPLATES[0];

  function handleTemplateSelect(t: LayoutTemplate) {
    setTemplateId(t.id);
    setSlots({});
    setDirty(true);
    setSaved(false);
  }

  function handleSlotChange(slotId: string, productId: string | null) {
    setSlots((prev) => ({ ...prev, [slotId]: productId }));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await onSave(templateId, slots);
    setSaving(false);
    setSaved(true);
    setDirty(false);
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/50">
      {/* Page header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <svg
            className={`size-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="text-sm font-medium text-black dark:text-zinc-100">
            Page {page.page_order + 1}
          </span>
          <span className="text-xs text-zinc-400">{template.name}</span>
          {dirty && <span className="size-1.5 rounded-full bg-amber-400" />}
          {saved && !dirty && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>
          )}
        </button>

        {/* Reorder + delete */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            aria-label="Move page up"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            aria-label="Move page down"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10"
            aria-label="Delete page"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Page body */}
      {open && (
        <div className="flex flex-col gap-6 border-t border-black/8 p-4 dark:border-white/8">
          {/* Template picker */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Template</p>
            <TemplatePicker selectedId={templateId} onSelect={handleTemplateSelect} />
            <div className="mt-2 flex items-center gap-4">
              {(["hero", "featured", "small"] as SlotRole[]).map((role) => (
                <div key={role} className="flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-sm ${ROLE_COLORS[role].thumb}`} />
                  <span className="text-xs text-zinc-500">{ROLE_COLORS[role].label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Slot assignment */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Pin products to slots</p>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${template.cols}, 1fr)` }}
            >
              {template.slots.map((slot) => {
                const takenIds = new Set(
                  Object.entries(slots)
                    .filter(([sid, pid]) => sid !== slot.id && pid !== null)
                    .map(([, pid]) => pid as string)
                );
                return (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    assignedProductId={slots[slot.id] ?? null}
                    products={products}
                    takenIds={takenIds}
                    onChange={handleSlotChange}
                  />
                );
              })}
            </div>
          </section>

          {/* Save */}
          <div>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !dirty}
              className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {saving ? "Saving\u2026" : "Save page"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main editor page ──────────────────────────────────────────────────────────
export default function LayoutEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { supabase, adminState } = useAdminAuthContext();
  const isAuthorized = adminState.status === "authorized";

  const [layoutId, setLayoutId] = useState<string | null>(null);
  // Draft state — null means "use server value"
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [orientDraft, setOrientDraft] = useState<"portrait" | "landscape" | null>(null);

  // Resolve params — setState inside Promise callback, not synchronously in effect body
  useEffect(() => {
    params.then(({ id }) => setLayoutId(id));
  }, [params]);

  const { data: layout, isLoading } = useQuery(
    layoutDetailQueryOptions(layoutId, isAuthorized),
  );

  const { data: products = [] } = useQuery(
    activeProductsQueryOptions(supabase, isAuthorized),
  );

  const [pendingDeletePageId, setPendingDeletePageId] = useState<string | null>(null);

  const updateName = useUpdateLayout(layoutId);
  const updateOrientation = useUpdateLayout(layoutId);
  const addPageMutation = useAddPage(layoutId);
  const deletePageMutation = useDeletePage(layoutId);
  const savePageMutation = useSavePage(layoutId);
  const movePageMutation = useMovePage(layoutId);

  // Displayed values: use local draft if the user has typed, otherwise show server value
  const nameValue = nameDraft ?? layout?.name ?? "";
  const orientation = orientDraft ?? layout?.orientation ?? "landscape";

  async function saveName() {
    if (!layout || !layoutId) return;
    const name = nameValue.trim();
    if (!name || name === layout.name) return;
    await updateName.mutateAsync({ name });
    setNameDraft(null); // clear draft so server value is used after refetch
  }

  async function saveOrientation(o: "portrait" | "landscape") {
    setOrientDraft(o);
    await updateOrientation.mutateAsync({ orientation: o });
  }

  async function addPage() {
    if (!layout) return;
    await addPageMutation.mutateAsync(LAYOUT_TEMPLATES[0].id);
  }

  function deletePage(pageId: string) {
    setPendingDeletePageId(pageId);
  }

  async function confirmDeletePage() {
    if (!pendingDeletePageId) return;
    await deletePageMutation.mutateAsync(pendingDeletePageId);
    setPendingDeletePageId(null);
  }

  async function savePage(pageId: string, templateId: string, slots: Record<string, string | null>) {
    await savePageMutation.mutateAsync({ pageId, templateId, slots });
  }

  async function movePage(pageId: string, direction: "up" | "down") {
    if (!layout) return;
    await movePageMutation.mutateAsync({ pages: layout.pages, pageId, direction });
  }

  if (!isAuthorized) return null;

  const pages = layout ? [...layout.pages].sort((a, b) => a.page_order - b.page_order) : [];

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-8">
      {/* Back */}
      <Link
        href="/admin/layouts"
        className="flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        All layouts
      </Link>

      {isLoading ? (
        <p className="text-sm text-zinc-400">Loading&hellip;</p>
      ) : !layout ? (
        <p className="text-sm text-red-500">Layout not found.</p>
      ) : (
        <>
          {/* ── Layout settings ── */}
          <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
            <h1 className="text-lg font-semibold text-black dark:text-zinc-50">Layout settings</h1>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => void saveName()}
                  onKeyDown={(e) => e.key === "Enter" && void saveName()}
                  className="flex-1 rounded-lg border border-black/10 bg-zinc-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)] dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-100"
                />
                {updateName.isPending && <span className="self-center text-xs text-zinc-400">Saving&hellip;</span>}
              </div>
            </div>

            {/* Orientation */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">Orientation</label>
              <div className="flex gap-2">
                {(["landscape", "portrait"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    disabled={updateOrientation.isPending}
                    onClick={() => void saveOrientation(o)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-colors disabled:opacity-50 ${orientation === o ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]" : "border-black/10 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400"}`}
                  >
                    {o === "landscape" ? "Landscape (16:9)" : "Portrait (A4)"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Pages ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-black dark:text-zinc-100">
                Pages ({pages.length})
              </h2>
              <button
                type="button"
                disabled={addPageMutation.isPending}
                onClick={() => void addPage()}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {addPageMutation.isPending ? "Adding…" : "Add page"}
              </button>
            </div>

            {pages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white py-10 text-center dark:border-white/10 dark:bg-zinc-900">
                <p className="text-sm text-zinc-400">No pages yet. Add your first page above.</p>
              </div>
            ) : (
              pages.map((page, idx) => (
                <PageEditor
                  key={page.id}
                  page={page}
                  products={products}
                  isFirst={idx === 0}
                  isLast={idx === pages.length - 1}
                  onMoveUp={() => void movePage(page.id, "up")}
                  onMoveDown={() => void movePage(page.id, "down")}
                  onDelete={() => void deletePage(page.id)}
                  onSave={(templateId, slots) => savePage(page.id, templateId, slots)}
                />
              ))
            )}
          </div>

          {/* ── Go back ── */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/admin/layouts")}
              className="rounded-xl border border-black/10 bg-white px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Done
            </button>
          </div>
        </>
      )}

      {pendingDeletePageId && (
        <ConfirmModal
          title="Delete this page?"
          description="This action cannot be undone. All slot assignments on this page will be lost."
          confirmLabel="Delete page"
          isConfirming={deletePageMutation.isPending}
          onCancel={() => setPendingDeletePageId(null)}
          onConfirm={() => void confirmDeletePage()}
        />
      )}
    </div>
  );
}
