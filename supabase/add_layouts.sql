-- ── Layouts + Layout Pages tables ──────────────────────────────────────────
-- Run this in the Supabase SQL Editor.

-- 1. layouts table
create table if not exists public.layouts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  orientation   text not null default 'landscape' check (orientation in ('portrait', 'landscape')),
  is_active     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Only one layout can be active at a time (enforced by the API, not a DB constraint,
-- because partial unique indexes on booleans are tricky across DBs).

-- 2. layout_pages table
create table if not exists public.layout_pages (
  id            uuid primary key default gen_random_uuid(),
  layout_id     uuid not null references public.layouts(id) on delete cascade,
  page_order    integer not null default 0,
  template_id   text not null,
  slots         jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create index if not exists layout_pages_layout_id_idx on public.layout_pages(layout_id);

-- 3. Enable RLS
alter table public.layouts enable row level security;
alter table public.layout_pages enable row level security;

-- 4. Permissive RLS policies (anon key reads + writes, same pattern as site_config)
create policy "layouts_select" on public.layouts for select using (true);
create policy "layouts_insert" on public.layouts for insert with check (true);
create policy "layouts_update" on public.layouts for update using (true) with check (true);
create policy "layouts_delete" on public.layouts for delete using (true);

create policy "layout_pages_select" on public.layout_pages for select using (true);
create policy "layout_pages_insert" on public.layout_pages for insert with check (true);
create policy "layout_pages_update" on public.layout_pages for update using (true) with check (true);
create policy "layout_pages_delete" on public.layout_pages for delete using (true);
