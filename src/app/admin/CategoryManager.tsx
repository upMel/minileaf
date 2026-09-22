"use client";

import { useState } from "react";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { CategoryRow } from "@/types/admin";
import Button from "@/components/ui/Button";
import TextInput from "@/components/inputs/TextInput";
import { useT } from "@/context/LanguageContext";
import {
  useClearAllCategories,
  useDeleteCategory,
  useInsertCategory,
  useRenameCategory,
  useSyncCategories,
} from "./categories/_queries";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

type Props = {
  supabase: Client;
  categories: CategoryRow[];
};

export default function CategoryManager({ supabase, categories }: Props) {
  const t = useT();
  const insertMutation = useInsertCategory(supabase);
  const deleteMutation = useDeleteCategory(supabase);
  const renameMutation = useRenameCategory(supabase);
  const clearAllMutation = useClearAllCategories(supabase);
  const syncMutation = useSyncCategories(supabase);
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState("");  // "" = root
  const [addError, setAddError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Collapsed by default for roots that have subcategories
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const [clearConfirm, setClearConfirm] = useState(false);

  async function handleClearAll() {
    const { error } = await clearAllMutation.mutateAsync();
    if (error) return; // query is still invalidated via onSuccess even on service-level errors
    setClearConfirm(false);
  }

  // Group: top-level + their children
  const roots = categories.filter((c) => c.parent_id === null);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setAddError(null);
    const { error } = await insertMutation.mutateAsync({ name, parentId: newParentId || undefined });
    if (error) setAddError(error);
    else setNewName("");
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id);
  }

  async function handleRenameSubmit(id: string) {
    const name = renameValue.trim();
    if (!name) return;
    const { error } = await renameMutation.mutateAsync({ id, name });
    if (!error) setRenamingId(null);
  }

  async function handleSync() {
    setSyncMessage(null);
    try {
      const { topCount, subCount, linked } = await syncMutation.mutateAsync();
      const relinkedNote = linked > 0 ? t.categories.relinked(linked) : "";
      setSyncMessage(`${t.categories.synced(topCount, subCount)}${relinkedNote}`);
    } catch {
      // syncMutation.error carries the message — rendered below
    }
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-black/10 py-2 dark:border-white/10">
          {categories.length > 0 && !clearConfirm && (
            <button
              type="button"
              onClick={() => setClearConfirm(true)}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
            >
              {t.common.clearAll}
            </button>
          )}
          {clearConfirm && (
            <>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{t.categories.confirmDeleteAll}</span>
              <button
                type="button"
                onClick={() => void handleClearAll()}
                disabled={clearAllMutation.isPending}
                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400"
              >
                {clearAllMutation.isPending ? t.categories.clearing : t.categories.yesClearAll}
              </button>
              <button
                type="button"
                onClick={() => setClearConfirm(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {t.common.cancel}
              </button>
            </>
          )}
          <Button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? t.categories.syncing : t.categories.syncFromSource}
          </Button>
      </div>  {/* end actions row */}
      {clearAllMutation.isError ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {clearAllMutation.error instanceof Error ? clearAllMutation.error.message : t.categories.clearFailed}
        </p>
      ) : null}

      {syncMutation.isError ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {syncMutation.error instanceof Error ? syncMutation.error.message : t.categories.syncFailed}
        </p>
      ) : null}
      {syncMessage ? (
        <p className="mt-2 text-sm text-green-700 dark:text-green-400">{syncMessage}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="min-w-0 flex-1">
            <TextInput
              value={newName}
              onChange={setNewName}
              placeholder={t.categories.namePlaceholder}
            />
          </div>
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value)}
            className="h-9 w-full min-w-0 rounded-xl border border-black/10 bg-white px-3 text-sm text-zinc-700 focus:outline-none sm:w-44 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="">{t.categories.rootCategory}</option>
            {roots.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <Button
            type="button"
            className="w-full shrink-0 sm:w-auto"
            onClick={() => void handleAdd()}
            disabled={insertMutation.isPending || !newName.trim()}
          >
            {insertMutation.isPending ? t.common.adding : t.common.add}
          </Button>
        </div>
        {newParentId === "" && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {t.categories.rootHint}
          </p>
        )}
      </div>
      {addError ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{addError}</p>
      ) : null}

      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {t.categories.empty}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-black/5 dark:divide-white/5">
          {roots.map((cat) => {
            const subs = childrenOf(cat.id);
            const isExpanded = expandedIds.has(cat.id);
            return (
              <li key={cat.id}>
                <div className="flex items-center gap-2 py-1.5">
                  {/* Chevron toggle — only for roots with children */}
                  {subs.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(cat.id)}
                      className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      aria-label={isExpanded ? t.common.collapse : t.common.expand}
                    >
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}
                  {renamingId === cat.id ? (
                    <>
                      <div className="min-w-0 flex-1">
                        <TextInput
                          value={renameValue}
                          onChange={setRenameValue}
                        />
                      </div>
                      <Button type="button" onClick={() => void handleRenameSubmit(cat.id)}>
                        {t.common.save}
                      </Button>
                      <Button type="button" onClick={() => setRenamingId(null)}>
                        {t.common.cancel}
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => subs.length > 0 ? toggleExpanded(cat.id) : undefined}
                        className={`min-w-0 flex-1 text-left text-sm font-medium break-words text-zinc-800 dark:text-zinc-200 ${subs.length > 0 ? "cursor-pointer" : "cursor-default"}`}
                      >
                        {cat.name}
                        {subs.length > 0 ? (
                          <span className="ml-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                            ({subs.length})
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRenamingId(cat.id); setRenameValue(cat.name); }}
                        className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      >
                        {t.common.rename}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(cat.id)}
                        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        {t.common.delete}
                      </button>
                    </>
                  )}
                </div>
                {subs.length > 0 && isExpanded ? (
                  <ul className="mb-1 ml-4 divide-y divide-black/5 dark:divide-white/5">
                    {subs.map((sub) => (
                      <li key={sub.id} className="flex items-center gap-2 py-1">
                        {renamingId === sub.id ? (
                          <>
                            <div className="min-w-0 flex-1">
                              <TextInput value={renameValue} onChange={setRenameValue} />
                            </div>
                            <Button type="button" onClick={() => void handleRenameSubmit(sub.id)}>{t.common.save}</Button>
                            <Button type="button" onClick={() => setRenamingId(null)}>{t.common.cancel}</Button>
                          </>
                        ) : (
                          <>
                            <span className="min-w-0 flex-1 break-words text-sm text-zinc-600 dark:text-zinc-400">
                              {sub.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => { setRenamingId(sub.id); setRenameValue(sub.name); }}
                              className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            >
                              {t.common.rename}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(sub.id)}
                              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                            >
                              {t.common.delete}
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
