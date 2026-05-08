import { useCallback, useEffect, useState } from "react";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Client = ReturnType<typeof createSupabaseBrowserClient>;

export type AdminState =
  | { status: "no-env" }
  | { status: "checking" }
  | { status: "signed-out" }
  | { status: "unauthorized"; email?: string }
  | { status: "authorized"; email?: string };

export function useAdminAuth(supabase: Client) {
  const [adminState, setAdminState] = useState<AdminState>(
    supabase ? { status: "checking" } : { status: "no-env" }
  );

  const refresh = useCallback(async () => {
    if (!supabase) return;
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
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    const t = setTimeout(() => void refresh(), 0);
    const { data: sub } = supabase.auth.onAuthStateChange(() => void refresh());
    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, [supabase, refresh]);

  async function signIn(email: string, password: string): Promise<string | null> {
    if (!supabase) return "Supabase not configured.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    await refresh();
    return null;
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAdminState({ status: "signed-out" });
  }

  return { adminState, signIn, signOut };
}
