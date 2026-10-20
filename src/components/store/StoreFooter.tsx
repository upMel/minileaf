"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useT } from "@/context/LanguageContext";
import { routes, telHref } from "@/lib/routes";
import { WEEK_DISPLAY_ORDER, type StoreInfo } from "@/types/catalog";

import { ChevronDownIcon, PhoneIcon, PinIcon } from "./icons";
import OpenStatus from "./OpenStatus";
import StoreLanguageToggle from "./StoreLanguageToggle";
import { useStoreClock } from "./useStoreClock";

type Props = { store: StoreInfo; demo: boolean };

/**
 * Green footer: brand + open status, contact, opening hours, useful links.
 * On a phone the hours collapse to "Today: …" with the full week one tap away,
 * and the links column is left to the bottom tab bar.
 */
export default function StoreFooter({ store, demo }: Props) {
  const t = useT();
  const f = t.store.footer;
  const h = t.store.hours;
  const pathname = usePathname();
  const clock = useStoreClock();
  const [hoursOpen, setHoursOpen] = useState(false);

  const today = clock?.day ?? null;
  const todayHours = today ? store.hours[today] : undefined;
  const range = (v: [string, string] | null) => (v ? `${v[0]}–${v[1]}` : h.closed);

  return (
    <footer className={`ks-foot${hoursOpen ? " hours-open" : ""}${pathname === routes.store() ? " on-store-page" : ""}`}>
      <div className="ks-foot-grid">
        <div className="ks-foot-brand">
          <strong>{store.name}</strong>
          <p>{store.tagline}</p>
          <OpenStatus hours={store.hours} className="ks-foot-open" />
        </div>

        <div>
          <h3>{f.contact}</h3>
          <p>
            <a className="ks-foot-tel" href={telHref(store.phone)}>
              <PhoneIcon />
              {store.phone}
            </a>
          </p>
          <p>
            <a href={store.map_url} target="_blank" rel="noopener noreferrer" title={f.directions}>
              <PinIcon />
              {store.address}
            </a>
          </p>
        </div>

        <div className="ks-foot-hours-col">
          <h3>{f.hours}</h3>
          <p className="ks-foot-today">
            {f.todayLabel} <b>{todayHours !== undefined ? range(todayHours) : "…"}</b>
            <button
              type="button"
              className="ks-foot-more"
              aria-expanded={hoursOpen}
              aria-controls="ks-foot-hours"
              onClick={() => setHoursOpen((o) => !o)}
            >
              {f.allHours} <ChevronDownIcon />
            </button>
          </p>
          <dl className="ks-foot-hours" id="ks-foot-hours">
            {WEEK_DISPLAY_ORDER.map((d) => (
              <div key={d} className={d === today ? "today" : undefined}>
                <dt>{h.days[Number(d)]}</dt>
                <dd>{range(store.hours[d])}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="ks-foot-links-col">
          <h3>{f.useful}</h3>
          <ul className="ks-foot-links">
            <li>
              <Link href={routes.deals()}>{f.deals}</Link>
            </li>
            <li>
              <Link href={routes.flyer()}>{f.flyer}</Link>
            </li>
            <li>
              <Link href={routes.store()}>{f.store}</Link>
            </li>
          </ul>
          <StoreLanguageToggle className="ks-foot-lang" />
        </div>
      </div>
      <p className="ks-foot-note">{demo ? f.demoNote : f.note}</p>
    </footer>
  );
}
