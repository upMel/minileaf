import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";

export function createSupabaseServerClient() {
  const env = getSupabasePublicEnv();
  if (!env) return undefined;

  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
