"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const PALETTES = [
  { id: "red", color: "#d62828", label: "Market Red" },
  { id: "green", color: "#2d6a4f", label: "Fresh Green" },
  { id: "amber", color: "#e07b00", label: "Warm Amber" },
] as const;

type Palette = (typeof PALETTES)[number]["id"];

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [palette, setPalette] = useState<Palette>("red");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("palette") as Palette | null;
    if (saved && PALETTES.some((p) => p.id === saved)) {
      setPalette(saved);
      document.documentElement.dataset.palette = saved;
    }
  }, []);

  function handlePalette(id: Palette) {
    setPalette(id);
    localStorage.setItem("palette", id);
    document.documentElement.dataset.palette = id;
  }

  function toggleDark() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  // Avoid hydration mismatch — render nothing until client mounts
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Palette swatches */}
      {PALETTES.map((p) => (
        <button
          key={p.id}
          onClick={() => handlePalette(p.id)}
          title={p.label}
          className={`h-6 w-6 rounded-full border-2 transition-all ${
            palette === p.id
              ? "border-black/50 dark:border-white/70 scale-110 shadow-sm"
              : "border-transparent opacity-50 hover:opacity-80 hover:scale-105"
          }`}
          style={{ backgroundColor: p.color }}
        />
      ))}

      {/* Divider */}
      <span className="h-5 w-px bg-black/15 dark:bg-white/15" />

      {/* Dark / light toggle */}
      <button
        onClick={toggleDark}
        title={resolvedTheme === "dark" ? "Switch to light" : "Switch to dark"}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white/80 text-zinc-600 transition hover:bg-black/5 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
      >
        {resolvedTheme === "dark" ? (
          /* Sun icon */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          /* Moon icon */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </div>
  );
}
