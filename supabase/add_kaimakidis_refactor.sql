-- ═════════════════════════════════════════════════════════════════════════════
-- Kaimakidis refactor — step 1: data model (ADDITIVE, safe to re-run)
--
-- Run in the Supabase SQL Editor AFTER schema.sql and the earlier add_*.sql
-- migrations. Everything runs in one transaction: if any statement fails,
-- nothing is changed.
--
-- This migration only ADDS. The live site keeps working unchanged:
--   • the `deals` view, the `promotions` table and every existing column stay;
--   • a later cleanup migration removes them once the new site is deployed.
--
-- What it does
--   1. products       + size, is_super_price, is_bogo (1+1), search_key
--                       (is_bogo is back-filled ONCE from running 1+1 promotions)
--   2. categories     + image_url (top-level ones get the artifact's pictures)
--   3. offer_groups   new: the Deals-page groups (+ which categories they cover)
--   4. banner_pages   new: home-page banner pages (template + slots)
--   5. layout_pages   flyer pages can now be an uploaded image instead of a template
--   6. site_config    'store' row: phone, address, map link, opening hours
--   7. security       site_config / layouts / layout_pages: writes admin-only
--                       (they were writable by anyone with the public key)
--   8. storage        'site-images' bucket for banners, flyer pages, category art
--   9. catalog view   what the new storefront reads
--  10. report         a short checklist printed at the end
-- ═════════════════════════════════════════════════════════════════════════════

begin;

-- ── 0. Helper: case- and accent-insensitive Greek text key ───────────────────
-- 'Γιαούρτια' and 'ΓΙΑΟΥΡΤΙΑ' and 'γιαουρτια' all fold to 'γιαουρτια'.
-- Used to match category names below and for accent-insensitive product search.
create or replace function public.greek_fold(t text)
returns text
language sql
immutable
parallel safe
as $$
  select translate(lower(btrim(coalesce(t, ''))), 'άέήίόύώϊϋΐΰς', 'αεηιουωιυιυσ')
$$;

-- updated_at trigger function (already in schema.sql; repeated so this file stands alone)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── 1. Products ──────────────────────────────────────────────────────────────
alter table public.products add column if not exists size text;
alter table public.products add column if not exists is_super_price boolean not null default false;

do $$
begin
  -- Add is_bogo and back-fill it exactly once (when the column is first created),
  -- so re-running this file never re-ticks a 1+1 the admin has since unticked.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'is_bogo'
  ) then
    alter table public.products add column is_bogo boolean not null default false;

    if to_regclass('public.promotions') is not null then
      update public.products p
      set is_bogo = true
      where exists (
        select 1 from public.promotions pr
        where pr.product_id = p.id
          and pr.is_active
          and (pr.type = 'BOGO' or pr.is_bogo)
          and (pr.starts_at is null or pr.starts_at <= now())
          and (pr.ends_at   is null or pr.ends_at   >= now())
      );
    end if;
  end if;

  -- Accent-insensitive search text (name + size), kept up to date by Postgres.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'search_key'
  ) then
    alter table public.products
      add column search_key text
      generated always as (public.greek_fold(coalesce(name, '') || ' ' || coalesce(size, ''))) stored;
  end if;
end$$;

comment on column public.products.size is
  'Package / quantity shown under the name, e.g. "500 γρ.", "6 × 1,5 λίτρο".';
comment on column public.products.is_super_price is
  'ΣΟΥΠΕΡ ΤΙΜΗ: shown with a badge and listed on the Deals page.';
comment on column public.products.is_bogo is
  '1+1: shown with a 1+1 badge and listed on the Deals page.';
comment on column public.products.search_key is
  'Generated: greek_fold(name || size). Search with ilike on a greek_fold()-ed query.';
comment on column public.products.competitor_price is
  'Optional. Admin-only reference; not shown on the storefront.';

