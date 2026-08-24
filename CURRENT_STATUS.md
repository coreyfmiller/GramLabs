# HikeMind (Ridgeline) — Current Status

**Last updated:** August 19, 2026

---

## What's Built & Working

### Core Pages
- **Homepage** — Hero video, marketing copy, nav
- **Pack Lab** (`/pack-lab`) — Multi-loadout gear list builder with categories, subcategory pill filters, custom item entry, share URLs, LighterPack import, buy list
- **Gear Compare** (`/compare`) — Search items, side-by-side specs table, winner detection (trophy icons), weight/price diffs, cost-per-oz-saved, "Add to Pack" buttons, shareable URL (query param)
- **Gear Detail** (`/gear/[id]`) — Full specs display, YouTube video embeds (fullscreen), tier badges
- **Build My Kit** (`/build`) — Wizard → AI-generated optimized kit by budget/trip/climate (Gemini)
- **AI Chat** (`/chat`) — Gear advisor constrained to real database items (Gemini)
- **Trip Engine** (`/trip`) — Location + weather forecast → AI pack-readiness scoring (labeled PRO)
- **Brands Admin** (`/brands`) — Coverage audit dashboard, search, category breakdown, missing brand detection

### Data & Backend
- **1000+ item gear database** in Supabase (full specs, subcategories, 115+ brands)
- **Supabase integration** — All search/filter goes through DB, not client-side
- **Full-text search** (Supabase `fts` column) working
- **YouTube video IDs** — Column exists, 92 items populated, 731 remaining
- **YouTube fetch script** (`scripts/fetch-youtube-reviews.mjs`) — Built, tested, works
- **GitHub Action** (`.github/workflows/youtube-reviews.yml`) — Built, runs 1st-10th monthly
- **Gemini health check** script + workflow built

### Pack Lab Features
- Category + subcategory filtering (pill UI)
- Custom item entry (any gear with name, weight, price, category)
- Multiple loadouts
- Share URL encoding (base64 JSON)
- Worn/packed/consumable status
- Star/priority items

### Compare Page Features
- Item search (Supabase-backed, debounced)
- Category locking (can only compare within same category)
- Category-specific spec definitions (shelter, sleep, pack, kitchen, electronics, accessories)
- Winner detection with trophy icons
- Diff badges: weight, price, cost-per-oz-saved
- Shareable URL (`?items=id1,id2`)
- URL hydration on load (shareable links work)
- "Add to Pack" integration

---

## What Does NOT Exist Yet

| Feature | Status | Notes |
|---------|--------|-------|
| SEO on gear detail pages | ✅ DONE | Server-rendered, generateMetadata, JSON-LD Product, OG tags, canonical URLs. |
| Sitemap | ✅ DONE | /sitemap.xml lists all static pages + 1000+ gear item URLs. |
| Internal linking (similar items) | ✅ DONE | "Compare with similar" section on every gear detail page. |
| User auth | NOT BUILT | No accounts. All data in localStorage. |
| Cloud-saved packs | NOT BUILT | Packs live in Zustand → localStorage only. |
| Community data pipeline | NOT BUILT | No Reddit scraping, no LighterPack parsing. |
| Affiliate/buy links on items | NOT BUILT | 0/1012 items have URLs. |
| Compare SEO slugs | NOT BUILT | Uses `?items=` query params, not `/compare/item-vs-item` slugs. |
| YouTube on Compare page | NOT BUILT | Videos display on `/gear/[id]` only, not on Compare. |
| Pricing/monetization | NOT BUILT | No Stripe, no Pro tier enforcement. |
| Mobile nav | BROKEN | Hamburger does nothing. |

**Conscious decisions (will NOT build):**
- No `/gear` browse/index page — discovery through SEO + Compare search + Pack Lab. Detail pages are the product.
- No Stripe until 100+ authenticated users.

---

## YouTube Video Pipeline Status

| Metric | Count |
|--------|-------|
| Items with videos | 179+ (actively growing) |
| Items without videos (searchable) | ~730 |
| Items skipped (food/hygiene/generic) | ~177 |
| API key | ✅ Configured in `.env.local` |
| GitHub Action | ✅ Built, needs secrets added to repo |
| Script | ✅ Running — 95 items per run, ~8 more runs to full coverage |

**To fill remaining items:** Run `node scripts/fetch-youtube-reviews.mjs` once daily. Full coverage in ~8 days.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + PostCSS
- **State:** Zustand (localStorage persistence)
- **AI:** Gemini (chat, build-kit, trip analysis)
- **Deployment:** Vercel
- **Search:** Supabase full-text search (`fts` column)

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/compare/page.tsx` | Gear comparison tool |
| `src/app/gear/[id]/page.tsx` | Individual gear detail + YouTube |
| `src/app/pack-lab/page.tsx` | Pack builder |
| `src/app/build/page.tsx` | AI kit builder wizard |
| `src/app/chat/page.tsx` | AI gear advisor |
| `src/app/trip/page.tsx` | Trip weather/pack analyzer |
| `src/lib/gear-api.ts` | Supabase query layer (search, counts, getByIds) |
| `src/store/pack-store.ts` | Zustand pack state |
| `scripts/fetch-youtube-reviews.mjs` | YouTube video ID populator |
| `.github/workflows/youtube-reviews.yml` | Monthly auto-fetch action |
