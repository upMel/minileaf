// ── Storefront data model (Kaimakidis refactor) ─────────────────────────────
// Database row shapes (snake_case, as Supabase returns them) and the app-side
// shapes (camelCase) the pages use, with one mapper per entity.
//
// JSON columns (store info, banner slots) are validated with zod on the way in:
// they are free-form in the database, so a bad value is replaced or skipped
// instead of crashing a page.
// Matches supabase/add_kaimakidis_refactor.sql.

import { z } from "zod";

import { toPriceUnit, type PriceUnit } from "@/lib/price";

// ── Products: the public `catalog` view ─────────────────────────────────────

/** Columns to select from `catalog`. */
export const CATALOG_FIELDS =
  "id,name,description,size,image_url,price,price_unit,is_super_price,is_bogo,barcode,category_id,root_category_id,subcategory_id,updated_at";

export type CatalogRow = {
  id: string;
  name: string;
  description: string | null;
  size: string | null;
  image_url: string | null;
  price: number | string; // numeric — PostgREST may send it as a string
  price_unit: string | null;
  is_super_price: boolean;
  is_bogo: boolean;
  barcode: string | null;
  category_id: string | null;
  root_category_id: string | null;
  subcategory_id: string | null;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  /** Package / quantity, e.g. "500 γρ." */
  size?: string;
  imageUrl?: string;
  price: number;
  priceUnit: PriceUnit;
  /** ΣΟΥΠΕΡ ΤΙΜΗ */
  isSuperPrice: boolean;
  /** 1+1 */
  isBogo: boolean;
  barcode?: string;
  /** Top-level category (resolved from a subcategory when needed). */
  categoryId?: string;
  subcategoryId?: string;
};

export function toProduct(row: CatalogRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    size: row.size ?? undefined,
    imageUrl: row.image_url ?? undefined,
    price: Number(row.price),
    priceUnit: toPriceUnit(row.price_unit),
    isSuperPrice: row.is_super_price,
    isBogo: row.is_bogo,
    barcode: row.barcode ?? undefined,
    categoryId: row.root_category_id ?? undefined,
    subcategoryId: row.subcategory_id ?? undefined,
  };
}

/** On the Deals page: ΣΟΥΠΕΡ ΤΙΜΗ or 1+1. */
export function isOffer(p: Pick<Product, "isSuperPrice" | "isBogo">): boolean {
  return p.isSuperPrice || p.isBogo;
}

// ── Categories ──────────────────────────────────────────────────────────────

export const CATEGORY_FIELDS = "id,name,parent_id,sort_order,image_url";

export type CategoryRow = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  image_url: string | null;
};

export type Subcategory = { id: string; name: string; sortOrder: number };

export type Category = {
  id: string;
  name: string;
  imageUrl?: string;
  sortOrder: number;
  subcategories: Subcategory[];
};

const bySortThenName = (a: { sortOrder: number; name: string }, b: { sortOrder: number; name: string }) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "el");

/** Two-level tree: top-level categories with their subcategories, both sorted. */
export function buildCategoryTree(rows: CategoryRow[]): Category[] {
  const subsByParent = new Map<string, Subcategory[]>();
  for (const r of rows) {
    if (!r.parent_id) continue;
    const list = subsByParent.get(r.parent_id) ?? [];
    list.push({ id: r.id, name: r.name, sortOrder: r.sort_order });
    subsByParent.set(r.parent_id, list);
  }
  return rows
    .filter((r) => !r.parent_id)
    .map((r) => ({
      id: r.id,
      name: r.name,
      imageUrl: r.image_url ?? undefined,
      sortOrder: r.sort_order,
      subcategories: (subsByParent.get(r.id) ?? []).sort(bySortThenName),
    }))
    .sort(bySortThenName);
}

// ── Offer groups (Deals page tiles) ─────────────────────────────────────────

/** Columns to select from `offer_groups`, with the linked categories embedded. */
export const OFFER_GROUP_FIELDS =
  "id,name,image_url,sort_order,show_subcategories,is_visible,offer_group_categories(category_id,sort_order)";

export type OfferGroupRow = {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  show_subcategories: boolean;
  is_visible: boolean;
  offer_group_categories: { category_id: string; sort_order: number }[] | null;
};

export type OfferGroup = {
  id: string;
  name: string;
  imageUrl?: string;
  sortOrder: number;
  /** Show the category's subcategories as filter chips (only meaningful with one category). */
  showSubcategories: boolean;
  isVisible: boolean;
  /** Top-level category ids, in display order. */
  categoryIds: string[];
};

export function toOfferGroup(row: OfferGroupRow): OfferGroup {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url ?? undefined,
    sortOrder: row.sort_order,
    showSubcategories: row.show_subcategories,
    isVisible: row.is_visible,
    categoryIds: [...(row.offer_group_categories ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.category_id),
  };
}

// ── Store info (site_config key 'store') ────────────────────────────────────

export const STORE_CONFIG_KEY = "store";

