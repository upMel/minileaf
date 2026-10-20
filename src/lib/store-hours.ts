// Opening-hours logic, in the shop's own time zone (Europe/Athens) whatever
// the visitor's device says.

import { WEEKDAY_KEYS, type OpeningHours, type WeekdayKey } from "@/types/catalog";

export const STORE_TIME_ZONE = "Europe/Athens";

export type StoreClock = { day: WeekdayKey; time: string /* HH:MM, 24h */ };

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Day of week and HH:MM in Athens for a given instant. */
export function storeClock(at: Date): StoreClock {
  const parts: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-GB", {
    timeZone: STORE_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at)) {
    parts[p.type] = p.value;
  }
  const day = WEEKDAY_SHORT.indexOf(parts.weekday);
  return { day: WEEKDAY_KEYS[day < 0 ? 0 : day], time: `${parts.hour}:${parts.minute}` };
}

export type OpenStatus =
  | { open: true; until: string }
  | { open: false; opensAt: string; when: "today" | "tomorrow" | WeekdayKey }
  | { open: false; opensAt: null; when: null }; // closed every day

export function openStatus(hours: OpeningHours, clock: StoreClock): OpenStatus {
  const today = hours[clock.day];
  if (today && clock.time >= today[0] && clock.time < today[1]) return { open: true, until: today[1] };
  if (today && clock.time < today[0]) return { open: false, opensAt: today[0], when: "today" };

  const start = Number(clock.day);
  for (let i = 1; i <= 7; i++) {
    const key = WEEKDAY_KEYS[(start + i) % 7];
    const h = hours[key];
    if (h) return { open: false, opensAt: h[0], when: i === 1 ? "tomorrow" : key };
  }
  return { open: false, opensAt: null, when: null };
}
