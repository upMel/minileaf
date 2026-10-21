"use client";

import { queryOptions } from "@tanstack/react-query";

import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { listBannerPages, type BannerPageRecord } from "@/services/banner";

type Client = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export const BANNER_KEY = ["banner-pages"] as const;

export function bannerQueryOptions(supabase: Client, enabled: boolean) {
  return queryOptions<BannerPageRecord[]>({
    queryKey: BANNER_KEY,
    queryFn: () => listBannerPages(supabase),
    enabled,
  });
}
