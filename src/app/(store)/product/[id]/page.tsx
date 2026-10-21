import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductView from "@/components/store/views/ProductView";
import { getCategory, getProduct, getRelatedProducts } from "@/lib/data/storefront";

export async function generateMetadata(props: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const product = await getProduct(id);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description ?? (product.size ? `${product.name} · ${product.size}` : product.name),
    openGraph: product.imageUrl ? { images: [product.imageUrl] } : undefined,
  };
}

export default async function ProductPage(props: PageProps<"/product/[id]">) {
  const { id } = await props.params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [category, related] = await Promise.all([
    product.categoryId ? getCategory(product.categoryId) : null,
    getRelatedProducts(product),
  ]);

  return <ProductView product={product} category={category} related={related} />;
}
