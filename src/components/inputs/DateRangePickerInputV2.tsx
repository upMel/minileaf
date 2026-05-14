"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";

// react-day-picker ships no CSS in v10 — we style everything via classNames

type Props = {
  startValue: string; // "YYYY-MM-DD" or ""
  endValue: string;   // "YYYY-MM-DD" or ""
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  disabled?: boolean;
};

function parseDate(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s + "T12:00:00"); // noon to avoid DST edge-cases
  return isNaN(d.getTime()) ? undefined : d;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date | undefined): string {
  if (!d) return "";
  return d.toLocaleDateString("el-GR", { day: "2-digit", month: "short", year: "numeric" });
}

const CalendarIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className="size-4 shrink-0"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
    />
  </svg>
);

export default function DateRangePickerInputV2({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  // "start" = waiting to pick start, "end" = waiting to pick end
  const [picking, setPicking] = useState<"start" | "end">("start");
  const containerRef = useRef<HTMLDivElement>(null);

  const fromDate = parseDate(startValue);
  const toDate = parseDate(endValue);
  const range: DateRange = { from: fromDate, to: toDate };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function openFor(mode: "start" | "end") {
    if (disabled) return;
    setPicking(mode);
    setOpen(true);
  }

  function handleSelect(selected: DateRange | undefined) {
    if (!selected) return;

    if (picking === "start") {
      const val = selected.from ? formatDate(selected.from) : "";
      onStartChange(val);
      // Clear end if new start is after current end
      if (selected.from && toDate && selected.from > toDate) {
        onEndChange("");
      }
      // Auto-advance to picking end
      setPicking("end");
    } else {
      const val = selected.to ? formatDate(selected.to) : (selected.from ? formatDate(selected.from) : "");
      onEndChange(val);
      setOpen(false);
    }
  }

  // Build the range shown in the picker based on what we're picking
  const pickerSelected: DateRange =
    picking === "start"
      ? { from: fromDate, to: toDate }
      : { from: fromDate, to: toDate };

  const cn = {
    root: "relative select-none",
    months: "flex flex-col",
    month: "space-y-2",
    month_caption: "flex h-9 items-center justify-center",
    caption_label: "text-sm font-semibold text-zinc-900 dark:text-zinc-100",
    nav: "absolute top-0 left-0 right-0 h-9 flex items-center justify-between",
    button_previous:
      "flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-black/[.06] hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[.08] dark:hover:text-zinc-200",
    button_next:
      "flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-black/[.06] hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[.08] dark:hover:text-zinc-200",
    month_grid: "w-full border-collapse",
    weekdays: "mb-1",
    weekday:
      "w-9 pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500",
    week: "",
    day: "relative p-0 text-center focus-within:relative focus-within:z-20",
    day_button:
      "rdp-day-btn mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors " +
      "text-zinc-800 hover:bg-black/[.06] dark:text-zinc-200 dark:hover:bg-white/[.08] " +
      "focus:outline-none",
    selected: "rdp-selected",
    range_start: "rdp-range-start",
    range_end: "rdp-range-end",
    range_middle: "rdp-range-middle",
    today: "rdp-today",
    outside: "opacity-30 pointer-events-none",
    disabled: "opacity-30 pointer-events-none",
    hidden: "invisible",
    chevron: "fill-current",
  };

  return (
    <div ref={containerRef} className="relative mt-1">
      {/* Trigger row */}
      <div className={`flex items-center gap-2 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
        {/* Start input */}
        <button
          type="button"
          onClick={() => openFor("start")}
          className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
            open && picking === "start"
              ? "border-[var(--accent)] ring-2 ring-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
              : "border-black/10 dark:border-white/15"
          } bg-white dark:bg-black`}
        >
          <CalendarIcon />
          <span className={fromDate ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}>
            {fromDate ? formatDisplay(fromDate) : "Start date"}
          </span>
        </button>

        <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">→</span>

        {/* End input */}
        <button
          type="button"
          onClick={() => openFor("end")}
          className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
            open && picking === "end"
              ? "border-[var(--accent)] ring-2 ring-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
              : "border-black/10 dark:border-white/15"
          } bg-white dark:bg-black`}
        >
          <CalendarIcon />
          <span className={toDate ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}>
            {toDate ? formatDisplay(toDate) : "End date"}
          </span>
        </button>

        {/* Clear button */}
        {(fromDate || toDate) && (
          <button
            type="button"
            onClick={() => { onStartChange(""); onEndChange(""); setOpen(false); }}
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-black/[.06] hover:text-zinc-600 dark:hover:bg-white/[.08]"
            aria-label="Clear dates"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Calendar popover */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 rounded-2xl border border-black/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-900">
          {/* Hint */}
          <p className="mb-2 px-1 text-xs text-zinc-400 dark:text-zinc-500">
            {picking === "start" ? "Pick a start date" : "Pick an end date"}
          </p>
          <div className="rdp-v2">
            <DayPicker
              mode="range"
              selected={pickerSelected}
              onSelect={handleSelect}
              defaultMonth={picking === "end" && toDate ? toDate : (fromDate ?? new Date())}
              disabled={picking === "end" && fromDate ? { before: fromDate } : undefined}
              classNames={cn}
              showOutsideDays
            />
          </div>
        </div>
      )}
    </div>
  );
}
