# HikeMind — Product Roadmap

**Last updated:** August 19, 2026  
**Goal:** Build the best ultralight gear intelligence platform. Beat LighterPack, AllTrails, REI content, and every gear blog.

---

## Current State (as of Aug 19)

**BUILT:**
- 1000+ item gear database in Supabase (full specs, subcategories, 115+ brands)
- Pack Lab: multi-loadout builder with weight tracking, share URLs, LighterPack import, buy list
- Gear Compare: side-by-side specs, winner detection, diffs, cost-per-oz, shareable URLs
- Gear Detail pages with YouTube video embeds (92 items have videos, 731 remaining)
- AI Gear Advisor chat (Gemini) constrained to real database items
- Build My Kit: wizard → AI-generated optimized kit by budget/trip/climate
- Trip Engine: location + weather forecast → AI pack-readiness scoring
- Brands admin: coverage audit dashboard
- YouTube fetch script + GitHub Action (automated monthly pipeline)

**NOT BUILT:**
- No `/gear` browsable index (biggest gap — 1000 items with no discovery path)
- No user auth, no cloud-saved packs (localStorage only = zero retention)
- No SEO pages (0 organic traffic, 0 indexed gear pages)
- No community data (no moat, no network effects)
- No monetization (no Stripe, no Pro tier)

---

## What's Missing (Why We Lose Today)

1. **No discovery** — 1000+ items exist but users can't browse/filter them. Only way to find items is through Compare search or Pack Lab.
2. **No persistence** — user clears browser, data gone, user gone forever.
3. **No discoverability** — zero SEO pages, zero organic traffic from Google.
4. **No moat** — no community data, no network effects, nothing defensible.
5. **No social proof** — no public packs, no community stats, no "people like you carry X."

---

## The 30-Day Sprint (Starting Aug 19)

### Week 1: SEO-Ready Gear Pages + Video Population (The Traffic Engine)

**Why first:** You have 1000+ gear detail pages that Google can't see — they're client-rendered, have no meta tags, no structured data, no sitemap. Fix this and you have 1000 landing pages working for you 24/7. Meanwhile, run the video script daily to fill YouTube coverage.

**Decision:** No separate `/gear` browse/index page. Discovery comes through Google (SEO), Compare search, and Pack Lab search. The detail pages with full specs + YouTube reviews ARE the product. Building a browse grid adds complexity without clear user demand.

- [ ] Convert `/gear/[id]` from client component to server component (SSR for crawlers)
- [ ] Add `<title>`, `<meta description>`, Open Graph tags per item
- [ ] JSON-LD Product structured data per item
- [ ] Generate `/sitemap.xml` covering all gear items
- [ ] "Best [category] for ultralight" collection pages (e.g., `/gear/best-quilts`)
- [ ] Internal linking: "Compare with similar items" cross-links on each page
- [ ] Submit sitemap to Google Search Console
- [ ] Run `fetch-youtube-reviews.mjs` daily (~95 items/run × 8 days = full coverage)
- [ ] Add GitHub repo secrets so the Action auto-runs monthly

**Success criteria:** Google indexes 500+ gear pages within 4 weeks. First organic impressions appear. YouTube videos on 800+ items.

---

### Week 2: Auth + Cloud Packs (Retention)

**Why third:** Once you have traffic from SEO/Explorer, give people a reason to stay. Nobody keeps a product that loses their data.

- [ ] Add Supabase Auth (email + Google OAuth)
- [ ] Create `users` + `user_packs` tables
- [ ] Auth UI: sign in/up modal, user avatar in nav
- [ ] Auto-sync Zustand pack store to Supabase when authenticated
- [ ] Migrate existing localStorage packs on first sign-in
- [ ] Protect admin routes (check user role)
- [ ] Free tier: 3 loadouts. Pro: unlimited (track now, enforce later)

**Success criteria:** User signs in, creates a pack, closes browser, comes back a week later, pack is there.

---

### Week 3: Community Data Pipeline v1 (The Moat)

