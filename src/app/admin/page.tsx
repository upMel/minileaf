"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useProducts } from "@/hooks/useProducts";
import { useProductForm } from "@/hooks/useProductForm";

import DeleteModal from "./DeleteModal";
import ProductFormCard from "./ProductFormCard";
import ProductList from "./ProductList";
import SignInCard from "./SignInCard";
import type { ProductRow } from "@/types/admin";

export default function AdminPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const { adminState, signIn, signOut } = useAdminAuth(supabase);

  const { products, promotionsByProductId, isLoading, error, refresh, toggleActive, deactivate, remove } =
    useProducts(supabase, adminState.status === "authorized");

  const { form, isSaving, saveError, setField, startNew, startEdit, save } = useProductForm(
    supabase,
    refresh
  );

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
              src="/icon-192.png"
              alt="MiniLeaf"
              width={36}
              height={36}
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
            />

            <ProductList
              products={products}
              promotionsByProductId={promotionsByProductId}
              isLoading={isLoading}
              error={error}
              onRefresh={() => void refresh()}
              onEdit={(p) => void startEdit(p)}
              onToggleActive={(p) => void toggleActive(p)}
              onDelete={openDeleteModal}
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
