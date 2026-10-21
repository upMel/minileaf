"use client";

import { queryOptions } from "@tanstack/react-query";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getFlyer, listFlyers, type FlyerDetail, type FlyerSummary } from "@/services/flyers";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export const FLYERS_KEY = ["flyers"] as const;
export const flyerKey = (id: string) => ["flyers", id] as const;

export function flyersQueryOptions(supabase: Client, enabled: boolean) {
  return queryOptions<FlyerSummary[]>({
    queryKey: FLYERS_KEY,
    queryFn: () => listFlyers(supabase),
    enabled,
  });
}

export function flyerQueryOptions(supabase: Client, id: string, enabled: boolean) {
  return queryOptions<FlyerDetail>({
    queryKey: flyerKey(id),
    queryFn: () => getFlyer(supabase, id),
    enabled,
    retry: false,
  });
}