**Why fourth:** This is what makes HikeMind defensible. Nobody else aggregates this data.

- [ ] Reddit scraper v1: pull shakedown posts from r/Ultralight
  - Extract gear item mentions (brand + product name)
  - Match against DB items
  - Store in `community_mentions` table
- [ ] LighterPack bulk parser: scrape public pack lists
  - Extract items, weights, categories
  - Store in `community_packs` table
  - Calculate: community averages per category, most common items
- [ ] Surface community stats on gear pages:
  - "Used by X% of PCT thru-hikers"
  - "Average community rating: 8.4/10"
- [ ] Surface stats in Pack Lab:
  - "Your shelter is heavier than 73% of community packs"
  - Category weight vs community average bars
- [ ] Admin dashboard: pipeline health, match rate, data freshness

**Success criteria:** Every gear page shows at least one community data point. Pack Lab shows "vs community" comparisons.

---

## After the Sprint (Month 2+)

### Compare Page Polish
- YouTube video embeds inline on Compare page
- SEO slugs: `/compare/nemo-tensor-vs-thermarest-neoair`
- Open Graph meta tags for rich Reddit/Discord previews

### Social & Community Features
- Public pack profiles (user's loadouts visible at `/u/[username]`)
- "Packs for [trail]" browseable collections
- Upvote/review gear from personal experience
- "Packs like mine" similarity matching

### AI Intelligence Layer (Pro Features)
- Gap detection: "no wind layer but exposed ridgeline on your route"
- Redundancy detection: "headlamp + lantern — headlamp covers both"
- Combined warmth modeling: quilt + pad R-value + clothing + shelter
- Weight budget advisor: "to hit sub-10lb, swap these 3 items"
- Safety audit: missing essentials flagged

### Monetization
- Pricing page: Free / Pro $8/mo / Annual $60/yr
- Stripe integration
- Pro features: unlimited loadouts, AI suggestions, trip engine, priority compare
- Affiliate links on gear pages (REI, Amazon, brand sites)
- Monthly AI link updater script (Serper → validate → insert)

### Pack Lab Polish
- Priority matrix: cost vs weight savings quadrant chart
- PackWizard import
- CSV import UI

### Trip Engine Enhancements
- Calorie/food weight estimation
- Water carry calculator
- Resupply planning
- Trail database with waypoints/water sources

---

## Competitive Positioning

| Competitor | What they have | What we beat them on |
|-----------|---------------|---------------------|
| LighterPack | Entrenched, free, simple | We have AI, community intelligence, gear database with specs, trip weather integration, compare tool |
| AllTrails | Massive user base, trail maps | We own the gear layer — they don't touch gear intelligence at all |
| REI / Outdoor Gear Lab | Trust, content, reviews | We aggregate ALL community data, not one reviewer's opinion. Real hiker consensus. |
| Gear blogs | SEO traffic, affiliate revenue | We're interactive — compare, build, analyze. Not just read. |
| PackWizard | Pack building | We have AI recommendations, community data, trip integration, compare tool |

**Our moat (once built):** Aggregated community gear intelligence from thousands of real hikers. Nobody else connects community consensus + real specs + AI reasoning + trip conditions in one place.

---

## Metrics to Track

- **Week 1:** Gear Explorer page load time, items browsed per session, YouTube coverage %
- **Week 2:** Google impressions, indexed pages, organic clicks, bounce rate on gear pages
- **Week 3:** Auth signups, packs saved to cloud, return rate (came back after 48hrs)
- **Week 4:** Community data points per item, "vs community" engagement, pipeline uptime

---

## Non-Goals (Don't Do These Yet)

- Don't add more gear items beyond 1000+ (depth > breadth)
- Don't build a mobile app (web-first, PWA later)
- Don't integrate with AllTrails or Strava (no API value yet)
- Don't build a forum or social feed (Reddit exists, don't compete with it)
- Don't spend on ads (organic + Reddit sharing first)
- Don't over-polish the homepage (ship features, not marketing pages)
- Don't add Stripe until there are 100+ authenticated users
