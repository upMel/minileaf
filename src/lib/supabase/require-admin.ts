import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getSupabasePublicEnv } from "./env";

/**
 * Guards admin-only route handlers. The browser sends the signed-in user's
 * access token as `Authorization: Bearer …` (see `adminFetch`); we check it
 * with Supabase and confirm the user is in `admin_users` via `is_admin()`.
 *
 * Returns null when the caller is an admin, or the error response to send.
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const env = getSupabasePublicEnv();
  if (!env) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const supabase = createClient(env.url, env.anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  return null;
}
