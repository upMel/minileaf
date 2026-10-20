"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * fetch() for admin API routes: adds the signed-in user's access token so the
 * route can check they're an admin (see `requireAdmin`).
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const headers = new Headers(init.headers);
  if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  return fetch(input, { ...init, headers });
}
