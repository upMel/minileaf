"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AdminState =
  | { status: "no-env" }
  | { status: "signed-out" }
  | { status: "checking" }
  | { status: "unauthorized"; email?: string }
  | { status: "authorized"; email?: string };

export default function AdminPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [adminState, setAdminState] = useState<AdminState>(
    supabase ? { status: "checking" } : { status: "no-env" }
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refreshAdminState() {
    if (!supabase) return;
    setFormError(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setAdminState({ status: "signed-out" });
      return;
    }

    const { data: adminRow, error } = await supabase
      .from("admin_users")
      .select("user_id,email")
      .limit(1)
      .maybeSingle();

    if (error || !adminRow) {
      setAdminState({ status: "unauthorized", email: user.email ?? undefined });
      return;
    }

    setAdminState({ status: "authorized", email: adminRow.email ?? user.email ?? undefined });
  }

  useEffect(() => {
    if (!supabase) return;
    const initialTimer = setTimeout(() => {
      void refreshAdminState();
    }, 0);

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void refreshAdminState();
    });
    return () => {
      clearTimeout(initialTimer);
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;

    setIsSubmitting(true);
    setFormError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setFormError(error.message);
      setIsSubmitting(false);
      return;
    }

    setEmail("");
    setPassword("");
    setIsSubmitting(false);
    await refreshAdminState();
  }

  async function onSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAdminState({ status: "signed-out" });
  }

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
          <div className="flex items-center gap-2">
            {(adminState.status === "authorized" ||
              adminState.status === "unauthorized") && (
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/10"
              >
                Sign out
              </button>
            )}
            <Link
              href="/"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/10"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        {adminState.status === "no-env" ? (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
            Supabase is not configured. Add env vars in <span className="font-medium">.env.local</span>.
          </div>
        ) : null}

        {adminState.status === "checking" ? (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
            Checking session…
          </div>
        ) : null}

        {adminState.status === "signed-out" ? (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-black"
          >
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30 dark:border-white/15 dark:bg-black dark:text-zinc-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30 dark:border-white/15 dark:bg-black dark:text-zinc-50"
                  required
                />
              </div>

              {formError ? (
                <div className="text-sm text-red-600 dark:text-red-400">{formError}</div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-black/10 bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/90 disabled:opacity-60 dark:border-white/15"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>
        ) : null}

        {adminState.status === "unauthorized" ? (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
            Signed in as <span className="font-medium">{adminState.email ?? "(unknown)"}</span>,
            but this user is not an admin.
          </div>
        ) : null}

        {adminState.status === "authorized" ? (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
            Signed in as <span className="font-medium">{adminState.email ?? "(unknown)"}</span>.
            <br />
            Next: product CRUD, promotions (discount + 1+1), and CSV upload.
          </div>
        ) : null}
      </main>
    </div>
  );
}
