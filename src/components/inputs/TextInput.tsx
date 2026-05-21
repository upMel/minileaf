import type { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode"> & {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "url" | "password" | "email";
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
};

export default function TextInput({
  value,
  onChange,
  disabled = false,
  type = "text",
  inputMode,
  className,
  ...rest
}: Props) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      type={type}
      inputMode={inputMode}
      className={`w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30 disabled:opacity-60 dark:border-white/15 dark:bg-black dark:text-zinc-50 ${
        className ?? ""
      }`}
      {...rest}
    />
  );
}
