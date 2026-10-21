-- ═════════════════════════════════════════════════════════════════════════════
-- Cleanup after the Kaimakidis site is live
--
-- Run this ONLY once the new site is deployed: the old site still reads the
-- objects below, the new one never does. Safe to re-run.
--
-- Removes the old promotions model (% off, fixed promo price, 1+1 rows),
-- which add_kaimakidis_refactor.sql replaced with two flags on products:
-- is_super_price (ΣΟΥΠΕΡ ΤΙΜΗ) and is_bogo (1+1, back-filled from the
-- running 1+1 promotions at the time).
--
--   • view  public.deals          (the old deals page)
--   • table public.promotions     (and its policies, indexes and trigger)
--   • type  public.promotion_type
--
-- Products, categories, flyers, banner, offer groups and store details are
-- not touched.
-- ═════════════════════════════════════════════════════════════════════════════

begin;

drop view if exists public.deals;
drop table if exists public.promotions;
drop type if exists public.promotion_type;

commit;

-- Check: both should be null.
select to_regclass('public.deals') as deals_view, to_regclass('public.promotions') as promotions_table;
