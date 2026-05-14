"use client";

import { useEffect, useRef } from "react";

type Props = {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  disabled?: boolean;
};

type InputWithDatepicker = HTMLInputElement & {
  datepicker?: {
    show?: () => void;
    hide?: () => void;
    pickerElement?: HTMLElement;
  };
};

export default function DateRangePickerInput({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  disabled = false,
}: Props) {
  const rangeRootRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLInputElement | null>(null);
  const rangePickerRef = useRef<{ destroy?: () => void } | null>(null);

  useEffect(() => {
    const rangeRoot = rangeRootRef.current;
    const startEl = startRef.current as InputWithDatepicker | null;
    const endEl = endRef.current as InputWithDatepicker | null;
    if (!rangeRoot || !startEl || !endEl) return;

    let cancelled = false;
    void (async () => {
      const { default: DateRangePicker } = await import("flowbite-datepicker/DateRangePicker");
      if (cancelled) return;

      rangePickerRef.current?.destroy?.();
      rangePickerRef.current = new DateRangePicker(rangeRoot, {
        format: "yyyy-mm-dd",
        autohide: true,
      });
    })();

    const hideBoth = () => {
      startEl.datepicker?.hide?.();
      endEl.datepicker?.hide?.();
    };

    const openStartOnly = () => {
      endEl.datepicker?.hide?.();
    };

    const openEndOnly = () => {
      startEl.datepicker?.hide?.();
    };

    const onDocMouseDown = (ev: MouseEvent) => {
      const target = ev.target;
      if (!(target instanceof Node)) return;

      if (rangeRoot.contains(target)) return;
      if (startEl.datepicker?.pickerElement?.contains(target)) return;
      if (endEl.datepicker?.pickerElement?.contains(target)) return;

      hideBoth();
    };

    const syncStart = () => onStartChange(startEl.value);
    const syncEnd = () => onEndChange(endEl.value);

    // After picking a start date, auto-advance to the end calendar
    const autoAdvanceToEnd = () => {
      setTimeout(() => {
        endEl.datepicker?.show?.();
      }, 80);
    };

    startEl.addEventListener("changeDate", syncStart as EventListener);
    endEl.addEventListener("changeDate", syncEnd as EventListener);

    // Auto-advance: after start is picked, open end calendar
    startEl.addEventListener("changeDate", autoAdvanceToEnd as EventListener);

    // Ensure we never show two calendars at once
    startEl.addEventListener("focus", openStartOnly);
    startEl.addEventListener("click", openStartOnly);
    endEl.addEventListener("focus", openEndOnly);
    endEl.addEventListener("click", openEndOnly);

    // Close after picking the end date
    endEl.addEventListener("changeDate", hideBoth as EventListener);

    // Close when clicking outside
    document.addEventListener("mousedown", onDocMouseDown);

    return () => {
      cancelled = true;
      startEl.removeEventListener("changeDate", syncStart as EventListener);
      startEl.removeEventListener("changeDate", autoAdvanceToEnd as EventListener);
      endEl.removeEventListener("changeDate", syncEnd as EventListener);
      startEl.removeEventListener("focus", openStartOnly);
      startEl.removeEventListener("click", openStartOnly);
      endEl.removeEventListener("focus", openEndOnly);
      endEl.removeEventListener("click", openEndOnly);
      endEl.removeEventListener("changeDate", hideBoth as EventListener);
      document.removeEventListener("mousedown", onDocMouseDown);
      rangePickerRef.current?.destroy?.();
      rangePickerRef.current = null;
    };
  }, [onStartChange, onEndChange]);

  return (
    <div ref={rangeRootRef} date-rangepicker="" className="mt-1 flex items-center gap-3">
      <div className="relative grow">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 dark:text-zinc-400">
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className="size-4"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
            />
          </svg>
        </div>
        <input
          ref={startRef}
          value={startValue}
          onChange={(e) => onStartChange(e.target.value)}
          type="text"
          inputMode="numeric"
          className="w-full rounded-xl border border-black/10 bg-white py-2 pr-3 pl-9 text-sm text-black outline-none focus:border-black/30 disabled:opacity-60 dark:border-white/15 dark:bg-black dark:text-zinc-50"
          placeholder="Start (YYYY-MM-DD)"
          disabled={disabled}
        />
      </div>
      <span className="text-sm text-zinc-600 dark:text-zinc-300">to</span>
      <div className="relative grow">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 dark:text-zinc-400">
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className="size-4"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
            />
          </svg>
        </div>
        <input
          ref={endRef}
          value={endValue}
          onChange={(e) => onEndChange(e.target.value)}
          type="text"
          inputMode="numeric"
          className="w-full rounded-xl border border-black/10 bg-white py-2 pr-3 pl-9 text-sm text-black outline-none focus:border-black/30 disabled:opacity-60 dark:border-white/15 dark:bg-black dark:text-zinc-50"
          placeholder="End (YYYY-MM-DD)"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
