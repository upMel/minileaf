-- ─────────────────────────────────────────────────────────────────────────────
-- Adds a free-text description to products, and a pricing unit so a product can
-- be priced per piece (default) or per kilogram.
--
-- NOTE: the production database already has both columns and an up-to-date
-- deals view, so this is a no-op there. It exists for any environment still
-- missing them. Re-running is safe, but it DOES drop and recreate the deals
-- view from schema.sql's definition — apply it only to a database whose view
-- has no local changes.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.products
  add column if not exists description text;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'price_unit'
  ) then
    alter table public.products
      add column price_unit text not null default 'piece';

    alter table public.products
      add constraint products_price_unit_check check (price_unit in ('piece', 'kg'));
  end if;
end$$;

comment on column public.products.description is
  'Optional free-text description shown in the storefront product detail modal.';
comment on column public.products.price_unit is
  'How `price` is quoted: ''piece'' (per item, default) or ''kg'' (per kilogram).';

-- ─────────────────────────────────────────────────────────────────────────────
-- Recreate the customer-facing deals view so it carries the two new columns.
-- Definition is otherwise identical to schema.sql.
-- ─────────────────────────────────────────────────────────────────────────────
drop view if exists public.deals;
create or replace view public.deals with (security_invoker = true) as
select
  p.id as product_id,
  p.barcode,
  p.name,
  p.supplier,
  p.description,
  p.price_unit,

  -- category as free-text (legacy, kept for backward compat)
  p.category,

  -- structured category fields (preferred)
  p.category_id,
  cat.name        as category_name,
  cat.parent_id   as category_root_id,
  coalesce(root.name, cat.name) as category_root_name,

  p.image_url,
  p.competitor_name,
  p.competitor_price,
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
left join public.categories cat  on cat.id  = p.category_id
left join public.categories root on root.id = cat.parent_id
left join public.promotions pr
  on pr.product_id = p.id
  and pr.is_active = true
  and (pr.starts_at is null or pr.starts_at <= now())
  and (pr.ends_at is null or pr.ends_at >= now())
where p.is_active = true;

grant select on table public.deals to anon, authenticated;
