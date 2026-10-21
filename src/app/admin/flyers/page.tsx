"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useT } from "@/context/LanguageContext";
import { createFlyer, deleteFlyer, setFlyerActive, type Orientation } from "@/services/flyers";

import { FLYERS_KEY, flyersQueryOptions } from "./_queries";

/** Φυλλάδια: create a flyer, switch one on, open one to edit its pages. */
export default function AdminFlyersPage() {
  const t = useT().admin;
  const f = t.flyers;
  const { supabase, adminState } = useAdminAuthContext();
  const queryClient = useQueryClient();
  const router = useRouter();
  const enabled = adminState.status === "authorized" && Boolean(supabase);

  const flyers = useQuery(flyersQueryOptions(supabase!, enabled));

  const [name, setName] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: FLYERS_KEY });
    } catch (e) {
      setError(`${t.common.failed} (${e instanceof Error ? e.message : String(e)})`);
    } finally {
      setBusy(false);
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (!name.trim()) return setError(f.errors.name);
    let id = "";
    await run(async () => {
      id = await createFlyer(supabase, name.trim(), orientation);
    });
    if (id) router.push(`/admin/flyers/${id}`);
  }

  return (
    <>
      <div className="ka-intro">
        <p>{t.eyebrow}</p>
        <h1>{f.title}</h1>
        <span>{f.subtitle}</span>
      </div>

      {error && (
        <p className="ka-error" role="alert">
          {error}
        </p>
      )}
      {flyers.error && <p className="ka-error">{t.common.loadFailed} ({flyers.error.message})</p>}

      <div className="ka-layout">
        <section className="ka-card">
          <div className="ka-card-title">
            <h2>{f.newFlyer}</h2>
          </div>
          <p>{f.newFlyerText}</p>
          <form onSubmit={(e) => void create(e)} noValidate>
            <fieldset disabled={busy} className="ka-fieldset">
              <label className="ka-field">
                {f.name}
                <input value={name} maxLength={80} placeholder={f.namePlaceholder} onChange={(e) => setName(e.target.value)} />
              </label>
              <div className="ka-field">
                <span>{f.orientation}</span>
                <div className="ka-seg" role="group" aria-label={f.orientation}>
                  <button type="button" aria-pressed={orientation === "portrait"} onClick={() => setOrientation("portrait")}>
                    {f.portrait}
                  </button>
                  <button type="button" aria-pressed={orientation === "landscape"} onClick={() => setOrientation("landscape")}>
                    {f.landscape}
                  </button>
                </div>
                <small>{f.orientationHint}</small>
              </div>
              <div className="ka-actions">
                <button type="submit" className="ka-btn">
                  {f.create}
                </button>
              </div>
            </fieldset>
          </form>
        </section>

        <section className="ka-card">
          <div className="ka-card-title">
            <h2>{f.yourFlyers}</h2>
            <Link className="ka-text-btn" href="/flyer" target="_blank">
              {f.viewLive} ↗
            </Link>
          </div>
          {flyers.isPending && <p className="ka-hint">{t.common.loading}</p>}
          {flyers.data?.length === 0 && (
            <div className="ka-empty">
              <h3>{f.emptyTitle}</h3>
              <p>{f.emptyText}</p>
            </div>
          )}
          <div className="ka-list">
            {flyers.data?.map((x) => (
              <article key={x.id} className={x.is_active ? "editing" : undefined}>
                <span className={`ka-orient ${x.orientation}`} aria-hidden="true" />
                <div>
                  <h3>{x.name}</h3>
                  <p>
                    {x.orientation === "portrait" ? f.portrait : f.landscape} · {f.pages(x.pageCount)}
                  </p>
                  <div className="ka-tags">{x.is_active ? <span className="live">{f.live}</span> : <span>{f.notLive}</span>}</div>
                </div>
                <div className="ka-row-actions">
                  <Link className="ka-btn-small" href={`/admin/flyers/${x.id}`}>
                    {t.common.edit}
                  </Link>
                  <button
                    type="button"
                    className="ka-btn-small"
                    disabled={busy}
                    onClick={() => void run(() => setFlyerActive(supabase!, x.id, !x.is_active))}
                  >
                    {x.is_active ? f.turnOff : f.turnOn}
                  </button>
                  {confirmId === x.id ? (
                    <span className="ka-confirm-inline">
                      <button
                        type="button"
                        className="ka-danger-small"
                        disabled={busy}
                        onClick={() => {
                          setConfirmId(null);
                          void run(() => deleteFlyer(supabase!, x.id));
                        }}
                      >
                        {t.common.yesDelete}
                      </button>
                      <button type="button" className="ka-text-btn" onClick={() => setConfirmId(null)}>
                        {t.common.no}
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="ka-text-btn ka-text-danger" disabled={busy} onClick={() => setConfirmId(x.id)}>
                      {t.common.delete}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
