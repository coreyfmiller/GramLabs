# HikeMind — Product Roadmap

**Created:** August 18, 2026  
**Goal:** Build the best ultralight gear intelligence platform. Beat LighterPack, AllTrails, REI content, and every gear blog.

---

## Current State

- 1000+ item gear database in Supabase (full specs, subcategories, 115+ brands)
- Pack Lab: multi-loadout builder with weight tracking, share URLs, LighterPack import, buy list
- AI Gear Advisor chat (Gemini) constrained to real database items
- Build My Kit: wizard → AI-generated optimized kit by budget/trip/climate
- Trip Engine: location + weather forecast → AI pack-readiness scoring (labeled PRO)
- Brands admin: coverage audit dashboard
- Admin TODO: interactive backlog viewer
- No auth, no user accounts, packs are localStorage only
- No SEO pages, no organic traffic strategy
- No community data, no network effects

---

## What's Missing (Why We Lose Today)

1. **No persistence** — user clears browser, data gone, user gone forever
2. **No moat** — no community data, no network effects, nothing defensible
3. **No discoverability** — zero SEO pages, zero organic traffic
4. **No social proof** — no public packs, no community stats, no "people like you carry X"
5. **No compare tool** — the most shareable/linkable feature doesn't exist yet

---

## The 30-Day Sprint

### Week 1: Auth + Cloud Packs (Foundation)

**Why first:** Nothing else matters without user retention. localStorage is a toy.

- [ ] Add Supabase Auth (email + Google OAuth)
- [ ] Create `users` table + `user_packs` table in Supabase
- [ ] Auth UI: sign in/up modal, user avatar in nav
- [ ] Auto-sync Zustand pack store to DB when authenticated
- [ ] Migrate existing localStorage packs on first sign-in
- [ ] Protect admin routes (check user role)
- [ ] Free tier: 3 loadouts. Pro: unlimited (enforce later, track now)

**Success criteria:** User signs in, creates a pack, closes browser, comes back a week later, pack is there.

---

### Week 2: Gear Compare (The Viral Page)

**Why second:** This is the page that gets shared on Reddit and ranks on Google. "Nemo Tensor vs Thermarest NeoAir" is a query people search.

- [ ] Complete YouTube API manual setup (15 min, blocks video embeds):
  - Enable YouTube Data API v3 on Google Cloud
  - Create API key, add to `.env.local`
  - Add `youtube_video_ids` column to `gear_items` table
  - Run `fetch-youtube-reviews.mjs` to populate
- [ ] Build `/compare` route
- [ ] Item selector: pick 2-3 items from search (autocomplete from Supabase)
- [ ] Side-by-side specs table (weight, price, R-value, temp rating, capacity, etc.)
- [ ] Calculated diffs: weight diff, price diff, value-per-oz, warmth-per-oz
- [ ] "Winner" badges per metric (lightest, cheapest, best value, warmest)
- [ ] YouTube review embeds per item (fullscreen capable)
- [ ] "Add to Pack" CTA on each item
- [ ] Shareable URL: `/compare/nemo-tensor-vs-thermarest-neoair` (SEO slugs)
- [ ] Open Graph meta tags for social sharing

**Success criteria:** Share a compare link on r/Ultralight, it renders a rich preview, people click through and actually use it.

---

### Week 3: Gear Explorer + SEO Item Pages (Traffic Engine)

**Why third:** 1000+ items = 1000+ potential Google landing pages. This is how you grow without ad spend.

- [ ] Build `/gear` index page: browsable grid/table of all items
- [ ] Search by name/brand (full-text, debounced)
- [ ] Filter by: category, subcategory, tier, price range, weight range
- [ ] Sort by: weight, price, warmth-to-weight, value-per-oz
- [ ] Item cards with key specs + "Add to Pack" + "Compare" buttons
- [ ] SEO item pages at `/gear/[slug]`:
  - Full specs display
  - YouTube review embeds
  - "Compare with similar items" suggestions
  - JSON-LD Product structured data
  - Proper `<title>`, `<meta description>`, Open Graph tags
- [ ] "Best [category] for ultralight" collection pages (e.g., `/gear/best-quilts`)
- [ ] Internal linking: related items, "people also compared" cross-links
- [ ] Sitemap generation for all gear pages

**Success criteria:** Google indexes 500+ gear pages within 4 weeks. First organic impressions appear in Search Console.

---

### Week 4: Community Data Pipeline v1 (The Moat)

**Why fourth:** This is what makes HikeMind defensible. Nobody else has this data aggregated and queryable.

