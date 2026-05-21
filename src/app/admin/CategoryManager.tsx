"use client";

import { useState } from "react";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { CategoryRow } from "@/types/admin";
import Button from "@/components/ui/Button";
import TextInput from "@/components/inputs/TextInput";
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
      const relinkedNote = linked > 0 ? ` Re-linked ${linked} product${linked !== 1 ? "s" : ""}.` : "";
      setSyncMessage(`Synced ${topCount} categories and ${subCount} subcategories.${relinkedNote}`);
    } catch {
      // syncMutation.error carries the message — rendered below
    }
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-end gap-2 border-b border-black/10 py-2 dark:border-white/10">
          {categories.length > 0 && !clearConfirm && (
            <button
              type="button"
              onClick={() => setClearConfirm(true)}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
            >
              Clear all
            </button>
          )}
          {clearConfirm && (
            <>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Delete all categories?</span>
              <button
                type="button"
                onClick={() => void handleClearAll()}
                disabled={clearAllMutation.isPending}
                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400"
              >
                {clearAllMutation.isPending ? "Clearing…" : "Yes, clear all"}
              </button>
              <button
                type="button"
                onClick={() => setClearConfirm(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
            </>
          )}
          <Button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? "Syncing…" : "Sync from e-katanalotis"}
          </Button>
      </div>  {/* end actions row */}
      {clearAllMutation.isError ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {clearAllMutation.error instanceof Error ? clearAllMutation.error.message : "Clear failed"}
        </p>
      ) : null}

      {syncMutation.isError ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {syncMutation.error instanceof Error ? syncMutation.error.message : "Sync failed"}
        </p>
      ) : null}
      {syncMessage ? (
        <p className="mt-2 text-sm text-green-700 dark:text-green-400">{syncMessage}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <TextInput
            value={newName}
            onChange={setNewName}
            placeholder="Category name"
          />
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value)}
            className="h-9 rounded-xl border border-black/10 bg-white px-3 text-sm text-zinc-700 focus:outline-none dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="">Root category</option>
            {roots.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <Button
            type="button"
            onClick={() => void handleAdd()}
            disabled={insertMutation.isPending || !newName.trim()}
          >
            {insertMutation.isPending ? "Adding…" : "Add"}
          </Button>
        </div>
        {newParentId === "" && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            No parent selected — will be added as a root category.
          </p>
        )}
      </div>
      {addError ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{addError}</p>
      ) : null}

      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          No categories yet. Add one above or sync from e-katanalotis.
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
                      aria-label={isExpanded ? "Collapse" : "Expand"}
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
                      <TextInput
                        value={renameValue}
                        onChange={setRenameValue}
                      />
                      <Button type="button" onClick={() => void handleRenameSubmit(cat.id)}>
                        Save
                      </Button>
                      <Button type="button" onClick={() => setRenamingId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => subs.length > 0 ? toggleExpanded(cat.id) : undefined}
                        className={`flex-1 text-left text-sm font-medium text-zinc-800 dark:text-zinc-200 ${subs.length > 0 ? "cursor-pointer" : "cursor-default"}`}
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
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(cat.id)}
                        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        Delete
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
                            <TextInput value={renameValue} onChange={setRenameValue} />
                            <Button type="button" onClick={() => void handleRenameSubmit(sub.id)}>Save</Button>
                            <Button type="button" onClick={() => setRenamingId(null)}>Cancel</Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                              {sub.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => { setRenamingId(sub.id); setRenameValue(sub.name); }}
                              className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(sub.id)}
                              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                            >
                              Delete
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
