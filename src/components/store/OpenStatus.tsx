"use client";

import { useT } from "@/context/LanguageContext";
import { openStatus } from "@/lib/store-hours";
import type { OpeningHours } from "@/types/catalog";

import { useStoreClock } from "./useStoreClock";

/**
 * "Ανοιχτά τώρα · έως 20:30" with a green/red dot. Renders an empty
 * placeholder of the same height until the client knows the time.
 */
export default function OpenStatus({ hours, className = "" }: { hours: OpeningHours; className?: string }) {
  const t = useT().store.hours;
  const clock = useStoreClock();

  if (!clock) {
    return (
      <span className={`ks-status ${className}`} aria-hidden="true">
        <span className="ks-dot ks-dot-pending" />
        <span className="ks-status-text">&nbsp;</span>
      </span>
    );
  }

  const status = openStatus(hours, clock);
  let text: string;
  if (status.open) text = t.openUntil(status.until);
  else if (status.when === null) text = t.closed;
  else if (status.when === "today") text = t.opensToday(status.opensAt);
  else if (status.when === "tomorrow") text = t.opensTomorrow(status.opensAt);
  else text = t.opensOn(t.days[Number(status.when)], status.opensAt);

  return (
    <span className={`ks-status ${status.open ? "is-open" : "is-closed"} ${className}`} role="status">
      <span className="ks-dot" aria-hidden="true" />
      <span className="ks-status-text">{text}</span>
    </span>
  );
}