/** JavaScript weekday keys: "0" = Sunday … "6" = Saturday. */
export const WEEKDAY_KEYS = ["0", "1", "2", "3", "4", "5", "6"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

/** Monday-first display order used by the hours table. */
export const WEEK_DISPLAY_ORDER: WeekdayKey[] = ["1", "2", "3", "4", "5", "6", "0"];

const TimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");

/** null = closed; otherwise [opens, closes] in Athens time, same day. */
export const DayHoursSchema = z
  .tuple([TimeSchema, TimeSchema])
  .refine(([open, close]) => open < close, "Closing time must be after opening time")
  .nullable();

export const OpeningHoursSchema = z.record(z.enum(WEEKDAY_KEYS), DayHoursSchema);

export const StoreInfoSchema = z.object({
  name: z.string().min(1),
  tagline: z.string(),
  phone: z.string().min(1),
  address: z.string().min(1),
  map_url: z.string().regex(/^https:\/\//, "Must be an https:// link"),
  hours: OpeningHoursSchema,
});

export type DayHours = z.infer<typeof DayHoursSchema>;
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;
export type StoreInfo = z.infer<typeof StoreInfoSchema>;

/** Same values the migration seeds; used if the row is missing or invalid. */
export const DEFAULT_STORE_INFO: StoreInfo = {
  name: "Mini Market Καιμακίδης",
  tagline: "Στη γειτονιά σου, από το 1965.",
  phone: "210 346 7558",
  address: "Σμύρνης 4, Ταύρος",
  map_url: "https://maps.app.goo.gl/aQ85WFuv1Aq33t7H9",
  hours: {
    "0": null,
    "1": ["09:00", "18:00"],
    "2": ["09:00", "20:30"],
    "3": ["09:00", "18:00"],
    "4": ["09:00", "20:30"],
    "5": ["09:00", "20:30"],
    "6": ["09:00", "18:00"],
  },
};

export function parseStoreInfo(value: unknown): StoreInfo {
  const parsed = StoreInfoSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_STORE_INFO;
}

// ── Banner (table banner_pages) ─────────────────────────────────────────────

/** An image URL we're willing to render: bundled (/kaimakidis/…) or https. */
const ImageUrlSchema = z.string().refine((u) => u.startsWith("/") || /^https:\/\//.test(u), "Invalid image URL");

export const BANNER_LINK_KINDS = ["product", "category", "offer_group", "deals", "flyer", "url"] as const;
export type BannerLinkKind = (typeof BANNER_LINK_KINDS)[number];

export const BannerLinkSchema = z
  .object({
    kind: z.enum(BANNER_LINK_KINDS),
    /** Id for product / category / offer_group, https URL for url, unused for deals / flyer. */
    target: z.string().default(""),
  })
  .refine(
    (l) =>
      l.kind === "deals" || l.kind === "flyer"
        ? true
        : l.kind === "url"
          ? /^https:\/\//.test(l.target)
          : l.target.length > 0,
    "Link target is missing or invalid",
  );

export const BannerSlotSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("product"),
    product_id: z.string().min(1),
  }),
  z.object({
    type: z.literal("image"),
    image_url: ImageUrlSchema,
    alt: z.string().optional(),
    link: BannerLinkSchema.nullable().optional(),
  }),
]);

export type BannerLink = z.infer<typeof BannerLinkSchema>;
export type BannerSlot = z.infer<typeof BannerSlotSchema>;

export const BANNER_PAGE_FIELDS = "id,page_order,template_id,slots,is_visible,updated_at";

export type BannerPageRow = {
  id: string;
  page_order: number;
  template_id: string;
  slots: unknown; // jsonb — validated by toBannerPage
  is_visible: boolean;
  updated_at: string;
};

export type BannerPage = {
  id: string;
  order: number;
  templateId: string;
  /** Slot id → content; a slot that is empty or invalid is null. */
  slots: Record<string, BannerSlot | null>;
  isVisible: boolean;
};

/** Validates each slot on its own, so one bad slot doesn't hide the whole page. */
export function parseBannerSlots(value: unknown): Record<string, BannerSlot | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, BannerSlot | null> = {};
  for (const [slotId, raw] of Object.entries(value as Record<string, unknown>)) {
    const parsed = BannerSlotSchema.safeParse(raw);
    out[slotId] = parsed.success ? parsed.data : null;
  }
  return out;
}

export function toBannerPage(row: BannerPageRow): BannerPage {
  return {
    id: row.id,
    order: row.page_order,
    templateId: row.template_id,
    slots: parseBannerSlots(row.slots),
    isVisible: row.is_visible,
  };
}

// ── Flyer pages (table layout_pages) ────────────────────────────────────────

export const FLYER_PAGE_FIELDS = "id,layout_id,page_order,kind,template_id,image_url,slots";

export type FlyerPageRow = {
  id: string;
  layout_id: string;
  page_order: number;
  kind: "template" | "image" | null; // null only before the migration runs
  template_id: string | null;
  image_url: string | null;
  slots: unknown; // jsonb: slot id → product id
};

export type FlyerPage =
  | {
      id: string;
      order: number;
      kind: "template";
      templateId: string;
      /** Slot id → product id (null = empty). */
      slots: Record<string, string | null>;
    }
  | {
      id: string;
      order: number;
      kind: "image";
      /** A finished page uploaded from Canva. */
      imageUrl: string;
    };

function parseProductSlots(value: unknown): Record<string, string | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string | null> = {};
  for (const [slotId, raw] of Object.entries(value as Record<string, unknown>)) {
    out[slotId] = typeof raw === "string" && raw ? raw : null;
  }
  return out;
}

/** Returns null for a row that can't be shown (e.g. an image page with no image). */
export function toFlyerPage(row: FlyerPageRow): FlyerPage | null {
  if (row.kind === "image") {
    return row.image_url ? { id: row.id, order: row.page_order, kind: "image", imageUrl: row.image_url } : null;
  }
  if (!row.template_id) return null;
  return {
    id: row.id,
    order: row.page_order,
    kind: "template",
    templateId: row.template_id,
    slots: parseProductSlots(row.slots),
  };
}
