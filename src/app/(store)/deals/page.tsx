import type { Metadata } from "next";

import DealsView, { type DealsState } from "@/components/store/views/DealsView";
import { getCategories, getOfferGroups, getProducts, toOfferFilter, toProductSort } from "@/lib/data/storefront";

export const metadata: Metadata = { title: "Προσφορές" };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Προσφορές: every ΣΟΥΠΕΡ ΤΙΜΗ and 1+1 product, narrowed by offer group,
 * one of the group's categories, or (for groups that ask for it) a subcategory.
 */
export default async function DealsPage(props: PageProps<"/deals">) {
  const search = await props.searchParams;
  const [groups, categories] = await Promise.all([getOfferGroups(), getCategories()]);

  // Keep only filters that make sense together; drop anything stale or made up.
  const group = groups.find((g) => g.id === first(search.group));
  const categoryId = group?.categoryIds.includes(first(search.cat) ?? "") ? first(search.cat) : undefined;
  const single = group && group.categoryIds.length === 1 ? categories.find((c) => c.id === group.categoryIds[0]) : undefined;
  const subParam = first(search.sub);
  const subcategoryId =
    group?.showSubcategories && single?.subcategories.some((s) => s.id === subParam) ? subParam : undefined;

  const state: DealsState = {
    groupId: group?.id,
    categoryId,
    subcategoryId,
    offer: toOfferFilter(first(search.type)),
    sort: toProductSort(first(search.sort)),
  };

  const products = await getProducts({
    offers: state.offer,
    categoryIds: categoryId ? [categoryId] : group?.categoryIds,
    subcategoryId,
    sort: state.sort,
  });

  return <DealsView groups={groups} categories={categories} state={state} products={products} />;
}
