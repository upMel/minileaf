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

