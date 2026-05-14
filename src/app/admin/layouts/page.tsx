"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Layout = {
  id: string;
  name: string;
  orientation: "portrait" | "landscape";
  is_active: boolean;
  created_at: string;
};

export default function LayoutsPage() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOrientation, setNewOrientation] = useState<"portrait" | "landscape">("landscape");
  const [busy, setBusy] = useState<string | null>(null); // layout id being acted on

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/layouts");
    if (res.ok) setLayouts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusy("new");
    const res = await fetch("/api/layouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, orientation: newOrientation }),
    });
    if (res.ok) {
      setNewName("");
      setCreating(false);
      await load();
    }
    setBusy(null);
  }

  async function handleActivate(id: string) {
    setBusy(id);
    await fetch(`/api/layouts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    });
    await load();
    setBusy(null);
  }

  async function handleDeactivate(id: string) {
    setBusy(id);
    await fetch(`/api/layouts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });
    await load();
    setBusy(null);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete layout "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    await fetch(`/api/layouts/${id}`, { method: "DELETE" });
    await load();
    setBusy(null);
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
              disabled={busy === "new"}
              className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {busy === "new" ? "Creating…" : "Create"}
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
                    disabled={busy === layout.id}
                    onClick={() => handleDeactivate(layout.id)}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                  >
                    Active
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy === layout.id}
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
                  disabled={busy === layout.id}
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
    </div>
  );
}
