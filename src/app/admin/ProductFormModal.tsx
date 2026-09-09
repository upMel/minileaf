"use client";

import Button from "@/components/ui/Button";

import ProductFormCard from "./ProductFormCard";

import type { CategoryRow, ProductFormState } from "@/types/admin";

type Props = {
  form: ProductFormState;
  onChange: (update: Partial<ProductFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNew: () => void;
  isSaving: boolean;
  saveError: string | null;
  categories: CategoryRow[];
  onClose: () => void;
};

const FORM_ID = "product-form-modal";

/** Classic centered modal for creating/editing a product (more horizontal space than the drawer). */
export default function ProductFormModal({
  form,
  onChange,
  onSubmit,
  onNew,
  isSaving,
  saveError,
  categories,
  onClose,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      onMouseDown={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="my-8 flex w-full max-w-2xl flex-col rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/15 dark:bg-zinc-950"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
          <span className="text-base font-semibold text-black dark:text-zinc-50">
            {form.id ? "Edit product" : "New product"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <ProductFormCard
            form={form}
            onChange={onChange}
            onSubmit={onSubmit}
            onNew={onNew}
            isSaving={isSaving}
            saveError={saveError}
            categories={categories}
            inDrawer
            formId={FORM_ID}
            hideSubmitButton
          />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-black/10 px-5 py-4 dark:border-white/10">
          <Button type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" disabled={isSaving} className="rounded-xl">
            {isSaving ? "Saving…" : form.id ? "Save" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
