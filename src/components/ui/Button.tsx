import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function Button({ variant = "secondary", className = "", ...props }: Props) {
  const base =
    "rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60";

  const byVariant: Record<Variant, string> = {
    secondary:
      "border border-black/10 bg-white text-black hover:bg-black/[.04] dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/10",
    primary:
      "transition-opacity hover:opacity-90 active:opacity-80",
    danger:
      "transition-opacity hover:opacity-90 active:opacity-80",
  };

  const variantStyle =
    variant === "primary"
      ? { backgroundColor: "var(--accent)", color: "var(--accent-fg)" }
      : variant === "danger"
      ? { backgroundColor: "var(--danger)", color: "var(--danger-fg)" }
      : undefined;

  return <button className={`${base} ${byVariant[variant]} ${className}`} style={variantStyle} {...props} />;
}
