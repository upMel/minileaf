// ── Layout template definitions for the home page flyer view ──
// Each template uses a 4-column CSS grid base.
// col/row spans are expressed as CSS grid values.

export type SlotSize =
  | "1x1"  // col-span-1 row-span-1
  | "2x1"  // col-span-2 row-span-1
  | "1x2"  // col-span-1 row-span-2
  | "2x2"  // col-span-2 row-span-2
  | "3x2"  // col-span-3 row-span-2
  | "4x1"  // col-span-4 row-span-1
  | "4x2"; // col-span-4 row-span-2

export type SlotRole = "hero" | "featured" | "small";

export type TemplateSlot = {
  id: string;           // unique key, e.g. "hero", "featured-1", "small-3"
  size: SlotSize;
  role: SlotRole;
  priority: number;     // 1 = highest priority on mobile (appears first in fallback grid)
};

export type LayoutTemplate = {
  id: string;
  name: string;
  description: string;
  cols: number;         // base grid column count (always 4 for now)
  slots: TemplateSlot[];
};

// Helper to derive Tailwind col-span / row-span classes from SlotSize
export function slotSpanClasses(size: SlotSize): string {
  const map: Record<SlotSize, string> = {
    "1x1": "col-span-1 row-span-1",
    "2x1": "col-span-2 row-span-1",
    "1x2": "col-span-1 row-span-2",
    "2x2": "col-span-2 row-span-2",
    "3x2": "col-span-3 row-span-2",
    "4x1": "col-span-4 row-span-1",
    "4x2": "col-span-4 row-span-2",
  };
  return map[size];
}

// ── Template 1 — "Weekly Special" ───────────────────────────
// [hero 2×2][f1  ][f2  ]
// [hero 2×2][f3  ][f4  ]
// [s1  ][s2  ][s3  ][s4  ]
export const TEMPLATE_WEEKLY_SPECIAL: LayoutTemplate = {
  id: "weekly-special",
  name: "Weekly Special",
  description: "1 large hero + 4 featured + 4 small products",
  cols: 4,
  slots: [
    { id: "hero",       size: "2x2", role: "hero",     priority: 1 },
    { id: "featured-1", size: "1x1", role: "featured", priority: 2 },
    { id: "featured-2", size: "1x1", role: "featured", priority: 3 },
    { id: "featured-3", size: "1x1", role: "featured", priority: 4 },
    { id: "featured-4", size: "1x1", role: "featured", priority: 5 },
    { id: "small-1",    size: "1x1", role: "small",    priority: 6 },
    { id: "small-2",    size: "1x1", role: "small",    priority: 7 },
    { id: "small-3",    size: "1x1", role: "small",    priority: 8 },
    { id: "small-4",    size: "1x1", role: "small",    priority: 9 },
  ],
};

// ── Template 2 — "Banner Strip" ─────────────────────────────
// [banner banner banner banner]
// [f1  ][f2  ][f3  ][f4  ]
// [s1  ][s2  ][s3  ][s4  ]
export const TEMPLATE_BANNER_STRIP: LayoutTemplate = {
  id: "banner-strip",
  name: "Banner Strip",
  description: "Full-width banner + 4 featured + 4 small",
  cols: 4,
  slots: [
    { id: "banner",     size: "4x1", role: "hero",     priority: 1 },
    { id: "featured-1", size: "1x1", role: "featured", priority: 2 },
    { id: "featured-2", size: "1x1", role: "featured", priority: 3 },
    { id: "featured-3", size: "1x1", role: "featured", priority: 4 },
    { id: "featured-4", size: "1x1", role: "featured", priority: 5 },
    { id: "small-1",    size: "1x1", role: "small",    priority: 6 },
    { id: "small-2",    size: "1x1", role: "small",    priority: 7 },
    { id: "small-3",    size: "1x1", role: "small",    priority: 8 },
    { id: "small-4",    size: "1x1", role: "small",    priority: 9 },
  ],
};

