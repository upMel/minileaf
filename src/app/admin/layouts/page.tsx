"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import ConfirmModal from "@/app/admin/ConfirmModal";
import {
  layoutsQueryOptions,
  useCreateLayout,
  useDeleteLayout,
  useUpdateLayout,
} from "./_queries";

export default function LayoutsPage() {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOrientation, setNewOrientation] = useState<"portrait" | "landscape">("landscape");

  const [pendingDeleteLayout, setPendingDeleteLayout] = useState<{ id: string; name: string } | null>(null);

  const { data: layouts = [], isLoading: loading } = useQuery(layoutsQueryOptions);
  const createLayout = useCreateLayout();
  const updateLayout = useUpdateLayout();
  const deleteLayout = useDeleteLayout();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await createLayout.mutateAsync({ name, orientation: newOrientation });
    setNewName("");
    setCreating(false);
  }

  async function handleActivate(id: string) {
    await updateLayout.mutateAsync({ id, is_active: true });
  }

  async function handleDeactivate(id: string) {
    await updateLayout.mutateAsync({ id, is_active: false });
  }

  function handleDelete(id: string, name: string) {
    setPendingDeleteLayout({ id, name });
  }

  async function confirmDelete() {
    if (!pendingDeleteLayout) return;
    await deleteLayout.mutateAsync(pendingDeleteLayout.id);
    setPendingDeleteLayout(null);
  }

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Leaflet Layouts</h1>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          New layout
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
        >
          <p className="text-sm font-medium text-black dark:text-zinc-100">New layout</p>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Week 20 Offers"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-lg border border-black/10 bg-zinc-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)] dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <div className="flex gap-2">
            {(["landscape", "portrait"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setNewOrientation(o)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-colors ${newOrientation === o ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]" : "border-black/10 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400"}`}
              >
                {o === "landscape" ? "Landscape (16:9)" : "Portrait (A4)"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="flex-1 rounded-lg border border-black/10 bg-zinc-50 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLayout.isPending}
              className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {createLayout.isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : layouts.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">No layouts yet. Create one above.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {layouts.map((layout) => (
            <li
              key={layout.id}
              className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-900"
            >
              {/* Active dot */}
              <span className={`size-2.5 shrink-0 rounded-full ${layout.is_active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />

              {/* Info */}
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <span className="truncate text-sm font-medium text-black dark:text-zinc-100">{layout.name}</span>
                <span className="text-xs capitalize text-zinc-500">{layout.orientation}</span>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                {layout.is_active ? (
                  <button
                    type="button"
                    disabled={updateLayout.isPending && updateLayout.variables?.id === layout.id}
                    onClick={() => handleDeactivate(layout.id)}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                  >
                    Active
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updateLayout.isPending && updateLayout.variables?.id === layout.id}
                    onClick={() => handleActivate(layout.id)}
                    className="rounded-lg border border-black/10 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    Set active
                  </button>
                )}

                <Link
                  href={`/admin/layouts/${layout.id}`}
                  className="rounded-lg border border-black/10 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  Edit
                </Link>

                <button
                  type="button"
                  disabled={deleteLayout.isPending && deleteLayout.variables === layout.id}
                  onClick={() => handleDelete(layout.id, layout.name)}
                  className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-3 py-1.5 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pendingDeleteLayout && (
        <ConfirmModal
          title={`Delete "${pendingDeleteLayout.name}"?`}
          description="This action cannot be undone."
          confirmLabel="Delete layout"
          isConfirming={deleteLayout.isPending}
          onCancel={() => setPendingDeleteLayout(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  );
}
