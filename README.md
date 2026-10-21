# Mini Market Καιμακίδης

Website of Mini Market Καιμακίδης (since 1965): the shop's catalogue with
ΣΟΥΠΕΡ ΤΙΜΗ and 1+1 offers, the weekly flyer, store details and opening
hours, plus an admin for the owner. Next.js (App Router) + Supabase, installable
as a PWA. Greek first, English available.

**Shop** (`src/app/(store)`, styles in `store.css`, scoped under `.ks`)
- Home: offers banner (set up in the admin) and the product categories
- Category / product / search pages, Προσφορές (Super price + 1+1, by offer group)
- Φυλλάδιο: the active flyer, pages turn like paper (phones: swipe, ≤ 4 products a page)
- Το κατάστημα: phone, address, map, opening hours (open/closed now)

**Admin** (`/admin`, styles in `admin.css`, scoped under `.ka`)
- Products (barcode look-up on e-katanalotis, photo upload, per piece / per kg,
  ΣΟΥΠΕΡ ΤΙΜΗ, 1+1, admin-only competitor price)
- Banner: rotating pages, each a layout of boxes holding a product or a picture
- Flyers: pages built from products, or pictures exported from Canva, mixed
- Categories (pictures, subcategories) and the offer groups of the Προσφορές page
- Store details and opening hours

Every admin write goes straight to Supabase with the admin's session; row-level
security allows writes only for users listed in `admin_users`.

## Local dev

### Prereqs
- Node.js 20+

### Commands
```bash
npm install
npm run dev
```

Open http://localhost:3000

## Supabase

The site reads everything from Supabase. Configure it like this:

1) Create a Supabase project
2) Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor
3) Copy `.env.example` to `.env.local` and set:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

If the env vars are missing, the shop runs on built-in demo data (and the admin is unavailable).

### Migrations

Run these in the Supabase SQL Editor, in this order (each is safe to re-run unless noted):

1. `supabase/schema.sql`
2. `supabase/add_site_config.sql` (run once — its policies are replaced by step 6)
3. `supabase/add_layouts.sql` (run once — its policies are replaced by step 6)
4. `supabase/add_product_description_and_unit.sql`
5. `supabase/add_product_images_bucket.sql`
6. `supabase/add_kaimakidis_refactor.sql` — Kaimakidis storefront data model: ΣΟΥΠΕΡ ΤΙΜΗ / 1+1 flags, offer groups, banner, flyer image pages, store info, admin-only writes. Ends with a short checklist table.
7. `supabase/cleanup_after_kaimakidis.sql` — **only after the new site is live**: drops the old `promotions` table and `deals` view, which the new site no longer reads.

### Admin login

The public site has no user accounts. Only the owner uses Supabase Auth to access `/admin`.

1) In Supabase: Authentication → Users → Add user (email + password)
2) Copy that user’s UUID
3) In SQL Editor, run:

```sql
insert into public.admin_users (user_id, email)
values ('<USER_UUID>', '<EMAIL>');
```

Now sign in at `/admin` with that email/password.

### Build (production)
```bash
npm run lint
npm run build
npm run start
```

## Branching (solo-friendly)

Long-lived branches:
- `dev`: daily work
- `uat`: “staging” / pre-release checkpoint
- `master`: production-ready

Recommended flow:
1) Work on `dev` (direct commits are fine)
2) When ready to test like “release candidate”: PR `dev` → `uat`
3) When ready to release: PR `uat` → `master`

CI runs on PRs (lint + build).

## Releases (tags)

Use lightweight semver tags:
- `v0.1.0`, `v0.1.1`, `v0.2.0`, ...

Typical release steps:
```bash
git switch master
git pull
git tag v0.1.0
git push origin v0.1.0
```

If you want release notes on GitHub, create a GitHub Release from that tag.

