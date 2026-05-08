import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
};

export default function Field({ label, children }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
