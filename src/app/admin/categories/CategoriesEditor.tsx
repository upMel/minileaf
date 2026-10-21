"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useT } from "@/context/LanguageContext";
import {
  addCategory,
  CategoryError,
  deleteCategory,
  FK_VIOLATION,
  reorderCategories,
  syncCategoriesFromCompetitor,
  UNIQUE_VIOLATION,
  updateCategory,
} from "@/services/categories";
import type { CategoryRow } from "@/types/admin";

import ImageField from "../_components/ImageField";
import Thumb from "../_components/Thumb";
import { revealEditor } from "../_components/reveal";
import { errorText, useAutoSave } from "../_components/useAutoSave";
import { ADMIN_PRODUCTS_KEY, adminProductsQueryOptions, CATEGORIES_KEY, categoriesQueryOptions } from "../products/_queries";

const byOrder = (x: CategoryRow, y: CategoryRow) => x.sort_order - y.sort_order || x.name.localeCompare(y.name, "el");

/** Name field that saves when you leave it (or press Enter); empty names are refused. */
function NameInput({ value, onSave, label }: { value: string; onSave: (name: string) => void; label: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      className="ka-input"
      aria-label={label}
      value={draft ?? value}
      maxLength={120}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(null);
      }}
      onBlur={() => {
        if (draft !== null && draft.trim() !== value) onSave(draft.trim());
        setDraft(null);
      }}
    />
  );
}

