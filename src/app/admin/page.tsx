"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";
import SearchBar from "@/components/SearchBar";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useProducts } from "@/hooks/useProducts";
import { useProductForm } from "@/hooks/useProductForm";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { fetchCategories } from "@/services/categories";

import CategoryManager from "./CategoryManager";
import DeleteModal from "./DeleteModal";
import ProductFormCard from "./ProductFormCard";
import ProductList from "./ProductList";
import SignInCard from "./SignInCard";
import type { CategoryRow, ProductRow } from "@/types/admin";

export default function AdminPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const { adminState, signIn, signOut } = useAdminAuth(supabase);

  const { products, promotionsByProductId, isLoading, error, refresh, toggleActive, deactivate, remove } =
    useProducts(supabase, adminState.status === "authorized");

  const { form, isSaving, saveError, setField, startNew, startEdit, save } = useProductForm(
    supabase,
    refresh
  );

  const { filters, setFilters } = useSearchFilters();

  const [dbCategories, setDbCategories] = useState<CategoryRow[]>([]);
  const loadCategories = useCallback(async () => {
    if (!supabase || adminState.status !== "authorized") return;
    const { data } = await fetchCategories(supabase);
    setDbCategories(data);
  }, [supabase, adminState.status]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // Derive available categories from loaded products
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [products]);

  // Apply filters locally
  const filteredProducts = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const min = filters.minPrice !== "" ? parseFloat(filters.minPrice) : null;
    const max = filters.maxPrice !== "" ? parseFloat(filters.maxPrice) : null;
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q)) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(p.category ?? "")) return false;
      if (filters.hasPromoOnly && !promotionsByProductId[p.id]?.is_active) return false;
      if (min !== null && !isNaN(min) && p.price < min) return false;
      if (max !== null && !isNaN(max) && p.price > max) return false;
      if (filters.status === "active" && !p.is_active) return false;
      if (filters.status === "inactive" && p.is_active) return false;
      return true;
    });
  }, [products, promotionsByProductId, filters]);

  // Delete modal — pure local UI state
  const [deleteModalProduct, setDeleteModalProduct] = useState<ProductRow | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  function openDeleteModal(p: ProductRow) {
    setDeleteModalError(null);
    setDeleteModalProduct(p);
  }

  async function onDeactivateFromModal() {
    if (!deleteModalProduct) return;
    setIsDeletingProduct(true);
    const { error: err } = await deactivate(deleteModalProduct.id);
    if (err) setDeleteModalError(err);
    else setDeleteModalProduct(null);
    setIsDeletingProduct(false);
  }

  async function onConfirmDeleteFromModal() {
    if (!deleteModalProduct) return;
    setIsDeletingProduct(true);
    const { error: err } = await remove(deleteModalProduct.id);
    if (err) setDeleteModalError(err);
    else setDeleteModalProduct(null);
    setIsDeletingProduct(false);
  }

  async function handleSignOut() {
    startNew();
    await signOut();
  }

  return (
    <div className="flex flex-1 flex-col bg-page font-sans">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto flex w-full items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/miniLeaf.png"
              alt="MiniLeaf"
              width={60}
              height={60}
              className="rounded-xl"
              priority
            />
            <h1 className="text-base font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
              Admin Panel
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/10"
            >
              Back
            </Link>
            {(adminState.status === "authorized" || adminState.status === "unauthorized") && (
              <Button type="button" onClick={() => void handleSignOut()}>
                Sign out
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        {adminState.status === "no-env" && (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
            Supabase is not configured. Add env vars in{" "}
            <span className="font-medium">.env.local</span>.
          </div>
        )}

        {adminState.status === "checking" && (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
            Checking session...
          </div>
        )}

        {adminState.status === "signed-out" && <SignInCard onSignIn={signIn} />}

        {adminState.status === "unauthorized" && (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
            Signed in as{" "}
            <span className="font-medium">{adminState.email ?? "(unknown)"}</span>, but this
            user is not an admin.
          </div>
        )}

        {adminState.status === "authorized" && (
          <>
            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
              Signed in as{" "}
              <span className="font-medium">{adminState.email ?? "(unknown)"}</span>.
            </div>

            <ProductFormCard
              form={form}
              onChange={setField}
              onSubmit={(e) => void save(e)}
              onNew={startNew}
              isSaving={isSaving}
              saveError={saveError}
              categories={dbCategories}
            />

            <CategoryManager
              supabase={supabase!}
              categories={dbCategories}
              onRefresh={() => void loadCategories()}
            />

            <ProductList
              products={filteredProducts}
              promotionsByProductId={promotionsByProductId}
              isLoading={isLoading}
              error={error}
              onRefresh={() => void refresh()}
              onEdit={(p) => void startEdit(p)}
              onToggleActive={(p) => void toggleActive(p)}
              onDelete={openDeleteModal}
              totalCount={products.length}
              searchBar={
                <SearchBar
                  filters={filters}
                  availableCategories={availableCategories}
                  onChange={setFilters}
                  showStatus
                  placeholder="Search products…"
                />
              }
            />
          </>
        )}
      </main>

      {deleteModalProduct && (
        <DeleteModal
          product={deleteModalProduct}
          isDeleting={isDeletingProduct}
          error={deleteModalError}
          onCancel={() => setDeleteModalProduct(null)}
          onDeactivate={() => void onDeactivateFromModal()}
          onConfirmDelete={() => void onConfirmDeleteFromModal()}
        />
      )}
    </div>
  );
}
