import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="sticky top-0 border-b border-black/10 bg-white/90 backdrop-blur dark:border-white/15 dark:bg-black/80">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              MiniLeaf
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
              Owner admin
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/10"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
          This is a placeholder.
          <br />
          Next: Supabase login, product CRUD, promotions (discount + 1+1), and CSV upload.
        </div>
      </main>
    </div>
  );
}
