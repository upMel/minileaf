import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";

let client: SupabaseClient | undefined;

export function createSupabaseBrowserClient() {
  if (client) return client;

  const env = getSupabasePublicEnv();
  if (!env) return undefined;

  client = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}
