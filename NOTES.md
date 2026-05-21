# MiniLeaf — Notes / Future Plan

---

## Session log — 2026-05-08

### What was built

**1. Competitor prices API**
- Source: `https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/basket-retailers/prices.json`
  — 2.4 MB, ~2910 products, 11 Greek supermarkets (masoutis, ab, bazaar, lidl, xalkiadakis, sklavenitis, mymarket, marketin, efresh, galaxias, kritikos)
- `GET /api/competitor-prices?barcode=XXX` — returns `{ name, category, image_url, prices[] }` sorted cheapest-first; 24 h server cache
- `GET /api/competitor-categories` — returns full S3 category hierarchy with subcategories
- Greek-character image filenames must be `encodeURIComponent`-encoded per path segment
- `COMPETITOR_S3_URL` lives in `src/lib/competitor.ts` (Next.js rejects non-handler exports from route files)
- `next.config.ts`: added `warply.s3.amazonaws.com` to `remotePatterns`

**2. Categories management**
- New `categories` table: `id uuid, name, parent_id (self-ref), sort_order, created_at`; unique index on `lower(name)` for root rows
- RLS: public SELECT, admin INSERT/UPDATE/DELETE
- `src/services/categories.ts`: `fetchCategories`, `insertCategory`, `deleteCategory`, `renameCategory`, `importCategories` (deduplicates before inserting)
- `CategoryManager` admin component: "Sync from e-katanalotis" button (inserts roots, then subs with parent_id), add root, inline rename/delete

**3. sku → barcode, brand → supplier**
- `products` table column renames; schema migration block is safe to re-run
- `deals` view updated
- All TypeScript types, services, hooks and UI labels updated accordingly
- `supplier` field now rendered in the admin product form (was in schema but not in UI)

**4. Admin product form**
- Barcode field triggers `GET /api/competitor-prices` lookup
- Lookup result panel: 96px image preview, name, category, "Apply" button auto-fills all three
- Image URL field: live 40×40 thumbnail preview (hides on error)
- Category `<select>` uses `<optgroup>` grouping from Supabase `categories` table (no more S3 fetch inside form)

**5. Deal cards UI**
- Grid: 2 col mobile → 3 sm → 4 lg; portrait `aspect-[3/4]`, `rounded-3xl`, hover lift
- Price chip at **top-left**: our price (accent, extrabold) + competitor name + strikethrough price on one inline row
- Promo badge at **top-right**
- Name chip at **bottom**: `line-clamp-2`, semi-transparent frosted glass
- `SearchBar` component: text search, multi-select category chips, on-sale toggle, min/max price range
- `useSearchFilters` hook + `SearchFilters` type extracted to `src/types/search.ts`
- `Checkbox` UI component added

### Decisions made
- **Suppliers**: no separate table needed — the S3 `suppliers` array (~500 Greek food producers) maps directly to `products.supplier` (free-text field)
- **Images**: public S3 URLs used directly; no Supabase Storage upload yet (see section 1 below for the plan)

### Schema re-run reminder
The updated `supabase/schema.sql` must be run in Supabase SQL Editor after pulling:
- Renames `sku → barcode` and `brand → supplier` if those columns still exist
- Creates the `categories` table + policies
- Recreates the `deals` view with corrected column names

---

## 1) Upload product images (mobile / PC / camera)

### Goal
Let the admin choose an image from:
- PC/mobile file picker
- Mobile camera (capture)

Then upload to **Supabase Storage** and store the resulting URL in `products.image_url`.

### Why Storage
Right now `image_url` is a plain text URL, so you can paste external links. For real uploads, you want a bucket managed by Supabase.

### Database impact
- No schema changes required.
- Continue storing the final URL in `public.products.image_url`.

### Supabase setup (SQL/UI)
1. Create a bucket, e.g. `product-images`.
2. Choose access model:
   - **Public bucket** (simplest): store public URL.
   - **Private bucket**: store path, use signed URLs on read.

### RLS / policies (recommended)
- Allow **public read** only if you choose a public bucket.
- Allow **admin-only uploads**.

Typical policy intent:
- `SELECT` on bucket objects: public (optional)
- `INSERT/UPDATE/DELETE` on bucket objects: only when `public.is_admin()` is true

### Frontend plan (Admin)
In [src/app/admin/page.tsx](src/app/admin/page.tsx):

1. Add UI next to “Image URL”:
   - `input type="file" accept="image/*"`
   - Add `capture="environment"` for mobile camera capture option.

   Example:
   - File picker: `<input type="file" accept="image/*" />`
   - Camera: `<input type="file" accept="image/*" capture="environment" />`

2. On selection:
   - Validate: file type starts with `image/`, file size limit (e.g. 5–10MB).
   - Create a unique path:
     - `products/{productId}/{uuid}.{ext}` or `products/{uuid}.{ext}`

3. Upload to Storage:
   - `supabase.storage.from('product-images').upload(path, file, { upsert: true, contentType: file.type })`

4. Get URL:
   - Public bucket: `getPublicUrl(path)` and set `image_url` to that.
   - Private bucket: store the path in `image_url` (or a new column later) and generate signed URL in public page.

5. UX:
   - Show upload progress/spinner.
   - After upload, show a small preview.
   - Allow “Remove image” which clears `image_url`.

### Frontend plan (Public page)
In [src/app/page.tsx](src/app/page.tsx):
- If using public URLs: nothing changes.
- If using signed URLs: add a server-side step that converts stored paths -> signed URLs.

### Implementation order
1. Create bucket + policies.
2. Add upload UI and upload code in admin.
3. Store URL/path in `products.image_url`.
4. If private: add signed URL generation in server-side query.

---

## 2) Admin “Leaflet Layout Builder” (custom grid)

### Goal
Allow the admin to design the leaflet layout:
- Choose the grid dimensions (e.g. number of columns, row heights)
- Choose which products appear in each grid section/cell
- Save layouts and switch between them

### Data model (suggested)
Add two tables:

1) `leaflet_layouts`
- `id uuid`
- `name text`
- `columns int` (or store a JSON grid definition)
- `created_at`, `updated_at`
- `is_active boolean`

2) `leaflet_layout_items`
- `id uuid`
- `layout_id uuid` -> `leaflet_layouts.id`
- `product_id uuid` -> `products.id`
- `x int`, `y int`, `w int`, `h int` (grid position + size)
- `sort int` (optional)

### Admin UI plan
- A simple grid editor:
  - Click a cell/section -> choose a product from a dropdown/search list
  - Controls to set `w/h` (span) per item
  - Save layout

### Public page rendering plan
- Query the active layout + items.
- Render using CSS Grid:
  - `grid-template-columns` based on layout `columns`
  - Each item sets `grid-column` / `grid-row` spans based on `x/y/w/h`

### Notes
- Start minimal: **one active layout** at a time.
- RLS: same pattern as products/promotions (public read for active layout, admin writes).

