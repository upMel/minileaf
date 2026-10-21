"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useT } from "@/context/LanguageContext";
import {
  DEFAULT_STORE_INFO,
  parseStoreInfo,
  STORE_CONFIG_KEY,
  StoreInfoSchema,
  WEEK_DISPLAY_ORDER,
  type StoreInfo,
  type WeekdayKey,
} from "@/types/catalog";

const STORE_KEY = ["store-info"] as const;

/** Store details + opening hours, saved as site_config 'store'. */
export default function AdminStorePage() {
  const t = useT();
  const s = t.admin.storeInfo;
  const days = t.store.hours.days;
  const { supabase, adminState } = useAdminAuthContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: STORE_KEY,
    enabled: adminState.status === "authorized" && Boolean(supabase),
    queryFn: async (): Promise<StoreInfo> => {
      const { data, error } = await supabase!.from("site_config").select("value").eq("key", STORE_CONFIG_KEY).maybeSingle();
      if (error) throw new Error(error.message);
      return parseStoreInfo(data?.value);
    },
  });

  const [form, setForm] = useState<StoreInfo>(DEFAULT_STORE_INFO);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Load the saved values into the form once they arrive.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time copy of fetched data into the editable form
    if (query.data) setForm(query.data);
  }, [query.data]);

  const set = (patch: Partial<StoreInfo>) => {
    setForm((f) => ({ ...f, ...patch }));
    setMessage(null);
  };
  const setDay = (day: WeekdayKey, value: [string, string] | null) => set({ hours: { ...form.hours, [day]: value } });

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    const value: StoreInfo = {
      ...form,
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      map_url: form.map_url.trim(),
    };
    if (!value.name || !value.phone || !value.address) return setError(s.errors.required);
    if (!/^https:\/\//.test(value.map_url)) return setError(s.errors.map);
    const badDay = WEEK_DISPLAY_ORDER.find((d) => {
      const h = value.hours[d];
      return h && !(h[0] < h[1]);
    });
    if (badDay) return setError(s.errors.hours(days[Number(badDay)]));
    const parsed = StoreInfoSchema.safeParse(value);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? s.errors.required);

    setBusy(true);
    setError(null);
    const { error: saveError } = await supabase.from("site_config").upsert({ key: STORE_CONFIG_KEY, value: parsed.data });
    setBusy(false);
    if (saveError) return setError(`${t.admin.products.errors.save} (${saveError.message})`);
    await queryClient.invalidateQueries({ queryKey: STORE_KEY });
    setMessage(t.admin.common.saved);
  }

  return (
    <>
      <div className="ka-intro">
        <p>{t.admin.eyebrow}</p>
        <h1>{s.title}</h1>
        <span>{s.subtitle}</span>
      </div>

      {query.error && <p className="ka-error">{t.admin.common.loadFailed} ({query.error.message})</p>}

      <div className="ka-layout single">
        <section className="ka-card">
          <form onSubmit={(e) => void save(e)} noValidate>
            <fieldset disabled={busy || query.isPending} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
              <div className="ka-pair">
                <label className="ka-field">
                  {s.name}
                  <input value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </label>
                <label className="ka-field">
                  {s.tagline}
                  <input value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} />
                </label>
              </div>
              <div className="ka-pair">
                <label className="ka-field">
                  {s.phone}
                  <input type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                </label>
                <label className="ka-field">
                  {s.address}
                  <input value={form.address} onChange={(e) => set({ address: e.target.value })} />
                </label>
              </div>
              <label className="ka-field">
                {s.mapUrl}
                <input inputMode="url" value={form.map_url} onChange={(e) => set({ map_url: e.target.value })} />
                <small>{s.mapHint}</small>
              </label>

              <div className="ka-hours">
                <span className="ka-hours-label">{s.hours}</span>
                {WEEK_DISPLAY_ORDER.map((d) => {
                  const h = form.hours[d];
                  const name = days[Number(d)];
                  return (
                    <div key={d} className="ka-hours-row">
                      <span>{name}</span>
                      <input
                        type="time"
                        aria-label={s.opens(name)}
                        value={h ? h[0] : "09:00"}
                        disabled={!h}
                        onChange={(e) => h && setDay(d, [e.target.value, h[1]])}
                      />
                      <input
                        type="time"
                        aria-label={s.closes(name)}
                        value={h ? h[1] : "18:00"}
                        disabled={!h}
                        onChange={(e) => h && setDay(d, [h[0], e.target.value])}
                      />
                      <label className="ka-closed">
                        <input type="checkbox" checked={!h} onChange={(e) => setDay(d, e.target.checked ? null : ["09:00", "18:00"])} />
                        {s.closed}
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {error && (
              <p className="ka-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="ka-success" role="status">
                {message}
              </p>
            )}
            <div className="ka-actions">
              <button type="submit" className="ka-btn" disabled={busy || query.isPending}>
                {busy ? t.admin.common.saving : s.saveStore}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
