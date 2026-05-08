# MiniLeaf — Notes / Future Plan

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

