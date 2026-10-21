"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useT } from "@/context/LanguageContext";
import {
  addOfferGroup,
  deleteOfferGroup,
  reorderOfferGroups,
  setOfferGroupCategories,
  updateOfferGroup,
  type OfferGroupRecord,
} from "@/services/offer-groups";
import type { CategoryRow } from "@/types/admin";

import ImageField from "../_components/ImageField";
import Thumb from "../_components/Thumb";
import { revealEditor } from "../_components/reveal";
import { useAutoSave } from "../_components/useAutoSave";
import { categoriesQueryOptions, OFFER_GROUPS_KEY, offerGroupsQueryOptions } from "../products/_queries";

const byOrder = (x: CategoryRow, y: CategoryRow) => x.sort_order - y.sort_order || x.name.localeCompare(y.name, "el");

/** Ομάδες προσφορών: the groups at the top of the Προσφορές page. Saves as you go. */
export default function OfferGroupsEditor() {
  const a = useT().admin;
  const g = a.offerGroups;
  const c = a.categories;
  const { supabase, adminState } = useAdminAuthContext();
  const enabled = adminState.status === "authorized" && Boolean(supabase);

  const groups = useQuery(offerGroupsQueryOptions(supabase!, enabled));
  const categories = useQuery(categoriesQueryOptions(supabase!, enabled));
  const { save, run, pending, saved, error, setError } = useAutoSave<OfferGroupRecord[]>(OFFER_GROUPS_KEY);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const editorRef = useRef<HTMLElement>(null);

  const list = useMemo(() => [...(groups.data ?? [])].sort((x, y) => x.sort_order - y.sort_order || x.name.localeCompare(y.name, "el")), [groups.data]);
  const roots = useMemo(() => (categories.data ?? []).filter((x) => !x.parent_id).sort(byOrder), [categories.data]);
  const selected = list.find((x) => x.id === selectedId) ?? null;

  function update(id: string, patch: Partial<Pick<OfferGroupRecord, "name" | "image_url" | "is_visible" | "show_subcategories">>) {
    void save(
      (rows) => rows.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      () => updateOfferGroup(supabase!, id, patch),
    );
  }

  function toggleCategory(group: OfferGroupRecord, categoryId: string, on: boolean) {
    const ids = on ? [...group.category_ids, categoryId] : group.category_ids.filter((x) => x !== categoryId);
    // keep them in catalogue order, so the chips on the Offers page follow the menu
    const ordered = roots.map((r) => r.id).filter((id) => ids.includes(id));
    void save(
      (rows) => rows.map((x) => (x.id === group.id ? { ...x, category_ids: ordered } : x)),
      () => setOfferGroupCategories(supabase!, group.id, ordered),
    );
  }

  function move(index: number, delta: -1 | 1) {
    const next = [...list];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved);
    void save(
      () => next.map((x, i) => ({ ...x, sort_order: i })),
      () => reorderOfferGroups(supabase!, next),
    );
  }

  function remove(target: OfferGroupRecord) {
    setConfirm(false);
    setSelectedId(null);
    void save(
      (rows) => rows.filter((x) => x.id !== target.id),
      () => deleteOfferGroup(supabase!, target.id),
    );
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return setError(c.nameRequired);
    const order = list.reduce((max, x) => Math.max(max, x.sort_order), -1) + 1;
    const id = await run(() => addOfferGroup(supabase!, trimmed, order));
    if (id) {
      setNewName("");
      setSelectedId(id);
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
      {groups.error && (
        <p className="ka-error">
          {a.common.loadFailed} ({groups.error.message})
        </p>
      )}

      <div className="ka-builder">
        <div className="ka-builder-side">
          <section className="ka-card">
            <div className="ka-card-title">
              <h2>{g.listTitle}</h2>
              <span className="ka-count">{list.length}</span>
            </div>
            <p>{g.listHint}</p>
            <form className="ka-add-row" onSubmit={(e) => void add(e)}>
              <input className="ka-input" value={newName} maxLength={80} placeholder={g.addPlaceholder} aria-label={g.addPlaceholder} onChange={(e) => setNewName(e.target.value)} />
              <button type="submit" className="ka-btn-small" disabled={!enabled || pending > 0}>
                {c.add}
              </button>
            </form>
            {groups.isPending && enabled && <p className="ka-hint">{a.common.loading}</p>}
            <ol className="ka-rows">
              {list.map((x, i) => (
                <li key={x.id} className={x.id === selectedId ? "current" : undefined}>
                  <button
                    type="button"
                    className="ka-row"
                    aria-current={x.id === selectedId ? "true" : undefined}
                    onClick={() => {
                      setSelectedId(x.id);
                      setName(null);
                      setConfirm(false);
                      revealEditor(editorRef.current);
                    }}
                  >
                    <Thumb src={x.image_url} size={44} />
                    <span className="ka-row-text">
                      <b>{x.name}</b>
                      <small>
                        {g.catCount(x.category_ids.length)}
                        {!x.is_visible && <em className="ka-off"> · {g.hiddenTag}</em>}
                      </small>
                    </span>
                  </button>
                  <span className="ka-row-tools">
                    <button type="button" aria-label={`${c.moveUp}: ${x.name}`} disabled={i === 0} onClick={() => move(i, -1)}>
                      ↑
                    </button>
                    <button type="button" aria-label={`${c.moveDown}: ${x.name}`} disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                      ↓
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="ka-card ka-builder-main" aria-label={g.editTitle} ref={editorRef}>
          {!selected ? (
            <div className="ka-fslot-empty">
              <b aria-hidden="true">☜</b>
              <p>{g.pickOne}</p>
            </div>
          ) : (
            <>
              <div className="ka-card-title">
                <h2>{selected.name}</h2>
              </div>
              <label className="ka-field">
                {g.name}
                <input
                  value={name ?? selected.name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  onBlur={() => {
                    const next = name?.trim();
                    if (name !== null && !next) setError(c.nameRequired);
                    else if (next && next !== selected.name) update(selected.id, { name: next });
                    setName(null);
                  }}
                />
              </label>
              <ImageField
                key={`img-${selected.id}`}
                label={g.picture}
                value={selected.image_url}
                onChange={(url) => update(selected.id, { image_url: url })}
                folder="offer-groups"
                maxSide={400}
                aspect="1 / 1"
                previewMax={200}
                hint={g.pictureHint}
              />
              <label className="ka-check">
                <input type="checkbox" checked={selected.is_visible} onChange={(e) => update(selected.id, { is_visible: e.target.checked })} />
                <span>
                  <strong>{g.visible}</strong>
                  <small>{g.visibleHint}</small>
                </span>
              </label>

              <fieldset className="ka-fieldset ka-field">
                <legend>{g.categories}</legend>
                <small>{g.categoriesHint}</small>
                <div className="ka-checklist">
                  {roots.map((r) => (
                    <label key={r.id}>
                      <input
                        type="checkbox"
                        checked={selected.category_ids.includes(r.id)}
                        onChange={(e) => toggleCategory(selected, r.id, e.target.checked)}
                      />
                      <span>{r.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="ka-check">
                <input
                  type="checkbox"
                  checked={selected.show_subcategories}
                  onChange={(e) => update(selected.id, { show_subcategories: e.target.checked })}
                />
                <span>
                  <strong>{g.showSubs}</strong>
                  <small>{g.showSubsHint}</small>
                </span>
              </label>

              {confirm ? (
                <div className="ka-confirm">
                  <span>{g.deleteConfirm(selected.name)}</span>
                  <button type="button" className="ka-danger" onClick={() => remove(selected)}>
                    {a.common.yesDelete}
                  </button>
                  <button type="button" className="ka-text-btn" onClick={() => setConfirm(false)}>
                    {a.common.no}
                  </button>
                </div>
              ) : (
                <button type="button" className="ka-danger" onClick={() => setConfirm(true)}>
                  {g.deleteGroup}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
