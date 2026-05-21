import type { ReactNode } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
};

export default function SelectInput({ value, onChange, disabled = false, children }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30 disabled:opacity-60 dark:border-white/15 dark:bg-black dark:text-zinc-50"
    >
      {children}
    </select>
  );
}
