// ── Home-page banner templates ──────────────────────────────────────────────
// A banner page (table `banner_pages`) picks one of these by id and fills its
// slots. On a computer the page is laid out with CSS grid areas; on a phone
// every filled slot becomes its own full-width slide, in `slots` order.
//
// Ids are stored in the database — never rename one; add a new template instead.

export type BannerTemplateSlot = {
  /** Key in banner_pages.slots, also used as the CSS grid-area name. */
  id: string;
  /** Short English label for the admin; localized via the i18n dictionary. */
  label: string;
};

export type BannerTemplate = {
  id: string;
  name: string;
  description: string;
  /** CSS grid-template-columns on a computer. */
  columns: string;
  /** CSS grid-template-areas rows on a computer. */
  areas: string[];
  /** In phone swipe order. */
  slots: BannerTemplateSlot[];
};

// [        main        ]
export const BANNER_SINGLE: BannerTemplate = {
  id: "single",
  name: "Single",
  description: "One full-width banner",
  columns: "1fr",
  areas: ["main"],
  slots: [{ id: "main", label: "Banner" }],
};

// [  left  ][  right  ]
export const BANNER_DUO: BannerTemplate = {
  id: "duo",
  name: "Side by side",
  description: "Two equal banners",
  columns: "1fr 1fr",
  areas: ["left right"],
  slots: [
    { id: "left", label: "Left" },
    { id: "right", label: "Right" },
  ],
};

// [   main    ][top   ]
// [   main    ][bottom]
export const BANNER_FEATURE: BannerTemplate = {
  id: "feature",
  name: "Feature + 2",
  description: "One large banner and two small ones beside it",
  columns: "2fr 1fr",
  areas: ["main top", "main bottom"],
  slots: [
    { id: "main", label: "Large" },
    { id: "top", label: "Small, top" },
    { id: "bottom", label: "Small, bottom" },
  ],
};

// [ a ][ b ][ c ]
export const BANNER_TRIO: BannerTemplate = {
  id: "trio",
  name: "Three",
  description: "Three equal banners",
  columns: "1fr 1fr 1fr",
  areas: ["a b c"],
  slots: [
    { id: "a", label: "First" },
    { id: "b", label: "Second" },
    { id: "c", label: "Third" },
  ],
};

// [ a ][ b ][ c ][ d ]
export const BANNER_QUAD: BannerTemplate = {
  id: "quad",
  name: "Four",
  description: "Four equal banners",
  columns: "1fr 1fr 1fr 1fr",
  areas: ["a b c d"],
  slots: [
    { id: "a", label: "First" },
    { id: "b", label: "Second" },
    { id: "c", label: "Third" },
    { id: "d", label: "Fourth" },
  ],
};

/** All templates, in the order the admin picker shows them. */
export const BANNER_TEMPLATES: BannerTemplate[] = [
  BANNER_SINGLE,
  BANNER_DUO,
  BANNER_FEATURE,
  BANNER_TRIO,
  BANNER_QUAD,
];

export const DEFAULT_BANNER_TEMPLATE_ID = BANNER_SINGLE.id;

export function getBannerTemplate(id: string): BannerTemplate | undefined {
  return BANNER_TEMPLATES.find((t) => t.id === id);
}

/** CSS grid-template-areas value for a template, e.g. `"main top" "main bottom"`. */
export function bannerGridAreas(template: BannerTemplate): string {
  return template.areas.map((row) => `"${row}"`).join(" ");
}

/**
 * Shape of the whole banner on a computer (width / height); every page uses
 * it, so a template's boxes always fit the same frame. Keep it in step with
 * `.ks-show-pages` in store.css (on phones each box is a 16:9 slide).
 */
export const BANNER_ASPECT = { width: 16, height: 7 } as const;

/**
 * Picture size (px) that fills one box exactly on a computer, for the admin's
 * "best size" hint. Derived from the template's columns and areas.
 */
export function bannerSlotSize(template: BannerTemplate, slotId: string, frameWidth = 1600): { width: number; height: number } {
  const fr = template.columns.split(/\s+/).map((c) => parseFloat(c) || 1);
  const total = fr.reduce((a, b) => a + b, 0);
  const grid = template.areas.map((row) => row.trim().split(/\s+/));
  const cols = new Set<number>();
  let rows = 0;
  for (const row of grid) {
    let inRow = false;
    row.forEach((name, i) => {
      if (name === slotId) {
        cols.add(i);
        inRow = true;
      }
    });
    if (inRow) rows += 1;
  }
  const frameHeight = (frameWidth * BANNER_ASPECT.height) / BANNER_ASPECT.width;
  const width = [...cols].reduce((sum, i) => sum + (fr[i] ?? 1), 0) / total;
  return { width: Math.round(frameWidth * width), height: Math.round((frameHeight * rows) / Math.max(1, grid.length)) };
}
