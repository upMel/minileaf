"use client";

import Button from "@/components/ui/Button";
import { useT } from "@/context/LanguageContext";

type Props = {
  title: string;
  description?: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  title,
  description,
  confirmLabel,
  isConfirming = false,
  onCancel,
  onConfirm,
}: Props) {
  const t = useT();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={() => {
        if (!isConfirming) onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-5 shadow-lg dark:border-white/15 dark:bg-zinc-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-black dark:text-zinc-50">{title}</h3>
          {description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            <Button type="button" disabled={isConfirming} onClick={onCancel}>
              {t.common.cancel}
            </Button>
            <Button type="button" variant="danger" disabled={isConfirming} onClick={onConfirm}>
              {isConfirming ? t.common.deleting : (confirmLabel ?? t.common.delete)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
