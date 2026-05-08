"use client";

import { useState } from "react";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { deleteCategory, importCategories, insertCategory, renameCategory } from "@/services/categories";
import type { CompetitorCategory } from "@/app/api/competitor-categories/route";
import type { CategoryRow } from "@/types/admin";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import TextInput from "@/components/inputs/TextInput";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

type Props = {
  supabase: Client;
  categories: CategoryRow[];
  onRefresh: () => void;
};

export default function CategoryManager({ supabase, categories, onRefresh }: Props) {
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Group: top-level + their children
  const roots = categories.filter((c) => c.parent_id === null);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setIsAdding(true);
    setAddError(null);
    const { error } = await insertCategory(supabase, name);
    if (error) setAddError(error);
    else {
      setNewName("");
      onRefresh();
    }
    setIsAdding(false);
  }

  async function handleDelete(id: string) {
    const { error } = await deleteCategory(supabase, id);
    if (!error) onRefresh();
  }

  async function handleRenameSubmit(id: string) {
    const name = renameValue.trim();
    if (!name) return;
    const { error } = await renameCategory(supabase, id, name);
    if (!error) {
      setRenamingId(null);
      onRefresh();
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    setSyncError(null);
    setSyncMessage(null);

    let tree: CompetitorCategory[] = [];
    try {
      const res = await fetch("/api/competitor-categories");
      tree = await res.json();
    } catch {
      setSyncError("Failed to fetch e-katanalotis categories.");
      setIsSyncing(false);
      return;
    }

    // Build flat entries: top-level first, then subcategories
    // We need to insert top-level first to get their IDs, then insert subs
    const topEntries = tree.map((c, i) => ({
      name: c.name,
      sort_order: i,
      parent_id: null as string | null,
    }));

    const { error: topError } = await importCategories(supabase, topEntries);
    if (topError) {
      setSyncError(topError);
      setIsSyncing(false);
      return;
    }

    // Fetch newly inserted top-level categories to get their IDs
    const { data: topRows } = await supabase
      .from("categories")
      .select("id,name")
      .is("parent_id", null);

    const nameToId = new Map<string, string>(
      (topRows ?? []).map((r: { id: string; name: string }) => [r.name, r.id]),
    );

    // Build subcategory entries
    const subEntries: Array<{ name: string; sort_order: number; parent_id: string | null }> = [];
    tree.forEach((cat) => {
      const parentId = nameToId.get(cat.name);
      if (!parentId) return;
      cat.sub_categories.forEach((sub, si) => {
        subEntries.push({ name: sub.name, sort_order: si, parent_id: parentId });
      });
    });

    if (subEntries.length > 0) {
      // importCategories uses a different key format for subs — re-use the function
      const { error: subError } = await importCategories(supabase, subEntries);
      if (subError) {
        setSyncError(subError);
        setIsSyncing(false);
        return;
      }
    }

    setSyncMessage(`Synced ${topEntries.length} categories and ${subEntries.length} subcategories.`);
    onRefresh();
    setIsSyncing(false);
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-black dark:text-zinc-50">Categories</h2>
        <Button
          type="button"
          onClick={() => void handleSync()}
          disabled={isSyncing}
        >
          {isSyncing ? "Syncing…" : "Sync from e-katanalotis"}
        </Button>
      </div>

      {syncError ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{syncError}</p>
      ) : null}
      {syncMessage ? (
        <p className="mt-2 text-sm text-green-700 dark:text-green-400">{syncMessage}</p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <TextInput
          value={newName}
          onChange={setNewName}
          placeholder="New category name"
        />
        <Button
          type="button"
          onClick={() => void handleAdd()}
          disabled={isAdding || !newName.trim()}
        >
          {isAdding ? "Adding…" : "Add"}
        </Button>
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
            return (
              <li key={cat.id}>
                <div className="flex items-center gap-2 py-1.5">
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
                      <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {cat.name}
                        {subs.length > 0 ? (
                          <span className="ml-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                            ({subs.length})
                          </span>
                        ) : null}
                      </span>
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
                {subs.length > 0 ? (
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
    </Card>
  );
}
