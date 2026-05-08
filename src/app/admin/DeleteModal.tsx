"use client";

import Button from "@/components/ui/Button";

import type { ProductRow } from "@/types/admin";

type Props = {
  product: ProductRow;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onDeactivate: () => void;
  onConfirmDelete: () => void;
};

export default function DeleteModal({
  product,
  isDeleting,
  error,
  onCancel,
  onDeactivate,
  onConfirmDelete,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={() => {
        if (!isDeleting) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-4 shadow-lg dark:border-white/15 dark:bg-zinc-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-black dark:text-zinc-50">Delete product?</h3>
          <p className="text-sm text-zinc-700 dark:text-zinc-200">
            You are about to permanently delete{" "}
            <span className="font-medium">{product.name}</span>.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tip: If you might want it later, choose{" "}
            <span className="font-medium">Deactivate</span> instead — it removes it from the
            leaflet without losing the product.
          </p>

          {error ? (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : null}

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button type="button" disabled={isDeleting} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" variant="primary" disabled={isDeleting} onClick={onDeactivate}>
              Deactivate
            </Button>
            <Button type="button" variant="danger" disabled={isDeleting} onClick={onConfirmDelete}>
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
