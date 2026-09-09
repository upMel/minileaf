"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import SearchBar from "@/components/SearchBar";
import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useProductForm } from "@/hooks/useProductForm";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import type { ProductRow } from "@/types/admin";

import DeleteModal from "../DeleteModal";
import ProductFormCard from "../ProductFormCard";
import ProductFormModal from "../ProductFormModal";
import ProductList from "../ProductList";
import { categoriesQueryOptions } from "./_queries";

// Set to true to bring back the slide-in drawer instead of the centered modal.
const USE_DRAWER = false;

export default function ProductsPage() {
  const { supabase, adminState } = useAdminAuthContext();
  const isAuthorized = adminState.status === "authorized";

  const { products, promotionsByProductId, isLoading, error, refresh, toggleActive, deactivate, remove } =
    useProducts(supabase, isAuthorized);

  const { form, isSaving, saveError, setField, startNew, startEdit, save } = useProductForm(
    supabase,
    refresh
  );

  const { filters, setFilters } = useSearchFilters();

  // Form open state — shared by both the modal (default) and the drawer (kept for future use).
  const [formOpen, setFormOpen] = useState(false);

  function openNew() {
    startNew();
    setFormOpen(true);
  }

  function openEdit(p: ProductRow) {
    void startEdit(p);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
  }

  // Categories
  const { data: dbCategories = [] } = useQuery(
    categoriesQueryOptions(supabase!, isAuthorized),
  );

  const categoryTree = useMemo(() => {
    const roots = dbCategories.filter((c) => c.parent_id === null);
    return roots.map((root) => ({
      id: root.id,
      name: root.name,
      children: dbCategories
        .filter((c) => c.parent_id === root.id)
        .map((sub) => ({ id: sub.id, name: sub.name, children: [] })),
    }));
  }, [dbCategories]);

  const activeCategoryTree = useMemo(() => {
    const usedIds = new Set(products.map((p) => p.category_id).filter(Boolean) as string[]);
    if (usedIds.size === 0) return categoryTree;
    return categoryTree
      .map((root) => {
        const activeChildren = root.children.filter((sub) => usedIds.has(sub.id));
        if (usedIds.has(root.id) || activeChildren.length > 0)
          return { ...root, children: activeChildren };
        return null;
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);
  }, [categoryTree, products]);

  const filteredProducts = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const min = filters.minPrice !== "" ? parseFloat(filters.minPrice) : null;
    const max = filters.maxPrice !== "" ? parseFloat(filters.maxPrice) : null;
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q)) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(p.category_id ?? "")) return false;
      if (filters.hasPromoOnly && !promotionsByProductId[p.id]?.is_active) return false;
      if (min !== null && !isNaN(min) && p.price < min) return false;
      if (max !== null && !isNaN(max) && p.price > max) return false;
      if (filters.status === "active" && !p.is_active) return false;
      if (filters.status === "inactive" && p.is_active) return false;
      return true;
    });
  }, [products, promotionsByProductId, filters]);

  // Delete modal
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

  return (
    <div className="relative flex h-full">
      {/* Main content */}
      <div className={`flex-1 p-6 transition-all duration-300 ${USE_DRAWER && formOpen ? "sm:mr-[440px]" : ""}`}>
        <ProductList
          products={filteredProducts}
          promotionsByProductId={promotionsByProductId}
          isLoading={isLoading}
          error={error}
          onRefresh={() => void refresh()}
          onEdit={openEdit}
          onToggleActive={(p) => void toggleActive(p)}
          onDelete={openDeleteModal}
          totalCount={products.length}
          onNew={openNew}
          searchBar={
            <SearchBar
              filters={filters}
              categoryTree={activeCategoryTree}
              onChange={setFilters}
              showStatus
              placeholder="Search products…"
            />
          }
        />
      </div>

      {/* Product form — centered modal (default) or slide-in drawer (kept for future use) */}
      {formOpen && !USE_DRAWER && (
        <ProductFormModal
          form={form}
          onChange={setField}
          onSubmit={async (e) => { await save(e); closeForm(); }}
          onNew={() => { startNew(); }}
          isSaving={isSaving}
          saveError={saveError}
          categories={dbCategories}
          onClose={closeForm}
        />
      )}

      {formOpen && USE_DRAWER && (
        <>
          {/* Backdrop (subtle) */}
          <div
            className="fixed inset-0 z-20 bg-black/10 dark:bg-black/30"
            onClick={closeForm}
          />
          <aside className="fixed inset-0 z-50 flex flex-col border-l border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:inset-auto sm:right-0 sm:top-0 sm:z-30 sm:h-full sm:w-[440px]">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
              <span className="text-sm font-semibold text-black dark:text-zinc-50">
                {form.id ? "Edit product" : "New product"}
              </span>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {/* Drawer body — scrollable */}
            <div className="flex-1 overflow-y-auto">
              <ProductFormCard
                form={form}
                onChange={setField}
                onSubmit={async (e) => { await save(e); closeForm(); }}
                onNew={() => { startNew(); }}
                isSaving={isSaving}
                saveError={saveError}
                categories={dbCategories}
                inDrawer
              />
            </div>
          </aside>
        </>
      )}

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
