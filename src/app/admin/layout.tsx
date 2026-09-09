"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ThemeToggle from "@/components/ThemeToggle";
import Button from "@/components/ui/Button";
import { AdminAuthProvider, useAdminAuthContext } from "@/context/AdminAuthContext";
import SignInCard from "./SignInCard";

const NAV_ITEMS = [
  {
    href: "/admin/products",
    label: "Products",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: "/admin/layouts",
    label: "Layouts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="8" height="7" rx="1"/><rect x="15" y="14" width="6" height="7" rx="1"/>
      </svg>
    ),
  },
];

function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { adminState, signIn, signOut } = useAdminAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  async function handleSignOut() {
    await signOut();
  }

  // Not yet authorized — show full-page auth states
  if (
    adminState.status === "no-env" ||
    adminState.status === "checking" ||
    adminState.status === "signed-out" ||
    adminState.status === "unauthorized"
  ) {
    return (
      <div className="flex flex-1 flex-col bg-page font-sans">
        <header className="sticky top-0 z-40 border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
          <div className="mx-auto flex w-full items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Image src="/miniLeaf.png" alt="MiniLeaf" width={40} height={40} className="rounded-xl" priority />
              <span className="text-base font-semibold text-black dark:text-zinc-50">Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/" className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/10">
                Back
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-4 px-4 py-12">
          {adminState.status === "no-env" && (
            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
              Supabase is not configured. Add env vars in <span className="font-medium">.env.local</span>.
            </div>
          )}
          {adminState.status === "checking" && (
            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
              Checking session…
            </div>
          )}
          {adminState.status === "signed-out" && <SignInCard onSignIn={signIn} />}
          {adminState.status === "unauthorized" && (
            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200">
              Signed in as <span className="font-medium">{adminState.email ?? "(unknown)"}</span>, but this user is not an admin.
              <button type="button" onClick={() => void handleSignOut()} className="ml-2 text-red-500 underline text-xs">Sign out</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Authorized — show full sidebar layout
  return (
    <div className="flex h-screen flex-col bg-page font-sans overflow-hidden">
      {/* Top bar */}
      <header className="z-40 shrink-0 border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            {/* Hamburger — always visible */}
            <button
              type="button"
              className="-ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <Image src="/miniLeaf.png" alt="MiniLeaf" width={36} height={36} className="rounded-xl" priority />
            <span className="hidden text-sm font-semibold text-black dark:text-zinc-50 sm:inline">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/10">
              <span className="hidden sm:inline">Back to store</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <Button type="button" onClick={() => void handleSignOut()}>
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <nav className={`absolute inset-y-0 left-0 z-50 w-52 overflow-y-auto border-r border-black/10 bg-white py-4 transition-transform dark:border-white/10 dark:bg-zinc-950 sm:relative sm:inset-auto sm:z-auto sm:shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full sm:hidden"
        }`}>
          <ul className="flex flex-col gap-0.5 px-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-50"
                    }`}
                    style={active ? { backgroundColor: "var(--accent)" } : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <AdminShell>{children}</AdminShell>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}
