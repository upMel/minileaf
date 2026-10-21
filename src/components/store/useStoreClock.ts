"use client";

import { useSyncExternalStore } from "react";

import { storeClock, type StoreClock } from "@/lib/store-hours";

// One shared minute-tick for every component that shows opening status.
// Returns null during server rendering and hydration, so the server never
// guesses the visitor's "now" — the status appears right after hydration.

let cached: { minute: number; clock: StoreClock } | null = null;

function getSnapshot(): StoreClock {
  const minute = Math.floor(Date.now() / 60_000);
  if (!cached || cached.minute !== minute) cached = { minute, clock: storeClock(new Date()) };
  return cached.clock;
}

function getServerSnapshot(): null {
  return null;
}

function subscribe(onChange: () => void): () => void {
  // Fire on the next minute boundary, then every minute.
  let interval: ReturnType<typeof setInterval> | undefined;
  const timeout = setTimeout(() => {
    onChange();
    interval = setInterval(onChange, 60_000);
  }, 60_000 - (Date.now() % 60_000) + 50);
  const onVisible = () => {
    if (!document.hidden) onChange();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export function useStoreClock(): StoreClock | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
