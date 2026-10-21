import type { Metadata } from "next";

import SearchView from "@/components/store/views/SearchView";
import { searchCatalog, toProductSort } from "@/lib/data/storefront";

const MAX_QUERY_LENGTH = 80;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(props: PageProps<"/search">): Promise<Metadata> {
  const q = (first((await props.searchParams).q) ?? "").trim();
  return { title: q ? `«${q.slice(0, MAX_QUERY_LENGTH)}»` : "Αναζήτηση", robots: { index: false } };
}

export default async function SearchPage(props: PageProps<"/search">) {
  const search = await props.searchParams;
  const query = (first(search.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const sort = toProductSort(first(search.sort));

  const { products, categories } = query ? await searchCatalog(query, sort) : { products: [], categories: [] };

  return <SearchView query={query} products={products} categories={categories} sort={sort} />;
}
