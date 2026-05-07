-- MiniLeaf schema (Supabase Postgres)
-- Apply in Supabase SQL Editor.

-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'promotion_type') then
    create type promotion_type as enum ('PERCENT', 'PRICE', 'BOGO');
  end if;
end$$;

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  sku text unique,
  name text not null,
  brand text,
  category text,
  image_url text,

  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true
);

create index if not exists products_is_active_idx on public.products (is_active);
create index if not exists products_category_idx on public.products (category);

-- Promotions (discounts + 1+1)
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  product_id uuid not null references public.products(id) on delete cascade,

  type promotion_type not null,

  -- For PERCENT: percent_off (0..100)
  percent_off integer check (percent_off between 0 and 100),

  -- For PRICE: promo_price
  promo_price numeric(10,2) check (promo_price >= 0),

  -- For BOGO: set this true (percent_off can be stored as 50 for filtering)
  is_bogo boolean not null default false,

  starts_at timestamptz,
  ends_at timestamptz,

  is_active boolean not null default true,

  -- Optional label override (e.g. "1+1", "-30%")
  label text
);

create index if not exists promotions_product_id_idx on public.promotions (product_id);
create index if not exists promotions_is_active_idx on public.promotions (is_active);
create index if not exists promotions_date_idx on public.promotions (starts_at, ends_at);

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_products_set_updated_at'
  ) then
    create trigger trg_products_set_updated_at
    before update on public.products
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_promotions_set_updated_at'
  ) then
    create trigger trg_promotions_set_updated_at
    before update on public.promotions
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- A view for the customer deals page
-- (keeps UI query simple)
create or replace view public.deals as
select
  p.id as product_id,
  p.sku,
  p.name,
  p.brand,
  p.category,
  p.image_url,
  p.price as regular_price,

  pr.id as promotion_id,
  pr.type as promotion_type,
  pr.percent_off,
  pr.promo_price,
  pr.is_bogo,
  pr.label as promotion_label,
  pr.starts_at,
  pr.ends_at,

  -- effective price for display
  case
    when pr.id is null then p.price
    when pr.type = 'PRICE' then pr.promo_price
    when pr.type = 'PERCENT' then round((p.price * (100 - pr.percent_off)) / 100.0, 2)
    when pr.type = 'BOGO' then p.price
    else p.price
  end as effective_price,

  -- for filtering/sorting; treat BOGO as 50% by default
  case
    when pr.id is null then null
    when pr.type = 'PERCENT' then pr.percent_off
    when pr.type = 'BOGO' then 50
    else null
  end as effective_percent_off
from public.products p
left join public.promotions pr
  on pr.product_id = p.id
  and pr.is_active = true
  and (pr.starts_at is null or pr.starts_at <= now())
  and (pr.ends_at is null or pr.ends_at >= now())
where p.is_active = true;

-- RLS
alter table public.products enable row level security;
alter table public.promotions enable row level security;

-- Public read-only access for browsing deals.
-- NOTE: For an MVP we allow anonymous SELECT on products/promotions.
-- Later, we will lock down writes to authenticated owner accounts.

do $$
begin
  -- Products: public select
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'public_select_products'
  ) then
    create policy public_select_products
      on public.products
      for select
      to anon, authenticated
      using (is_active = true);
  end if;

  -- Promotions: public select (only active + within date window)
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'promotions' and policyname = 'public_select_promotions'
  ) then
    create policy public_select_promotions
      on public.promotions
      for select
      to anon, authenticated
      using (
        is_active = true
        and (starts_at is null or starts_at <= now())
        and (ends_at is null or ends_at >= now())
      );
  end if;
end$$;
