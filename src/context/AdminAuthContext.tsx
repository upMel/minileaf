"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAdminAuth, type AdminState } from "@/hooks/useAdminAuth";

type Client = ReturnType<typeof createSupabaseBrowserClient>;

type AdminAuthCtx = {
  supabase: Client;
  adminState: AdminState;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthCtx | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { adminState, signIn, signOut } = useAdminAuth(supabase);

  return (
    <AdminAuthContext.Provider value={{ supabase, adminState, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuthContext(): AdminAuthCtx {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuthContext must be used inside AdminAuthProvider");
  return ctx;
}
