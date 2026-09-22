import type { TextareaHTMLAttributes } from "react";

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
};

export default function TextAreaInput({
  value,
  onChange,
  disabled = false,
  rows = 3,
  className,
  ...rest
}: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={rows}
      className={`w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30 disabled:opacity-60 dark:border-white/15 dark:bg-black dark:text-zinc-50 ${
        className ?? ""
      }`}
      {...rest}
    />
  );
}
