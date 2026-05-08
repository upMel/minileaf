import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function Card({ children }: Props) {
  return (
    <section className="rounded-2xl border border-black/10 bg-zinc-50 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      {children}
    </section>
  );
}
