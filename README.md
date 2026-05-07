# MiniLeaf

MiniLeaf is a lightweight deals “leaflet” (PWA) for a single mini market.

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

MiniLeaf can load real deals from Supabase if you configure:

1) Create a Supabase project
2) Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor
3) Copy `.env.example` to `.env.local` and set:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

If env vars are missing, the home page falls back to demo data.

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

