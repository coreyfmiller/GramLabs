# HikeMind — TODO

## 🚨 DO THIS FIRST (Manual Steps — Blocks Everything Below)

- [ ] Enable YouTube Data API v3: https://console.cloud.google.com/apis/library/youtube.googleapis.com
- [ ] Create/reuse API key with YouTube Data API access: https://console.cloud.google.com/apis/credentials
- [ ] Add `YOUTUBE_API_KEY=xxx` to `.env.local`
- [ ] Add `youtube_video_ids` column to `gear_items` table in Supabase (text array, nullable)
- [ ] Add GitHub Actions secrets: `YOUTUBE_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Push workflow to GitHub and verify it runs: `.github/workflows/youtube-reviews.yml`
- [ ] Test script locally: `node scripts/fetch-youtube-reviews.mjs --dry-run`

Once done: workflow auto-runs 1st-10th of each month, ~95 items/day. Full DB covered in 10 days.

---

## 🔥 Priority: Build Order

### Step 0 — YouTube API Setup (BLOCKING) ✅ Script & Workflow Built
- [x] Build video search script: `scripts/fetch-youtube-reviews.mjs`
- [x] Build GitHub Action for automated daily runs (1st-10th monthly)
- [ ] Complete manual setup steps above
- [ ] Then: Build Gear Compare with embedded fullscreen YouTube reviews

### ~~Step 1 — Complete the Gear Database~~ ✅ DONE
- [x] Sleeping pads: R-values filled (all pads have R-values)
- [x] Shelters: Seasons filled (0 missing)
- [x] Shelters: Capacity filled (0 missing)
- [x] Quilts/bags: temp_rating filled (0 missing)
- [x] Quilts/bags: fill_type + fill_power filled (983/1000 complete, remainder is synthetic with no fill_power)
- [x] Brand coverage verified (115+ brands tracked, only edge cases missing)

### Step 2 — Gear Compare (`/compare`)
- [ ] Select 2-3 items to compare (from search or Pack Lab)
- [ ] Side-by-side specs table (weight, price, R-value, temp rating, etc.)
- [ ] Weight diff, price diff, value-per-oz calculations
- [ ] "Winner" highlighting (lightest, best value, warmest)
- [ ] "Add to Pack" button on any item
- [ ] Shareable comparison URL
- [ ] Embedded YouTube review videos per item (fullscreen capable)
  - YouTube IFrame embed with fullscreen enabled
  - 2-3 videos per item from trusted channels
  - Prioritize: JupiterHikes, Darwin OnTheTrail, Clever Hiker, Dixie, Adventure Alan
- [ ] YouTube Data API v3 integration:
  - Enable on existing Google Cloud project
  - Add `youtube_video_ids` field to gear_items table (array of video IDs)
  - Monthly script: search `"{brand} {product name} review"`
  - Filter for relevant results (>1min, English, from known gear channels)
  - Flag items with no matches for manual review
  - Free tier: 10,000 units/day (100 searches/day) — enough for 1000 items over 10 days

### Step 3 — Gear Explorer (`/gear`)
- [ ] Browsable, filterable grid/table of all 1000+ items
- [ ] Search by name/brand
- [ ] Filter by category, tier, price range, weight range
- [ ] Sort by weight, price, warmth-to-weight, cost-per-oz-saved
- [ ] Item cards with key specs + "Add to Pack" button
- [ ] Click into item detail with full specs + embedded YouTube reviews (fullscreen)
- [ ] "Compare" button (select 2-3 and jump to compare view)
- [ ] External "Buy" link (when URL exists)
- [ ] SEO: individual item pages or rich metadata for search traffic

---

## Gear Database — Links & Monitoring
- [ ] URLs on all items (0/1012 currently) — use monthly AI link updater script when ready
- [ ] Monthly AI link updater script:
  - Search API (Serper) to find current product URLs
  - AI filters for actual product pages vs junk
  - Validate links return 200 + correct product
  - Auto-disable broken links in UI
  - Monthly report: updated/failed/needs-review
- [ ] Add affiliate links where applicable (REI, Amazon, brand sites)
- [ ] Admin dashboard showing link health (% working, recently broken)
- [ ] Clothing category — users enter their own for now; future: add rain shells, puffies, fleece, base layers as browsable items

## Pack Lab — Polish
- [ ] Priority matrix for cost (quadrant chart: cost vs weight savings per item/upgrade)
- [ ] Weight vs community average per category
- [ ] Category filter as horizontal scroll on mobile (currently wraps ugly)
- [ ] HikeMind AI Suggestions — contextual swap recommendations (marked FUTURE/PRO)

## Pack Lab — Import
- [ ] PackWizard import
- [ ] CSV/spreadsheet import (parser exists, needs UI)

## Trip Engine — Enhancements
- [ ] Calorie/food weight estimation per day
- [ ] Water carry calculator between sources
- [ ] Resupply planning for multi-day trips
- [ ] Daily pack weight curve (shows decrease as consumables are used)
- [ ] Risk flags ("12-mile dry stretch in 90°F — carry minimum 4L")
- [ ] Trail database with known waypoints/water sources

## Gear Intel (Future)
- [ ] Community gear ratings from real trail data
- [ ] "What are people carrying on [trail]?" aggregated data
- [ ] Trending gear (what's gaining/losing popularity)
- [ ] Browse/search community packs by trail, season, base weight

## System Analyzer (AI Layer)
- [ ] Gap detection ("no wind layer but exposed ridgeline on your route")
- [ ] Redundancy detection ("headlamp + lantern — headlamp covers both")
- [ ] Combined warmth modeling (quilt + pad R-value + clothing + shelter)
- [ ] Weight budget advisor ("to hit sub-10lb, swap these 3 items")
- [ ] Season transition recommendations
- [ ] Safety audit (missing essentials flagged)

## Homepage / Marketing
- [ ] AI-generated hero videos — improve quality (try Kling 3.0)
- [ ] Below-the-fold sections: feature showcase, testimonials, pricing
- [ ] Mobile nav menu (hamburger currently does nothing)
- [ ] Pricing page (Free / Pro $8/mo / Annual $60/yr)

## Tech Debt
- [ ] Add user auth (Clerk or NextAuth)
- [ ] Move pack data to database (Supabase or PlanetScale)
- [ ] Server-side API for share links (more reliable than URL encoding)
- [ ] SEO metadata per page
- [ ] Accessibility audit (keyboard nav, screen reader support)
- [ ] Performance: lazy load gear database, virtualize long lists
- [ ] Set up Gemini health check alerts:
  - Add `GEMINI_API_KEY` to GitHub Actions secrets
  - Create a Discord/Slack webhook for alerts
  - Add `ALERT_WEBHOOK` to GitHub Actions secrets
  - Script + workflow already created (`scripts/check-gemini.mjs`, `.github/workflows/gemini-health.yml`)
