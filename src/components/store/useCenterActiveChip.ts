"use client";

import { useEffect, useRef } from "react";

/**
 * On phones the filter chips are one sideways-scrolling row; keep the active
 * chip (aria-current / aria-pressed) in view whenever `key` changes —
 * centred, but only if it was cut off.
 */
export function useCenterActiveChip<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const row = ref.current;
    if (!row || row.scrollWidth <= row.clientWidth + 1) return;
    const active = row.querySelector<HTMLElement>('[aria-current="page"], [aria-pressed="true"]');
    if (!active) return;
    const r = row.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    if (a.left >= r.left && a.right <= r.right) return; // already fully visible
    row.scrollLeft += a.left - r.left - (r.width - a.width) / 2;
  }, [key]);
  return ref;
}