- [ ] Reddit scraper v1: pull shakedown posts from r/Ultralight
  - Extract gear item mentions (brand + product name)
  - Extract weights, prices, sentiment
  - Store in `community_mentions` table
- [ ] LighterPack bulk parser: scrape public pack lists
  - Extract items, weights, categories
  - Store in `community_packs` table
  - Calculate: community averages per category, most common items, base weight distribution
- [ ] Surface community stats on gear pages:
  - "Used by X% of PCT thru-hikers"
  - "Average community rating: 8.4/10"
  - "Community average base weight: 9.2 lbs"
- [ ] Surface stats in Pack Lab:
  - "Your shelter is heavier than 73% of community packs"
  - Category weight vs community average bars
- [ ] Admin dashboard: pipeline health, items matched vs unmatched, data freshness

**Success criteria:** Every gear page shows at least one community data point. Pack Lab shows "vs community" comparisons.

---

## After the Sprint (Month 2+)

### Social & Community Features
- [ ] Public pack profiles (user's loadouts visible at `/u/[username]`)
- [ ] "Packs for [trail]" browseable collections
- [ ] Upvote/review gear from personal experience
- [ ] "Packs like mine" similarity matching
- [ ] Follow other hikers, see their gear changes

### AI Intelligence Layer
- [ ] Gap detection: "no wind layer but exposed ridgeline on your route"
- [ ] Redundancy detection: "headlamp + lantern — headlamp covers both"
- [ ] Combined warmth modeling: quilt + pad R-value + clothing + shelter
- [ ] Weight budget advisor: "to hit sub-10lb, swap these 3 items"
- [ ] Season transition recommendations
- [ ] Safety audit: missing essentials flagged

### Monetization
- [ ] Pricing page: Free / Pro $8/mo / Annual $60/yr
- [ ] Pro features: unlimited loadouts, AI suggestions, trip engine, priority compare
- [ ] Affiliate links on gear pages (REI, Amazon, brand sites)
- [ ] Monthly AI link updater script (Serper → validate → insert)
- [ ] Stripe integration for payments

### Pack Lab Polish
- [ ] Priority matrix: cost vs weight savings quadrant chart
- [ ] PackWizard import
- [ ] CSV import UI (parser exists)
- [ ] Category horizontal scroll on mobile

### Trip Engine Enhancements
- [ ] Calorie/food weight estimation per day
- [ ] Water carry calculator between sources
- [ ] Resupply planning for multi-day trips
- [ ] Daily pack weight curve (consumables decrease)
- [ ] Risk flags: "12-mile dry stretch in 90°F — carry minimum 4L"
- [ ] Trail database with known waypoints/water sources

### Tech Debt
- [ ] Server-side API for share links (more reliable than URL encoding)
- [ ] Performance: lazy load gear data, virtualize long lists
- [ ] Accessibility audit (keyboard nav, screen reader)
- [ ] Gemini health check alerts (webhook + GitHub Action already built)
- [ ] Error boundaries and graceful fallbacks

---

## Competitive Positioning

| Competitor | What they have | What we beat them on |
|-----------|---------------|---------------------|
| LighterPack | Entrenched, free, simple | We have AI, community intelligence, gear database with specs, trip weather integration |
| AllTrails | Massive user base, trail maps | We own the gear layer — they don't touch gear intelligence at all |
| REI / Outdoor Gear Lab | Trust, content, reviews | We aggregate ALL community data, not one reviewer's opinion. Real hiker consensus. |
| Gear blogs | SEO traffic, affiliate revenue | We're interactive — compare, build, analyze. Not just read. |
| PackWizard | Pack building | We have AI recommendations, community data, trip integration, compare tool |

**Our moat (once built):** Aggregated community gear intelligence from thousands of real hikers. Nobody else connects community consensus + real specs + AI reasoning + trip conditions in one place.

---

## Metrics to Track

- **Week 1:** Auth signups, packs saved to cloud, return rate (came back after 48hrs)
- **Week 2:** Compare pages created, shares to Reddit/social, time on compare page
- **Week 3:** Google impressions, indexed pages, organic clicks, bounce rate on gear pages
- **Week 4:** Community data points per item, "vs community" engagement, pipeline uptime

---

## Non-Goals (Don't Do These Yet)

- Don't add more gear items beyond 1000+ (depth > breadth)
- Don't build a mobile app (web-first, PWA later)
- Don't integrate with AllTrails or Strava (no API value yet)
- Don't build a forum or social feed (Reddit exists, don't compete with it)
- Don't spend on ads (organic + Reddit sharing first)
- Don't over-polish the homepage (ship features, not marketing pages)