// ── Template 3 — "Twin Heroes" ──────────────────────────────
// [H1 H1][H2 H2]
// [H1 H1][H2 H2]
// [s1][s2][s3][s4]
export const TEMPLATE_TWIN_HEROES: LayoutTemplate = {
  id: "twin-heroes",
  name: "Twin Heroes",
  description: "2 large heroes side by side + 4 small",
  cols: 4,
  slots: [
    { id: "hero-1",  size: "2x2", role: "hero",  priority: 1 },
    { id: "hero-2",  size: "2x2", role: "hero",  priority: 2 },
    { id: "small-1", size: "1x1", role: "small", priority: 3 },
    { id: "small-2", size: "1x1", role: "small", priority: 4 },
    { id: "small-3", size: "1x1", role: "small", priority: 5 },
    { id: "small-4", size: "1x1", role: "small", priority: 6 },
  ],
};

// ── Template 4 — "Spotlight" ────────────────────────────────
// [H  H  H  ][f ]
// [H  H  H  ][f ]
// [s1][s2][s3][s4]
export const TEMPLATE_SPOTLIGHT: LayoutTemplate = {
  id: "spotlight",
  name: "Spotlight",
  description: "Dominant 3-wide hero + tall feature + 4 small",
  cols: 4,
  slots: [
    { id: "hero",       size: "3x2", role: "hero",     priority: 1 },
    { id: "featured-1", size: "1x2", role: "featured", priority: 2 },
    { id: "small-1",    size: "1x1", role: "small",    priority: 3 },
    { id: "small-2",    size: "1x1", role: "small",    priority: 4 },
    { id: "small-3",    size: "1x1", role: "small",    priority: 5 },
    { id: "small-4",    size: "1x1", role: "small",    priority: 6 },
  ],
};

// ── Template 5 — "Two Rows" ─────────────────────────────────
// [f1][f2][f3][f4]
// [s1][s2][s3][s4]
export const TEMPLATE_TWO_ROWS: LayoutTemplate = {
  id: "two-rows",
  name: "Two Rows",
  description: "4 featured products + 4 small products",
  cols: 4,
  slots: [
    { id: "featured-1", size: "1x1", role: "featured", priority: 1 },
    { id: "featured-2", size: "1x1", role: "featured", priority: 2 },
    { id: "featured-3", size: "1x1", role: "featured", priority: 3 },
    { id: "featured-4", size: "1x1", role: "featured", priority: 4 },
    { id: "small-1",    size: "1x1", role: "small",    priority: 5 },
    { id: "small-2",    size: "1x1", role: "small",    priority: 6 },
    { id: "small-3",    size: "1x1", role: "small",    priority: 7 },
    { id: "small-4",    size: "1x1", role: "small",    priority: 8 },
  ],
};

// ── Template 6 — "Wide Banner" ──────────────────────────────
// [hero hero hero hero]
// [hero hero hero hero]
// [f1  ][f2  ][f3  ][f4  ]
export const TEMPLATE_WIDE_BANNER: LayoutTemplate = {
  id: "wide-banner",
  name: "Wide Banner",
  description: "Full-width 2-row hero + 4 featured",
  cols: 4,
  slots: [
    { id: "hero",       size: "4x2", role: "hero",     priority: 1 },
    { id: "featured-1", size: "1x1", role: "featured", priority: 2 },
    { id: "featured-2", size: "1x1", role: "featured", priority: 3 },
    { id: "featured-3", size: "1x1", role: "featured", priority: 4 },
    { id: "featured-4", size: "1x1", role: "featured", priority: 5 },
  ],
};

// ── Template 7 — "Magazine" ─────────────────────────────────
// [hero hero][f1  f1  ]
// [hero hero][f2  f2  ]
// [s1][s2][s3][s4]
export const TEMPLATE_MAGAZINE: LayoutTemplate = {
  id: "magazine",
  name: "Magazine",
  description: "Hero + 2 wide featured strips + 4 small",
  cols: 4,
  slots: [
    { id: "hero",       size: "2x2", role: "hero",     priority: 1 },
    { id: "featured-1", size: "2x1", role: "featured", priority: 2 },
    { id: "featured-2", size: "2x1", role: "featured", priority: 3 },
    { id: "small-1",    size: "1x1", role: "small",    priority: 4 },
    { id: "small-2",    size: "1x1", role: "small",    priority: 5 },
    { id: "small-3",    size: "1x1", role: "small",    priority: 6 },
    { id: "small-4",    size: "1x1", role: "small",    priority: 7 },
  ],
};

