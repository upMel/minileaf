import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CategoryView from "@/components/store/views/CategoryView";
import { getCategory, getProducts, toProductSort } from "@/lib/data/storefront";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(props: PageProps<"/category/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const sub = first((await props.searchParams).sub);
  const category = await getCategory(id);
  if (!category) return {};
  const subName = category.subcategories.find((s) => s.id === sub)?.name;
  return { title: subName ? `${subName} · ${category.name}` : category.name };
}

export default async function CategoryPage(props: PageProps<"/category/[id]">) {
  const { id } = await props.params;
  const search = await props.searchParams;
  const category = await getCategory(id);
  if (!category) notFound();

  // Ignore a ?sub= that doesn't belong to this category.
  const subParam = first(search.sub);
  const subcategoryId = category.subcategories.some((s) => s.id === subParam) ? subParam : undefined;
  const sort = toProductSort(first(search.sort));

  const products = await getProducts({ categoryIds: [category.id], subcategoryId, sort });

  return <CategoryView category={category} subcategoryId={subcategoryId} products={products} sort={sort} />;
}
