-- MiniLeaf seed data (optional)
-- Run AFTER applying supabase/schema.sql

-- Insert products
insert into public.products (
  sku,
  name,
  supplier,
  category,
  image_url,
  competitor_name,
  competitor_price,
  price,
  is_active
)
values
  ('YOG-200', 'Greek yogurt 200g', null, 'Dairy', null, 'BigMart', 3.99, 3.49, true),
  ('PAS-500', 'Pasta 500g', null, 'Pantry', null, 'BigMart', 2.29, 1.89, true),
  ('SHA-400', 'Shampoo 400ml', null, 'Personal care', null, 'BigMart', 5.50, 4.50, true)
on conflict (sku) do update set
  name = excluded.name,
  supplier = excluded.supplier,
  category = excluded.category,
  image_url = excluded.image_url,
  competitor_name = excluded.competitor_name,
  competitor_price = excluded.competitor_price,
  price = excluded.price,
  is_active = excluded.is_active;

-- Clear existing promotions for these SKUs (keeps seed repeatable)
delete from public.promotions pr
using public.products p
where pr.product_id = p.id
  and p.sku in ('YOG-200', 'PAS-500', 'SHA-400');

-- Insert promotions (one active promo per product)
insert into public.promotions (product_id, type, percent_off, promo_price, is_bogo, starts_at, ends_at, is_active, label)
select
  p.id,
  v.type::promotion_type,
  v.percent_off,
  v.promo_price,
  v.is_bogo,
  now() - interval '1 day',
  now() + interval '30 days',
  true,
  v.label
from public.products p
join (
  values
    ('YOG-200', 'PERCENT', 43, null::numeric, false, null::text),
    ('PAS-500', 'PERCENT', 48, null::numeric, false, null::text),
    ('SHA-400', 'BOGO', null::int, null::numeric, true, '1+1')
) as v(sku, type, percent_off, promo_price, is_bogo, label)
  on v.sku = p.sku;
