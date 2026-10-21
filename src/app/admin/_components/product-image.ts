import type { CategoryRow, ProductRow } from "@/types/admin";

/**
 * The picture the shop shows for a product: its own photo, or else the
 * picture of its top-level category (same rule as the storefront).
 */
export function productImageResolver(categories: CategoryRow[]): (p: ProductRow) => string | null {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return (p) => {
    if (p.image_url) return p.image_url;
    const cat = p.category_id ? byId.get(p.category_id) : undefined;
    const root = cat?.parent_id ? byId.get(cat.parent_id) : cat;
    return root?.image_url ?? null;
  };
}
