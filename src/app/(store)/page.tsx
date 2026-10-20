import CategoryGrid from "@/components/store/CategoryGrid";
import SectionTitle from "@/components/store/SectionTitle";
import { getCategories } from "@/lib/data/storefront";

// Home: banner (next step) + product categories.
export default async function HomePage() {
  const categories = await getCategories();

  return (
    <section aria-labelledby="cats-title" className="ks-section">
      <SectionTitle id="cats-title" textKey="categoriesTitle" />
      <CategoryGrid categories={categories} />
    </section>
  );
}
