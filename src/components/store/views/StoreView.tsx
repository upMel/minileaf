"use client";

import { useT } from "@/context/LanguageContext";
import { telHref } from "@/lib/routes";
import { WEEK_DISPLAY_ORDER, type StoreInfo } from "@/types/catalog";

import OpenStatus from "../OpenStatus";
import { useStoreClock } from "../useStoreClock";

/** Το κατάστημα: phone, address + map, live status and the weekly hours. */
export default function StoreView({ store }: { store: StoreInfo }) {
  const t = useT().store;
  const p = t.storePage;
  const today = useStoreClock()?.day ?? null;

  return (
    <section className="ks-contact">
      <div>
        <h1>{p.contact}</h1>
        <p className="ks-contact-name">{store.name}</p>
        <p>{store.tagline}</p>
        <p>
          {p.phone}{" "}
          <a className="ks-contact-phone" href={telHref(store.phone)}>
            {store.phone}
          </a>
        </p>
        <p>
          <b>{p.address}</b> {store.address}
        </p>
        <p>
          <a className="ks-btn" href={store.map_url} target="_blank" rel="noopener noreferrer">
            {p.directions} ›
          </a>
        </p>
        <div className="ks-contact-status">
          <OpenStatus hours={store.hours} />
        </div>
      </div>
      <div>
        <h2>{p.hoursTitle}</h2>
        <dl className="ks-hours">
          {WEEK_DISPLAY_ORDER.map((d) => {
            const h = store.hours[d];
            const isToday = d === today;
            return (
              <div key={d} className={isToday ? "today" : undefined}>
                <dt>
                  {t.hours.days[Number(d)]}
                  {isToday && ` ${p.today}`}
                </dt>
                <dd>{h ? `${h[0]}–${h[1]}` : t.hours.closed}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
