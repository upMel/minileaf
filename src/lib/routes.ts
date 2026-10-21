// Storefront URLs in one place, so links and redirects never drift apart.

export const routes = {
  home: () => "/",
  deals: () => "/deals",
  /** The Προσφορές page narrowed to one offer group. */
  offerGroup: (id: string) => `/deals?group=${encodeURIComponent(id)}`,
  flyer: () => "/flyer",
  store: () => "/store",
  category: (id: string, subcategoryId?: string) =>
    subcategoryId ? `/category/${id}?sub=${encodeURIComponent(subcategoryId)}` : `/category/${id}`,
  product: (id: string) => `/product/${id}`,
  search: (query: string) => `/search?q=${encodeURIComponent(query.trim())}`,
} as const;

/** Which main-menu section a pathname belongs to (for aria-current). */
export type NavSection = "home" | "deals" | "flyer" | "store" | null;

export function navSection(pathname: string): NavSection {
  if (pathname === "/" || pathname.startsWith("/category") || pathname.startsWith("/product") || pathname.startsWith("/search")) {
    return "home";
  }
  if (pathname.startsWith("/deals")) return "deals";
  if (pathname.startsWith("/flyer")) return "flyer";
  if (pathname.startsWith("/store")) return "store";
  return null;
}

/** `tel:` link for a Greek phone number as the shop writes it ("210 346 7558"). */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("30") && digits.length > 10) return `tel:+${digits}`;
  return `tel:+30${digits}`;
}
