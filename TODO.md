# HikeMind — TODO

**Last updated:** August 19, 2026

---

## ✅ COMPLETED

### Gear Database ✅
- [x] 1000+ items in Supabase with full specs
- [x] Subcategory tagging (967+ items)
- [x] Sleeping pads: R-values filled
- [x] Shelters: seasons + capacity filled
- [x] Quilts/bags: temp_rating + fill_type + fill_power filled
- [x] Brand coverage verified (115+ brands)
- [x] Full-text search (`fts` column) working

### YouTube Pipeline ✅
- [x] Build video search script: `scripts/fetch-youtube-reviews.mjs`
- [x] Build GitHub Action for automated daily runs (1st-10th monthly)
- [x] Add `youtube_video_ids` column to Supabase `gear_items` table
- [x] Add `YOUTUBE_API_KEY` to `.env.local`
- [x] 92 items already have video IDs populated
- [x] Gear detail page (`/gear/[id]`) renders YouTube embeds with fullscreen

### Gear Compare (`/compare`) ✅
- [x] Select 2-3 items to compare (from search)
- [x] Category-locked comparisons
- [x] Side-by-side specs table (weight, price, R-value, temp rating, etc.)
- [x] Category-specific spec definitions (shelter, sleep, pack, kitchen, electronics, accessories)
- [x] Winner detection with trophy icons (lightest, cheapest, best value)
- [x] Weight diff, price diff, value-per-oz calculations
- [x] "Add to Pack" button on each item
- [x] Shareable comparison URL (query params)
- [x] URL hydration on page load

### Pack Lab ✅
- [x] Multi-loadout gear list builder
- [x] Category + subcategory pill filters
- [x] Custom item entry (any gear)
- [x] Worn/packed/consumable status
- [x] Share URL encoding
- [x] Star/priority items
- [x] LighterPack import

### Other Pages ✅
- [x] Build My Kit wizard (AI-generated kits by budget/trip/climate)
- [x] AI Chat (Gemini, constrained to real DB items)
- [x] Trip Engine (location + weather → pack readiness scoring)
- [x] Brands Admin (coverage audit dashboard)
- [x] Gear Detail pages (`/gear/[id]`) with specs + YouTube

---

## 🔥 NEXT UP — Build Order

### Step 1 — Populate YouTube Videos (manual, 15 min/day for ~8 days)

731 searchable items still need video IDs. No code to write — just run the script:

```bash
node scripts/fetch-youtube-reviews.mjs
```

Run once per day (95 items/run). All items covered in ~8 days.

**Also needed:** Add GitHub repo secrets so the Action runs automatically:
- `YOUTUBE_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Step 2 — SEO-Ready Gear Pages ✅ DONE (Aug 19, 2026)

- [x] Convert `/gear/[id]` to server component (SSR — dynamic render)
- [x] `generateMetadata` with title, description, OG tags, canonical URL per item
- [x] JSON-LD Product structured data (brand, price, weight, category specs, rating)
- [x] `/sitemap.xml` generated from Supabase (all static pages + 1000+ gear URLs)
- [x] "Compare with similar" internal linking section on every gear detail page
- [x] Build passes clean (`tsc --noEmit` + `next build`)

Still TODO:
- [ ] "Best [category] for ultralight" collection pages (e.g., `/gear/best-quilts`)
- [ ] Submit sitemap to Google Search Console

---

### Step 3 — Auth + Cloud Packs (user retention)

- [ ] Add Supabase Auth (email + Google OAuth)
- [ ] Create `users` table + `user_packs` table
- [ ] Auth UI: sign in/up modal, user avatar in nav
- [ ] Auto-sync Zustand pack store to DB when authenticated
- [ ] Migrate existing localStorage packs on first sign-in
- [ ] Protect admin routes (check user role)
- [ ] Free tier: 3 loadouts. Pro: unlimited (track now, enforce later)

---

### Step 4 — Community Data Pipeline (the moat)

- [ ] Reddit scraper v1: pull shakedown posts from r/Ultralight
- [ ] Extract gear item mentions (brand + product name matching)
- [ ] LighterPack bulk parser: scrape public pack lists
- [ ] Store in `community_mentions` / `community_packs` tables
- [ ] Surface on gear pages: "Used by X% of PCT thru-hikers"
- [ ] Surface in Pack Lab: "Your shelter is heavier than 73% of community packs"
- [ ] Admin dashboard: pipeline health, match rate, data freshness

---

## 📋 POLISH & ENHANCEMENTS (after Steps 1-5)

### Compare Page Polish
- [ ] Add YouTube video embeds to Compare page (inline per item)
- [ ] SEO slugs: `/compare/nemo-tensor-vs-thermarest-neoair` instead of query params
- [ ] Open Graph meta tags for social sharing (rich previews on Reddit/Discord)

### Pack Lab Polish
- [ ] Priority matrix: cost vs weight savings quadrant chart
- [ ] Weight vs community average per category (needs Step 5 data)
- [ ] Category filter horizontal scroll on mobile (currently wraps ugly)
- [ ] PackWizard import
- [ ] CSV import UI (parser exists, needs UI)

### Trip Engine Enhancements
- [ ] Calorie/food weight estimation per day
- [ ] Water carry calculator between sources
- [ ] Resupply planning for multi-day trips
- [ ] Daily pack weight curve (consumables decrease over time)
- [ ] Risk flags ("12-mile dry stretch in 90°F — carry minimum 4L")
- [ ] Trail database with known waypoints/water sources

### Gear Database Maintenance
- [ ] URLs on all items (0/1012 currently)
- [ ] Monthly AI link updater script (Serper → validate → insert)
- [ ] Affiliate links where applicable (REI, Amazon, brand sites)
- [ ] Admin dashboard showing link health
- [ ] Add clothing items as browsable (rain shells, puffies, fleece, base layers)

### Homepage / Marketing
- [ ] Fix mobile nav (hamburger does nothing)
- [ ] Below-the-fold sections: feature showcase
- [ ] Pricing page (Free / Pro $8/mo / Annual $60/yr)

---

## 💰 MONETIZATION (after auth + community data)

- [ ] Stripe integration
- [ ] Pro features: unlimited loadouts, AI suggestions, trip engine, priority compare
- [ ] Affiliate links on gear pages (passive revenue)
- [ ] Monthly AI link updater script for affiliate URLs

---

## 🧠 AI INTELLIGENCE LAYER (future Pro features)

- [ ] Gap detection ("no wind layer but exposed ridgeline on your route")
- [ ] Redundancy detection ("headlamp + lantern — headlamp covers both")
- [ ] Combined warmth modeling (quilt + pad R-value + clothing + shelter)
- [ ] Weight budget advisor ("to hit sub-10lb, swap these 3 items")
- [ ] Season transition recommendations
- [ ] Safety audit (missing essentials flagged)

---

## 🔧 TECH DEBT

- [ ] Convert `/gear/[id]` from client component to server component (SEO)
- [ ] Server-side API for share links (more reliable than URL encoding)
- [ ] Performance: virtualize long lists in Gear Explorer
- [ ] Accessibility audit (keyboard nav, screen reader support)
- [ ] Error boundaries and graceful fallbacks
- [ ] Set up Gemini health check alerts (Discord/Slack webhook)
