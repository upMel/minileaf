"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AdminAuthProvider, useAdminAuthContext } from "@/context/AdminAuthContext";
import { useLanguage, useT } from "@/context/LanguageContext";

import "./admin.css";

const TABS = [
  { href: "/admin/products", key: "products" },
  { href: "/admin/layouts", key: "flyers" },
  { href: "/admin/categories", key: "categories" },
  { href: "/admin/store", key: "store" },
] as const;

function LanguageSwitch() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <div className="ka-lang" role="group" aria-label={t.language.label}>
      {(["el", "en"] as const).map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={locale === l} onClick={() => setLocale(l)}>
          {l === "el" ? "ΕΛ" : "EN"}
        </button>
      ))}
    </div>
  );
}

function SignIn({ onSignIn }: { onSignIn: (email: string, password: string) => Promise<string | null> }) {
  const t = useT().admin.signIn;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await onSignIn(email.trim(), password);
    if (err) setError(/invalid login credentials/i.test(err) ? t.wrongCredentials : err);
    setBusy(false);
  }

  return (
    <section className="ka-card ka-signin">
      <h1>{t.title}</h1>
      <p>{t.text}</p>
      <form onSubmit={(e) => void submit(e)}>
        <label className="ka-field">
          {t.email}
          <input type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="ka-field">
          {t.password}
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && (
          <p className="ka-error" role="alert">
            {error}
          </p>
        )}
        <div className="ka-actions">
          <button type="submit" className="ka-btn" disabled={busy}>
            {busy ? t.submitting : t.submit}
          </button>
        </div>
      </form>
    </section>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { adminState, signIn, signOut } = useAdminAuthContext();
  const t = useT().admin;
  const authorized = adminState.status === "authorized";

  return (
    <div className="ka">
      <div className="ka-wrap">
        <header className="ka-header">
          <Link className="ka-brand" href="/admin">
            <span>{t.brandTop}</span>
            <strong>{t.brandName}</strong>
          </Link>
          <div className="ka-header-actions">
            <LanguageSwitch />
            <Link className="ka-outline" href="/" target="_blank">
              {t.viewStore} ↗
            </Link>
            {(authorized || adminState.status === "unauthorized") && (
              <button type="button" className="ka-outline" onClick={() => void signOut()}>
                {t.signOut}
              </button>
            )}
          </div>
        </header>

        {adminState.status === "no-env" && <p className="ka-error">{t.signIn.noEnv}</p>}
        {adminState.status === "checking" && <p className="ka-intro">{t.signIn.checking}</p>}
        {adminState.status === "signed-out" && <SignIn onSignIn={signIn} />}
        {adminState.status === "unauthorized" && (
          <p className="ka-error" role="alert">
            {t.signIn.notAdmin(adminState.email ?? "—")}
          </p>
        )}

        {authorized && (
          <>
            <nav className="ka-tabs" aria-label={t.tabsLabel}>
              {TABS.map((tab) => (
                <Link key={tab.href} href={tab.href} aria-current={pathname.startsWith(tab.href) ? "page" : undefined}>
                  {t.tabs[tab.key]}
                </Link>
              ))}
            </nav>
            <main>{children}</main>
            {adminState.email && <p className="ka-user">{adminState.email}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <AdminShell>{children}</AdminShell>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}