create index if not exists products_super_price_idx on public.products (is_super_price) where is_super_price;
create index if not exists products_bogo_idx        on public.products (is_bogo)        where is_bogo;


-- ── 2. Categories: picture per category ──────────────────────────────────────
alter table public.categories add column if not exists image_url text;

comment on column public.categories.image_url is
  'Picture on the category tile. Bundled art lives in /public/kaimakidis/categories; admin uploads go to the site-images bucket.';

-- Give the 25 top-level categories the artifact's pictures (only where none is set yet).
with seed(name, file) as (
  values
    ('Έτοιμα Γεύματα', '00'),
    ('Αλλαντικά', '01'),
    ('Αναψυκτικά, Νερά & Χυμοί', '02'),
    ('Απορρυπαντικά & Είδη Καθαρισμού', '03'),
    ('Αυγά, Βούτυρο, Νωπές Ζύμες & Ζωμοί', '04'),
    ('Βρεφικές & Παιδικές τροφές', '05'),
    ('Γάλατα, Ροφήματα & Χυμοί ψυγείου', '06'),
    ('Γιαούρτια, Κρέμες γάλακτος & Επιδόρπια ψυγείου', '07'),
    ('Είδη Αρτοζαχαροπλαστείου', '08'),
    ('Είδη Οικιακής χρήσης', '09'),
    ('Είδη μιας χρήσης & Είδη Πάρτι', '10'),
    ('Είδη πρωινού & Ροφήματα', '11'),
    ('Κάβα', '12'),
    ('Καλλυντικά & Είδη Προσωπικής υγιεινής', '13'),
    ('Κατεψυγμένα', '14'),
    ('Μπισκότα, Σοκολάτες & Ζαχαρώδη', '15'),
    ('Ξηροί Καρποί & Σνακ', '16'),
    ('Ορεκτικά & Delicatessen', '17'),
    ('Τροφές & Είδη για Κατοικίδια', '18'),
    ('Τρόφιμα Παντοπωλείου', '19'),
    ('Τυροκομικά & Φυτικά Αναπληρώματα', '20'),
    ('Φρέσκα Φρούτα & Λαχανικά', '21'),
    ('Φρέσκο Κρέας', '22'),
    ('Φρέσκο Ψάρι & Θαλασσινά', '23'),
    ('Χαρτικά, Πάνες & Σερβιέτες', '24')
)
update public.categories c
set image_url = '/kaimakidis/categories/' || s.file || '.webp'
from seed s
where c.parent_id is null
  and c.image_url is null
  and public.greek_fold(c.name) = public.greek_fold(s.name);


