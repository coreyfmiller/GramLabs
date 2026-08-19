# HikeMind (Ridgeline) — Current Status

**Last updated:** August 18, 2026

---

## What's Built

- **Next.js app** with routes: homepage, `/gear`, `/pack-lab`, `/trip`, `/chat`, `/brands`, `/build`
- **1000+ item gear database** seeded in Supabase (tools, knives, shelters, packs, quilts, pads, shoes, etc.)
- **Supabase integration** — GearSearch fetches from DB instead of shipping 359KB client-side
- **Pack Lab** — gear list builder with categories, subcategory pill filters, custom item entry
- **Subcategory tagging** — 967+ items auto-tagged with subcategories
- **Custom Item form** — users can add any gear (clothing, shoes, etc.) with name, weight, price, category

## Last Commits

1. Add 15 ultralight tools/knives (Derma-Safe, Opinel, Benchmade Bugout, etc.)
2. Supabase integration: GearSearch now fetches from database
3. Replace Clothing button with Custom Item form
4. Subcategory filters merged to main (pills UI + constants + auto-tagging)

---

## What's Next

### Step 0 — YouTube API Setup (BLOCKING for Gear Compare)

1. Enable YouTube Data API v3 on Google Cloud project
2. Create/reuse API key with YouTube Data API access
3. Add `YOUTUBE_API_KEY=xxx` to `.env.local`
4. Add `youtube_video_ids` column to `gear_items` table in Supabase (text array)
5. Build video search script: populate top 2-3 review video IDs per item
6. Then: Build Gear Compare with embedded fullscreen YouTube reviews

### Step 2 — Gear Compare (`/compare`)

- Select 2-3 items to compare (from search or Pack Lab)
- Side-by-side specs table (weight, price, R-value, temp rating, etc.)
- Weight diff, price diff, value-per-oz calculations
- "Winner" highlighting (lightest, best value, warmest)
- "Add to Pack" button on any item
- Shareable comparison URL
- Embedded YouTube review videos per item (fullscreen capable)

### Step 3 — Gear Explorer Polish (`/gear`)

- Browsable, filterable grid/table of all 1000+ items
- Search by name/brand, filter by category/tier/price/weight
- Sort by weight, price, warmth-to-weight, cost-per-oz-saved
- Item detail pages with full specs + YouTube reviews
- "Compare" button, "Buy" links, SEO metadata

### After That

- Pack Lab polish (priority matrix, community weight averages)
- Trip Engine enhancements (calorie estimation, water carry, resupply planning)
- User auth + DB-backed pack storage
- Homepage/marketing improvements
- Data pipeline (Reddit, LighterPack, surveys — see DATA_STRATEGY.md)

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + PostCSS
- **State:** Zustand (local store)
- **AI:** Gemini (chat/suggestions)
- **Deployment:** Vercel

---

## Key Files

- `TODO.md` — Full feature backlog
- `DATA_STRATEGY.md` — Data pipeline architecture and sources
- `src/app/` — App routes
- `src/data/` — Local data files
- `src/lib/` — Supabase client, utilities
- `src/store/` — Zustand stores
- `scripts/` — Utility scripts (Gemini health check, etc.)
