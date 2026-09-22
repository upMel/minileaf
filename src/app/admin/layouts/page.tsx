"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import ConfirmModal from "@/app/admin/ConfirmModal";
import { useT } from "@/context/LanguageContext";
import {
  layoutsQueryOptions,
  useCreateLayout,
  useDeleteLayout,
  useUpdateLayout,
} from "./_queries";

export default function LayoutsPage() {
  const t = useT();
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
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">{t.layouts.title}</h1>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          <span className="whitespace-nowrap">{t.layouts.newLayout}</span>
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
        >
          <p className="text-sm font-medium text-black dark:text-zinc-100">{t.layouts.newLayout}</p>
          <input
            autoFocus
            type="text"
            placeholder={t.layouts.namePlaceholder}
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
                {o === "landscape" ? t.layouts.landscapeRatio : t.layouts.portraitRatio}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="flex-1 rounded-lg border border-black/10 bg-zinc-50 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={createLayout.isPending}
              className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {createLayout.isPending ? t.layouts.creating : t.layouts.create}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-zinc-500">{t.common.loading}</p>
      ) : layouts.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">{t.layouts.empty}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {layouts.map((layout) => (
            <li
              key={layout.id}
              className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-3 sm:gap-4 sm:px-4 dark:border-white/10 dark:bg-zinc-900"
            >
              {/* Active dot */}
              <span className={`size-2.5 shrink-0 rounded-full ${layout.is_active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-black dark:text-zinc-100">{layout.name}</span>
                <span className="text-xs text-zinc-500">
                  {layout.orientation === "landscape" ? t.leaflet.landscape : t.leaflet.portrait}
                </span>
              </div>

              {/* Actions — icon buttons so the row never outgrows a phone screen.
                  Labels stay available via title/aria-label. */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={updateLayout.isPending && updateLayout.variables?.id === layout.id}
                  onClick={() => (layout.is_active ? handleDeactivate(layout.id) : handleActivate(layout.id))}
                  title={layout.is_active ? t.common.active : t.layouts.setActive}
                  aria-label={layout.is_active ? t.common.active : t.layouts.setActive}
                  aria-pressed={layout.is_active}
                  className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                    layout.is_active
                      ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                      : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                  }`}
                >
                  {layout.is_active ? (
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
                    </svg>
                  ) : (
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </button>

                <Link
                  href={`/admin/layouts/${layout.id}`}
                  title={t.common.edit}
                  aria-label={t.common.edit}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </Link>

                <button
                  type="button"
                  disabled={deleteLayout.isPending && deleteLayout.variables === layout.id}
                  onClick={() => handleDelete(layout.id, layout.name)}
                  title={t.common.delete}
                  aria-label={t.common.delete}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" /><path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pendingDeleteLayout && (
        <ConfirmModal
          title={t.layouts.deleteTitle(pendingDeleteLayout.name)}
          description={t.common.cannotBeUndone}
          confirmLabel={t.layouts.deleteLayout}
          isConfirming={deleteLayout.isPending}
          onCancel={() => setPendingDeleteLayout(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  );
}