/** Κατηγορίες: top-level categories (picture, order) and their subcategories. Saves as you go. */
export default function CategoriesEditor() {
  const a = useT().admin;
  const c = a.categories;
  const { supabase, adminState } = useAdminAuthContext();
  const enabled = adminState.status === "authorized" && Boolean(supabase);
  const queryClient = useQueryClient();

  const categories = useQuery(categoriesQueryOptions(supabase!, enabled));
  const products = useQuery(adminProductsQueryOptions(supabase!, enabled));
  const { save, run, pending, saved, error, setError } = useAutoSave<CategoryRow[]>(CATEGORIES_KEY);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newSub, setNewSub] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const editorRef = useRef<HTMLElement>(null);

  const all = useMemo(() => categories.data ?? [], [categories.data]);
  const roots = useMemo(() => all.filter((x) => !x.parent_id).sort(byOrder), [all]);
  const subsOf = (id: string) => all.filter((x) => x.parent_id === id).sort(byOrder);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products.data ?? []) if (p.category_id) m.set(p.category_id, (m.get(p.category_id) ?? 0) + 1);
    return m;
  }, [products.data]);
  const productCount = (id: string) => (counts.get(id) ?? 0) + subsOf(id).reduce((n, s) => n + (counts.get(s.id) ?? 0), 0);

  const selected = roots.find((x) => x.id === selectedId) ?? null;
  const subs = selected ? subsOf(selected.id) : [];

  function describe(e: unknown) {
    if (e instanceof CategoryError && e.code === FK_VIOLATION) return c.inUse;
    if (e instanceof CategoryError && e.code === UNIQUE_VIOLATION) return c.duplicate;
    return errorText(a.common.failed, e);
  }

  function patchLocal(id: string, patch: Partial<CategoryRow>) {
    return (list: CategoryRow[]) => list.map((x) => (x.id === id ? { ...x, ...patch } : x));
  }

  function rename(id: string, name: string) {
    if (!name) return setError(c.nameRequired);
    void save(patchLocal(id, { name }), () => updateCategory(supabase!, id, { name }), describe);
  }

  function setPicture(id: string, url: string | null) {
    void save(patchLocal(id, { image_url: url }), () => updateCategory(supabase!, id, { image_url: url }), describe);
  }

  function move(list: CategoryRow[], index: number, delta: -1 | 1) {
    const next = [...list];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved);
    const order = new Map(next.map((x, i) => [x.id, i]));
    void save(
      (rows) => rows.map((x) => (order.has(x.id) ? { ...x, sort_order: order.get(x.id)! } : x)),
      () => reorderCategories(supabase!, next),
      describe,
    );
  }

  function remove(target: CategoryRow) {
    setConfirm(null);
    if (target.id === selectedId) setSelectedId(null);
    void save(
      (rows) => rows.filter((x) => x.id !== target.id && x.parent_id !== target.id),
      () => deleteCategory(supabase!, target.id),
      describe,
    );
  }

  async function add(e: FormEvent, parentId: string | null) {
    e.preventDefault();
    const name = (parentId ? newSub : newName).trim();
    if (!name) return setError(c.nameRequired);
    const siblings = parentId ? subsOf(parentId) : roots;
    const order = siblings.reduce((max, x) => Math.max(max, x.sort_order), -1) + 1;
    const id = await run(() => addCategory(supabase!, name, parentId, order), describe);
    if (!id) return;
    if (parentId) setNewSub("");
    else {
      setNewName("");
      setSelectedId(id);
    }
  }

  async function sync() {
    setSyncNote(null);
    setSyncing(true);
    const result = await run(() => syncCategoriesFromCompetitor(supabase!));
    setSyncing(false);
    if (result) {
      setSyncNote(c.synced(result.added, result.linked));
      if (result.linked > 0) void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
    }
  }

  return (
    <>
      <div className="ka-status" role="status" aria-live="polite">
        {pending > 0 ? a.common.saving : saved ? c.saved : ""}
      </div>
      {error && (
        <p className="ka-error" role="alert">
          {error}
        </p>
      )}
      {categories.error && (
        <p className="ka-error">
          {a.common.loadFailed} ({categories.error.message})
        </p>
      )}

      <div className="ka-builder">
        <div className="ka-builder-side">
          <section className="ka-card">
            <div className="ka-card-title">
              <h2>{c.listTitle}</h2>
              <span className="ka-count">{roots.length}</span>
            </div>
            <form className="ka-add-row" onSubmit={(e) => void add(e, null)}>
              <input className="ka-input" value={newName} maxLength={120} placeholder={c.addPlaceholder} aria-label={c.addPlaceholder} onChange={(e) => setNewName(e.target.value)} />
              <button type="submit" className="ka-btn-small" disabled={!enabled || pending > 0}>
                {c.add}
              </button>
            </form>
            {categories.isPending && enabled && <p className="ka-hint">{a.common.loading}</p>}
            <ol className="ka-rows">
              {roots.map((x, i) => (
                <li key={x.id} className={x.id === selectedId ? "current" : undefined}>
                  <button
                    type="button"
                    className="ka-row"
                    aria-current={x.id === selectedId ? "true" : undefined}
                    onClick={() => {
                      setSelectedId(x.id);
                      setConfirm(null);
                      setNewSub("");
                      revealEditor(editorRef.current);
                    }}
                  >
                    <Thumb src={x.image_url} size={44} />
                    <span className="ka-row-text">
                      <b>{x.name}</b>
                      <small>
                        {c.subCount(subsOf(x.id).length)} · {c.productCount(productCount(x.id))}
                      </small>
                    </span>
                  </button>
                  <span className="ka-row-tools">
                    <button type="button" aria-label={`${c.moveUp}: ${x.name}`} disabled={i === 0} onClick={() => move(roots, i, -1)}>
                      ↑
                    </button>
                    <button type="button" aria-label={`${c.moveDown}: ${x.name}`} disabled={i === roots.length - 1} onClick={() => move(roots, i, 1)}>
                      ↓
                    </button>
                  </span>
                </li>
              ))}
            </ol>
            <div className="ka-sync">
              <button type="button" className="ka-btn-small" disabled={!enabled || pending > 0} onClick={() => void sync()}>
                {syncing ? c.syncing : c.sync}
              </button>
              <small className="ka-hint">{c.syncHint}</small>
              {syncNote && <p className="ka-success">{syncNote}</p>}
            </div>
          </section>
        </div>

        <section className="ka-card ka-builder-main" aria-label={c.editTitle} ref={editorRef}>
          {!selected ? (
            <div className="ka-fslot-empty">
              <b aria-hidden="true">☜</b>
              <p>{c.pickOne}</p>
            </div>
          ) : (
            <>
              <div className="ka-card-title">
                <h2>{selected.name}</h2>
                <span className="ka-count">{c.productCount(productCount(selected.id))}</span>
              </div>
              <label className="ka-field">
                {c.name}
                <NameInput key={selected.id} label={c.name} value={selected.name} onSave={(name) => rename(selected.id, name)} />
              </label>
              <ImageField
                key={`img-${selected.id}`}
                label={c.picture}
                value={selected.image_url ?? null}
                onChange={(url) => setPicture(selected.id, url)}
                folder="categories"
                maxSide={800}
                aspect="1 / 1"
                previewMax={240}
                hint={c.pictureHint}
              />

              <div className="ka-field">
                <span>{c.subsTitle}</span>
              </div>
              {subs.length === 0 && <p className="ka-hint">{c.subsEmpty}</p>}
              <ol className="ka-subs">
                {subs.map((s, i) => (
                  <li key={s.id}>
                    <NameInput label={`${c.name}: ${s.name}`} value={s.name} onSave={(name) => rename(s.id, name)} />
                    <small>{c.productCount(counts.get(s.id) ?? 0)}</small>
                    <span className="ka-row-tools">
                      <button type="button" aria-label={`${c.moveUp}: ${s.name}`} disabled={i === 0} onClick={() => move(subs, i, -1)}>
                        ↑
                      </button>
                      <button type="button" aria-label={`${c.moveDown}: ${s.name}`} disabled={i === subs.length - 1} onClick={() => move(subs, i, 1)}>
                        ↓
                      </button>
                    </span>
                    {confirm === s.id ? (
                      <span className="ka-confirm-inline">
                        <button type="button" className="ka-danger-small" onClick={() => remove(s)}>
                          {a.common.yesDelete}
                        </button>
                        <button type="button" className="ka-text-btn" onClick={() => setConfirm(null)}>
                          {a.common.no}
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="ka-text-btn ka-text-danger" aria-label={`${c.deleteSub}: ${s.name}`} onClick={() => setConfirm(s.id)}>
                        {c.deleteSub}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
              <form className="ka-add-row" onSubmit={(e) => void add(e, selected.id)}>
                <input className="ka-input" value={newSub} maxLength={120} placeholder={c.addSubPlaceholder} aria-label={c.addSubPlaceholder} onChange={(e) => setNewSub(e.target.value)} />
                <button type="submit" className="ka-btn-small" disabled={pending > 0}>
                  {c.add}
                </button>
              </form>

              {confirm === selected.id ? (
                <div className="ka-confirm">
                  <span>{c.deleteConfirm(selected.name)}</span>
                  <button type="button" className="ka-danger" onClick={() => remove(selected)}>
                    {a.common.yesDelete}
                  </button>
                  <button type="button" className="ka-text-btn" onClick={() => setConfirm(null)}>
                    {a.common.no}
                  </button>
                </div>
              ) : (
                <button type="button" className="ka-danger" onClick={() => setConfirm(selected.id)}>
                  {c.deleteCategory}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