// ── Template 8 — "Stacked" ──────────────────────────────────
// [hero hero hero hero]
// [f1  f1  ][f2  f2  ]
// [s1][s2][s3][s4]
export const TEMPLATE_STACKED: LayoutTemplate = {
  id: "stacked",
  name: "Stacked",
  description: "Full-width hero + 2 wide features + 4 small",
  cols: 4,
  slots: [
    { id: "hero",       size: "4x1", role: "hero",     priority: 1 },
    { id: "featured-1", size: "2x1", role: "featured", priority: 2 },
    { id: "featured-2", size: "2x1", role: "featured", priority: 3 },
    { id: "small-1",    size: "1x1", role: "small",    priority: 4 },
    { id: "small-2",    size: "1x1", role: "small",    priority: 5 },
    { id: "small-3",    size: "1x1", role: "small",    priority: 6 },
    { id: "small-4",    size: "1x1", role: "small",    priority: 7 },
  ],
};

// ── Template 9 — "Compact Grid" ─────────────────────────────
// [s1][s2 ][s3 ][s4 ]
// [s5][s6 ][s7 ][s8 ]
// [s9][s10][s11][s12]
export const TEMPLATE_COMPACT_GRID: LayoutTemplate = {
  id: "compact-grid",
  name: "Compact Grid",
  description: "12 equal product cells — pure grid",
  cols: 4,
  slots: [
    { id: "small-1",  size: "1x1", role: "small", priority: 1  },
    { id: "small-2",  size: "1x1", role: "small", priority: 2  },
    { id: "small-3",  size: "1x1", role: "small", priority: 3  },
    { id: "small-4",  size: "1x1", role: "small", priority: 4  },
    { id: "small-5",  size: "1x1", role: "small", priority: 5  },
    { id: "small-6",  size: "1x1", role: "small", priority: 6  },
    { id: "small-7",  size: "1x1", role: "small", priority: 7  },
    { id: "small-8",  size: "1x1", role: "small", priority: 8  },
    { id: "small-9",  size: "1x1", role: "small", priority: 9  },
    { id: "small-10", size: "1x1", role: "small", priority: 10 },
    { id: "small-11", size: "1x1", role: "small", priority: 11 },
    { id: "small-12", size: "1x1", role: "small", priority: 12 },
  ],
};

// ── Template 10 — "Feature Wall" ────────────────────────────
// [hero hero][f1][f2]
// [hero hero][f3][f4]
// [f5][f6][f7][f8]
export const TEMPLATE_FEATURE_WALL: LayoutTemplate = {
  id: "feature-wall",
  name: "Feature Wall",
  description: "Hero + 8 featured products",
  cols: 4,
  slots: [
    { id: "hero",       size: "2x2", role: "hero",     priority: 1 },
    { id: "featured-1", size: "1x1", role: "featured", priority: 2 },
    { id: "featured-2", size: "1x1", role: "featured", priority: 3 },
    { id: "featured-3", size: "1x1", role: "featured", priority: 4 },
    { id: "featured-4", size: "1x1", role: "featured", priority: 5 },
    { id: "featured-5", size: "1x1", role: "featured", priority: 6 },
    { id: "featured-6", size: "1x1", role: "featured", priority: 7 },
    { id: "featured-7", size: "1x1", role: "featured", priority: 8 },
    { id: "featured-8", size: "1x1", role: "featured", priority: 9 },
  ],
};

// All templates exported in display order
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  TEMPLATE_WEEKLY_SPECIAL,
  TEMPLATE_BANNER_STRIP,
  TEMPLATE_TWIN_HEROES,
  TEMPLATE_SPOTLIGHT,
  TEMPLATE_TWO_ROWS,
  TEMPLATE_WIDE_BANNER,
  TEMPLATE_MAGAZINE,
  TEMPLATE_STACKED,
  TEMPLATE_COMPACT_GRID,
  TEMPLATE_FEATURE_WALL,
];

export const DEFAULT_TEMPLATE_ID = "weekly-special";

// The saved config shape (stored as JSON in site_config)
export type ActiveLayoutConfig = {
  templateId: string;
  // slot id → product id (null = auto-fill from product list)
  slots: Record<string, string | null>;
};

export function emptyConfig(template: LayoutTemplate): ActiveLayoutConfig {
  return {
    templateId: template.id,
    slots: Object.fromEntries(template.slots.map((s) => [s.id, null])),
  };
}
