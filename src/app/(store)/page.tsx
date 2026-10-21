import CategoryGrid from "@/components/store/CategoryGrid";
import HomeBanner from "@/components/store/HomeBanner";
import SectionTitle from "@/components/store/SectionTitle";
import { getBanner, getCategories } from "@/lib/data/storefront";

// Home: the offers banner (set up in the admin), then the product categories.
export default async function HomePage() {
  const [banner, categories] = await Promise.all([getBanner(), getCategories()]);

  return (
    <>
      <HomeBanner banner={banner} />
      <section aria-labelledby="cats-title" className="ks-section">
        <SectionTitle id="cats-title" textKey="categoriesTitle" />
        <CategoryGrid categories={categories} />
      </section>
    </>
  );
}