-- ── 3. Offer groups (Deals page tiles) ───────────────────────────────────────
create table if not exists public.offer_groups (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (char_length(btrim(name)) > 0),
  image_url          text,
  sort_order         integer not null default 0,
  -- show the category's subcategories as filter chips (used by "Για το μωρό")
  show_subcategories boolean not null default false,
  is_visible         boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.offer_group_categories (
  group_id    uuid not null references public.offer_groups(id) on delete cascade,
  category_id uuid not null references public.categories(id)   on delete cascade,
  sort_order  integer not null default 0,
  primary key (group_id, category_id)
);

create index if not exists offer_groups_sort_idx               on public.offer_groups (sort_order);
create index if not exists offer_group_categories_category_idx on public.offer_group_categories (category_id);

drop trigger if exists trg_offer_groups_set_updated_at on public.offer_groups;
create trigger trg_offer_groups_set_updated_at
  before update on public.offer_groups
  for each row execute function public.set_updated_at();

-- Seed the artifact's 12 groups — only into an empty table, so admin edits are never overwritten.
do $$
begin
  if not exists (select 1 from public.offer_groups) then
    with g(sort_order, name, file, show_subs, cats) as (
      values
        (0, 'Γαλακτοκομικά & Αυγά', '00', false, array['Γάλατα, Ροφήματα & Χυμοί ψυγείου', 'Γιαούρτια, Κρέμες γάλακτος & Επιδόρπια ψυγείου', 'Αυγά, Βούτυρο, Νωπές Ζύμες & Ζωμοί']),
        (1, 'Αλλαντικά & Τυριά', '01', false, array['Αλλαντικά', 'Τυροκομικά & Φυτικά Αναπληρώματα']),
        (2, 'Φρούτα & Λαχανικά', '02', false, array['Φρέσκα Φρούτα & Λαχανικά']),
        (3, 'Κατεψυγμένα', '03', false, array['Κατεψυγμένα']),
        (4, 'Παντοπωλείο & Delicatessen', '04', false, array['Τρόφιμα Παντοπωλείου', 'Ορεκτικά & Delicatessen']),
        (5, 'Πρωινό & Αρτοποιήματα', '05', false, array['Είδη πρωινού & Ροφήματα', 'Είδη Αρτοζαχαροπλαστείου']),
        (6, 'Σνακ & Γλυκά', '06', false, array['Μπισκότα, Σοκολάτες & Ζαχαρώδη', 'Ξηροί Καρποί & Σνακ']),
        (7, 'Ποτά, Αναψυκτικά, Νερά', '07', false, array['Αναψυκτικά, Νερά & Χυμοί', 'Κάβα']),
        (8, 'Καθαριότητα & Σπίτι', '08', false, array['Απορρυπαντικά & Είδη Καθαρισμού', 'Είδη Οικιακής χρήσης', 'Είδη μιας χρήσης & Είδη Πάρτι']),
        (9, 'Προσωπική φροντίδα', '09', false, array['Καλλυντικά & Είδη Προσωπικής υγιεινής', 'Χαρτικά, Πάνες & Σερβιέτες']),
        (10, 'Για το μωρό', '10', true, array['Βρεφικές & Παιδικές τροφές']),
        (11, 'Για τα κατοικίδια', '11', false, array['Τροφές & Είδη για Κατοικίδια'])
    ),
    ins as (
      insert into public.offer_groups (name, image_url, sort_order, show_subcategories)
      select name, '/kaimakidis/offer-groups/' || file || '.webp', sort_order, show_subs
      from g
      returning id, sort_order
    )
    insert into public.offer_group_categories (group_id, category_id, sort_order)
    select ins.id, c.id, (u.ord - 1)::int
    from ins
    join g using (sort_order)
    cross join lateral unnest(g.cats) with ordinality as u(cat_name, ord)
    join public.categories c
      on c.parent_id is null
     and public.greek_fold(c.name) = public.greek_fold(u.cat_name);
  end if;
end$$;


-- ── 4. Home-page banner ──────────────────────────────────────────────────────
-- One banner on the home page made of pages that rotate. Each page uses a banner
-- template (defined in the app, src/lib/banner-templates.ts) and fills its slots.
--
-- slots is a JSON object keyed by the template's slot ids. Each value is null or:
--   { "type": "product", "product_id": "<uuid>" }
--   { "type": "image",   "image_url": "<url>", "alt": "<text>",
--     "link": null | { "kind": "product" | "category" | "offer_group" | "deals" | "flyer" | "url",
--                      "target": "<id or url>" } }
-- Slots pointing at a hidden or deleted product are skipped by the storefront.
create table if not exists public.banner_pages (
  id          uuid primary key default gen_random_uuid(),
  page_order  integer not null default 0,
  template_id text not null,
  slots       jsonb not null default '{}'::jsonb check (jsonb_typeof(slots) = 'object'),
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists banner_pages_order_idx on public.banner_pages (page_order);

drop trigger if exists trg_banner_pages_set_updated_at on public.banner_pages;
create trigger trg_banner_pages_set_updated_at
  before update on public.banner_pages
  for each row execute function public.set_updated_at();


-- ── 5. Flyer pages: template page OR uploaded (Canva) image ──────────────────
-- (tables from add_layouts.sql, created here too in case that file was never run)
create table if not exists public.layouts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  orientation text not null default 'landscape' check (orientation in ('portrait', 'landscape')),
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.layout_pages (
  id          uuid primary key default gen_random_uuid(),
  layout_id   uuid not null references public.layouts(id) on delete cascade,
  page_order  integer not null default 0,
  template_id text not null,
  slots       jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists layout_pages_layout_id_idx on public.layout_pages (layout_id);

alter table public.layout_pages add column if not exists kind text not null default 'template';
alter table public.layout_pages add column if not exists image_url text;
alter table public.layout_pages alter column template_id drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'layout_pages_kind_check') then
    alter table public.layout_pages
      add constraint layout_pages_kind_check check (kind in ('template', 'image'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'layout_pages_content_check') then
    alter table public.layout_pages
      add constraint layout_pages_content_check check (
        (kind = 'template' and template_id is not null)
        or (kind = 'image' and image_url is not null)
      );
  end if;
end$$;

comment on column public.layout_pages.kind is
  '''template'': built from template_id + slots. ''image'': a finished page uploaded from Canva (image_url).';


-- ── 6. Store info ────────────────────────────────────────────────────────────
create table if not exists public.site_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_config_set_updated_at on public.site_config;
create trigger trg_site_config_set_updated_at
  before update on public.site_config
  for each row execute function public.set_updated_at();

-- hours are keyed by weekday as in JavaScript (0 = Sunday … 6 = Saturday);
-- null = closed, otherwise ["open", "close"] in 24h Athens time.
insert into public.site_config (key, value)
values (
  'store',
  jsonb_build_object(
    'name',    'Mini Market Καιμακίδης',
    'tagline', 'Στη γειτονιά σου, από το 1965.',
    'phone',   '210 346 7558',
    'address', 'Σμύρνης 4, Ταύρος',
    'map_url', 'https://maps.app.goo.gl/aQ85WFuv1Aq33t7H9',
    'hours', jsonb_build_object(
      '0', null,
      '1', jsonb_build_array('09:00', '18:00'),
      '2', jsonb_build_array('09:00', '20:30'),
      '3', jsonb_build_array('09:00', '18:00'),
      '4', jsonb_build_array('09:00', '20:30'),
      '5', jsonb_build_array('09:00', '20:30'),
      '6', jsonb_build_array('09:00', '18:00')
    )
  )
)
on conflict (key) do nothing;


-- ── 7. Row level security ────────────────────────────────────────────────────
-- Pattern everywhere: anyone may read what the storefront shows; only admins write.
-- (Server routes using the service-role key bypass RLS and are unaffected.)

-- site_config: was insert/update for anyone → admin-only
alter table public.site_config enable row level security;
drop policy if exists "site_config_select" on public.site_config;
drop policy if exists "site_config_insert" on public.site_config;
drop policy if exists "site_config_update" on public.site_config;
drop policy if exists site_config_public_select on public.site_config;
drop policy if exists site_config_admin_insert  on public.site_config;
drop policy if exists site_config_admin_update  on public.site_config;
drop policy if exists site_config_admin_delete  on public.site_config;
create policy site_config_public_select on public.site_config for select to anon, authenticated using (true);
create policy site_config_admin_insert  on public.site_config for insert to authenticated with check (public.is_admin());
create policy site_config_admin_update  on public.site_config for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy site_config_admin_delete  on public.site_config for delete to authenticated using (public.is_admin());

-- layouts (flyers): was insert/update/delete for anyone → admin-only
alter table public.layouts enable row level security;
drop policy if exists "layouts_select" on public.layouts;
drop policy if exists "layouts_insert" on public.layouts;
drop policy if exists "layouts_update" on public.layouts;
drop policy if exists "layouts_delete" on public.layouts;
drop policy if exists layouts_public_select on public.layouts;
drop policy if exists layouts_admin_insert  on public.layouts;
drop policy if exists layouts_admin_update  on public.layouts;
drop policy if exists layouts_admin_delete  on public.layouts;
create policy layouts_public_select on public.layouts for select to anon, authenticated using (true);
create policy layouts_admin_insert  on public.layouts for insert to authenticated with check (public.is_admin());
create policy layouts_admin_update  on public.layouts for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy layouts_admin_delete  on public.layouts for delete to authenticated using (public.is_admin());

alter table public.layout_pages enable row level security;
drop policy if exists "layout_pages_select" on public.layout_pages;
drop policy if exists "layout_pages_insert" on public.layout_pages;
drop policy if exists "layout_pages_update" on public.layout_pages;
drop policy if exists "layout_pages_delete" on public.layout_pages;
drop policy if exists layout_pages_public_select on public.layout_pages;
drop policy if exists layout_pages_admin_insert  on public.layout_pages;
drop policy if exists layout_pages_admin_update  on public.layout_pages;
drop policy if exists layout_pages_admin_delete  on public.layout_pages;
create policy layout_pages_public_select on public.layout_pages for select to anon, authenticated using (true);
create policy layout_pages_admin_insert  on public.layout_pages for insert to authenticated with check (public.is_admin());
create policy layout_pages_admin_update  on public.layout_pages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy layout_pages_admin_delete  on public.layout_pages for delete to authenticated using (public.is_admin());

-- offer_groups: visitors see visible groups, admins see all
alter table public.offer_groups enable row level security;
drop policy if exists offer_groups_public_select on public.offer_groups;
drop policy if exists offer_groups_admin_select  on public.offer_groups;
drop policy if exists offer_groups_admin_insert  on public.offer_groups;
drop policy if exists offer_groups_admin_update  on public.offer_groups;
drop policy if exists offer_groups_admin_delete  on public.offer_groups;
create policy offer_groups_public_select on public.offer_groups for select to anon, authenticated using (is_visible);
create policy offer_groups_admin_select  on public.offer_groups for select to authenticated using (public.is_admin());
create policy offer_groups_admin_insert  on public.offer_groups for insert to authenticated with check (public.is_admin());
create policy offer_groups_admin_update  on public.offer_groups for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy offer_groups_admin_delete  on public.offer_groups for delete to authenticated using (public.is_admin());

alter table public.offer_group_categories enable row level security;
drop policy if exists offer_group_categories_public_select on public.offer_group_categories;
drop policy if exists offer_group_categories_admin_insert  on public.offer_group_categories;
drop policy if exists offer_group_categories_admin_update  on public.offer_group_categories;
drop policy if exists offer_group_categories_admin_delete  on public.offer_group_categories;
create policy offer_group_categories_public_select on public.offer_group_categories for select to anon, authenticated using (true);
create policy offer_group_categories_admin_insert  on public.offer_group_categories for insert to authenticated with check (public.is_admin());
create policy offer_group_categories_admin_update  on public.offer_group_categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy offer_group_categories_admin_delete  on public.offer_group_categories for delete to authenticated using (public.is_admin());

-- banner_pages: visitors see visible pages, admins see all
alter table public.banner_pages enable row level security;
drop policy if exists banner_pages_public_select on public.banner_pages;
drop policy if exists banner_pages_admin_select  on public.banner_pages;
drop policy if exists banner_pages_admin_insert  on public.banner_pages;
drop policy if exists banner_pages_admin_update  on public.banner_pages;
drop policy if exists banner_pages_admin_delete  on public.banner_pages;
create policy banner_pages_public_select on public.banner_pages for select to anon, authenticated using (is_visible);
create policy banner_pages_admin_select  on public.banner_pages for select to authenticated using (public.is_admin());
create policy banner_pages_admin_insert  on public.banner_pages for insert to authenticated with check (public.is_admin());
create policy banner_pages_admin_update  on public.banner_pages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy banner_pages_admin_delete  on public.banner_pages for delete to authenticated using (public.is_admin());

grant select on table
  public.site_config, public.layouts, public.layout_pages,
  public.offer_groups, public.offer_group_categories, public.banner_pages
  to anon, authenticated;
grant insert, update, delete on table
  public.site_config, public.layouts, public.layout_pages,
  public.offer_groups, public.offer_group_categories, public.banner_pages
  to authenticated;


-- ── 8. Storage: 'site-images' bucket ─────────────────────────────────────────
-- Banner images, Canva flyer pages, category / offer-group pictures.
-- Public read (stable URLs), admin-only upload/replace/delete. 10 MB per file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site_images_public_select" on storage.objects;
create policy "site_images_public_select"
  on storage.objects for select
  using (bucket_id = 'site-images');

drop policy if exists "site_images_admin_insert" on storage.objects;
create policy "site_images_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists "site_images_admin_update" on storage.objects;
create policy "site_images_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-images' and public.is_admin())
  with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists "site_images_admin_delete" on storage.objects;
create policy "site_images_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-images' and public.is_admin());


-- ── 9. Storefront view ───────────────────────────────────────────────────────
-- Visible products with their top-level category and subcategory resolved.
-- Competitor fields are deliberately left out (admin-only).
drop view if exists public.catalog;
create view public.catalog with (security_invoker = true) as
select
  p.id,
  p.name,
  p.description,
  p.size,
  p.image_url,
  p.price,
  p.price_unit,
  p.is_super_price,
  p.is_bogo,
  p.barcode,
  p.category_id,
  coalesce(cat.parent_id, cat.id)                   as root_category_id,
  case when cat.parent_id is not null then cat.id end as subcategory_id,
  p.search_key,
  p.updated_at
from public.products p
left join public.categories cat on cat.id = p.category_id
where p.is_active;

grant select on table public.catalog to anon, authenticated;

commit;


-- ── 10. Report ───────────────────────────────────────────────────────────────
-- The SQL Editor shows this table after the run. "needs a look" rows are worth
-- checking; everything else is informational.
select item, value, status
from (
  select 1 as n, 'Top-level categories with a picture' as item,
         count(*) filter (where image_url is not null) || ' of ' || count(*) as value,
         case when count(*) filter (where image_url is null) = 0 then 'ok' else 'needs a look' end as status
  from public.categories where parent_id is null
  union all
  select 2, 'Top-level categories without a picture',
         coalesce(string_agg(name, ' · ' order by sort_order), '—'),
         case when count(*) = 0 then 'ok' else 'needs a look' end
  from public.categories where parent_id is null and image_url is null
  union all
  select 3, 'Offer groups', count(*)::text, case when count(*) > 0 then 'ok' else 'needs a look' end
  from public.offer_groups
  union all
  select 4, 'Offer groups with no category linked',
         coalesce(string_agg(g.name, ' · ' order by g.sort_order), '—'),
         case when count(*) = 0 then 'ok' else 'needs a look' end
  from public.offer_groups g
  where not exists (select 1 from public.offer_group_categories gc where gc.group_id = g.id)
  union all
  select 5, 'Products marked 1+1 (from running promotions)',
         count(*) filter (where is_bogo)::text, 'info'
  from public.products
  union all
  select 6, 'Products with a running %/fixed-price promotion (these lose the discount on the new site)',
         (select count(distinct pr.product_id)::text from public.promotions pr
           where pr.is_active and pr.type in ('PERCENT', 'PRICE')
             and (pr.starts_at is null or pr.starts_at <= now())
             and (pr.ends_at   is null or pr.ends_at   >= now())),
         'info'
  union all
  select 7, 'Store info row', case when exists (select 1 from public.site_config where key = 'store') then 'present' else 'missing' end,
         case when exists (select 1 from public.site_config where key = 'store') then 'ok' else 'needs a look' end
) r
order by n;
