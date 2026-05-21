-- Migration: add site_config table for storing global app configuration (e.g. active layout)
-- Run in Supabase SQL Editor.

create table if not exists public.site_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Seed with a default empty layout config
insert into public.site_config (key, value)
values (
  'active_layout',
  '{"templateId": "weekly-special", "slots": {"hero": null, "featured-1": null, "featured-2": null, "featured-3": null, "featured-4": null, "small-1": null, "small-2": null, "small-3": null, "small-4": null}}'::jsonb
)
on conflict (key) do nothing;

-- RLS policies
-- site_config holds non-sensitive global configuration (layout templates).
-- Allow the anon key to read and write; the home page (public) reads layout,
-- and the admin API route writes layout using the server-side anon key.
-- If you later add a SUPABASE_SERVICE_ROLE_KEY to the API route, remove the
-- insert/update policies below and rely on the service role bypassing RLS.
create policy "site_config_select"
  on public.site_config for select
  using (true);

create policy "site_config_insert"
  on public.site_config for insert
  with check (true);

create policy "site_config_update"
  on public.site_config for update
  using (true)
  with check (true);
