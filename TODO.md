# HikeMind — TODO

**Last updated:** August 23, 2026

---

## 🚨 PRIORITY 1 — Manual Actions (Do NOW)

### Set Gemini Daily Spend Cap
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project → **Billing** → **Budgets & Alerts**
3. Create a budget:
   - Amount: **$15/day** ($450/month)
   - Alert thresholds: **50%, 80%, 100%**
   - Alert goes to your email
4. This is your emergency circuit breaker — even if code-level rate limiting fails, Google cuts API access at this cap

### Run Security SQL Migration
1. Open Supabase Dashboard → SQL Editor
2. Paste and run the contents of `scripts/security-schema.sql`
3. This creates:
   - `usage_tracking` table (tracks daily AI usage per user)
   - `increment_usage()` RPC function (atomic counter)
   - RLS policies on usage_tracking
   - `plan` column on profiles table ('free' | 'pro')
4. **Without this, rate limiting will error** — the code calls `increment_usage` and queries `usage_tracking`

### Fix Google OAuth Redirect
1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click your HIKING OAuth client
3. Under **Authorised JavaScript origins**, add:
   - `http://localhost:3000`
   - `https://kkncobvfavgyibisdevc.supabase.co`
   - Your Vercel production URL (e.g., `https://your-app.vercel.app`)
4. Under **Authorised redirect URIs**, confirm:
   - `https://kkncobvfavgyibisdevc.supabase.co/auth/v1/callback`
5. Save and wait 5 minutes for propagation

### Test Auth Flow End-to-End (After OAuth Fix)
1. Go to your Vercel production URL
2. Click login → "Continue with Google"
3. Complete Google consent → should redirect to /closet
4. If error: check browser console + Supabase Auth logs in dashboard
5. Once in /closet: add a gear item from search
6. Open Pack Lab → verify gear shows up
7. Open AI Advisor → send a message → confirm response (not rate limit error)
8. **If login page shows after callback:** the `exchangeCodeForSession` failed — check Supabase dashboard → Authentication → Logs

### Submit Sitemap to Google Search Console
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property for your Vercel URL
3. Submit: `https://your-domain.com/sitemap.xml`

---

## 🚨 PRIORITY 2 — Business Model Implementation

### Pricing Tiers (DECIDED)

| | First 1,000 Users (Early Adopters) | Users 1,001+ (General) | Pro ($5/month) |
|---|---|---|---|
| Pack Lab | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| Compare | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| My Gear / Closet | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| Import | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| AI Advisor | ✅ 20 msg/day | ❌ 5 msg/day | ✅ Unlimited |
| Build My Kit | ✅ 5/day | ❌ 1/day | ✅ Unlimited |
| Trip Engine AI | ✅ 10/day | ❌ 3/day | ✅ Unlimited |
| Pack Audit | ✅ 10/day | ❌ 2/day | ✅ Unlimited |

**Revenue model:** Free platform. Affiliate links on gear recommendations (primary). Pro tier for power users (secondary). Donations accepted.

### Stripe Integration
- [ ] Install Stripe SDK
- [ ] Create Pro product + $5/month price in Stripe dashboard
- [ ] Build `/api/stripe/checkout` route (creates checkout session)
- [ ] Build `/api/stripe/webhook` route (updates profile.plan on payment)
- [ ] Add "Upgrade to Pro" UI when user hits daily limit
- [ ] Add "Donate" button (Stripe payment link, no subscription)
- [ ] Handle cancellation (webhook downgrades plan to 'free')

### Affiliate Link Infrastructure
- [ ] Add `affiliate_url` column to `gear_items` table
- [ ] Sign up for REI Affiliate Program
- [ ] Sign up for Amazon Associates
- [ ] Sign up for Avantlink (outdoor niche network)
- [ ] Build script to populate affiliate URLs for top brands
- [ ] Add "Check Price" / "Buy" buttons on gear cards, compare results, AI recommendations
- [ ] Add FTC disclosure in footer: "We earn a commission on purchases made through our links"

### Early Adopter Tracking
- [ ] Add `user_number` serial column to profiles (auto-increments on signup)
- [ ] First 1,000 get `tier: 'early-adopter'` — permanently higher limits
- [ ] Badge on their profile: "Early Adopter #247"

---

## 🚨 PRIORITY 3 — Abuse Detection (Before Marketing)

- [ ] Detect repeated identical prompts (bot pattern) — reject after 3 same prompts in 5 min
- [ ] Detect rapid sequential requests from same IP below rate limit but suspicious (e.g., 19/min sustained)
- [ ] Log and alert on users who hit daily limits repeatedly (potential abuse or high-value conversion target)
- [ ] Block known bot user-agents in proxy
- [ ] Consider Cloudflare Turnstile (free CAPTCHA) on login/signup to prevent account spam

---

## ✅ COMPLETED (This Session — Aug 23, 2026)

- [x] Supabase Auth (Google OAuth + email/password)
- [x] Proxy-based session refresh (Next.js 16 pattern)
- [x] Protected routes: /closet, /trip, /import
- [x] Gear Closet page (/closet) with DB search + custom items
- [x] Loadouts system (Supabase-backed)
- [x] Pack Lab Supabase sync (usePackSync hook — syncs when logged in)
- [x] AI Import page (/import) — parse LighterPack URLs, CSV, plain text + AI matching
- [x] "My Gear" tab in Pack Lab gear search
- [x] localStorage migration banner for existing users
- [x] Rate limiting on all AI routes (IP + user + daily caps)
- [x] Auth required for all AI routes
- [x] Pro user bypass for daily limits
- [x] Nav consolidated: MY GEAR | PACK LAB | COMPARE | AI ADVISOR | TRIP ENGINE
- [x] Dead code cleanup (gear-specs.ts, data/index.ts, empty directories)
- [x] Infrastructure audit — no broken references, no dead imports
- [x] Hero nav updated to match main nav

---

## ✅ PREVIOUSLY COMPLETED

- [x] 1,560+ items in Supabase with full specs
- [x] Full-text search working
- [x] YouTube video pipeline (92+ items with video IDs)
- [x] Gear Compare page with share URLs
- [x] Pack Lab (multi-loadout, drag/drop, share URL, CSV export, LighterPack import)
- [x] Build My Kit wizard (AI kits by budget/trip/climate)
- [x] AI Chat (Gemini, constrained to real DB items)
- [x] Trip Engine (weather + pack readiness scoring)
- [x] Gear Detail pages with specs + YouTube embeds
- [x] SEO: SSR gear pages, JSON-LD, sitemap.xml
- [x] Brands admin dashboard

---

## 📋 FUTURE FEATURES (After Business Model is Solid)

### Community & Social
- [ ] Public loadout share pages (`/u/[username]/[slug]`)
- [ ] YouTube creator packs (AI-extracted gear lists from video transcripts)
- [ ] Community loadout cloning ("Copy this pack to mine")
- [ ] Reddit r/Ultralight data pipeline (community gear popularity)

### Trip Log & Gear Aging
- [ ] Trip log: date + place + loadout + post-trip notes
- [ ] Per-item trip notes ("too warm", "zipper broke")
- [ ] Gear aging: auto-accumulate miles/nights from trips
- [ ] Health warnings at category thresholds (shoes @ 500mi, pads @ 200 nights)

### AI Intelligence Layer
- [ ] AI Pack Audit ("swap X for Y, save 8oz")
- [ ] Gear-for-Conditions engine (weather → gear spec thresholds)
- [ ] Gap detection ("no wind layer but exposed ridgeline")
- [ ] Redundancy detection ("headlamp + lantern — one covers both")
- [ ] Combined warmth modeling (quilt + pad + clothing + shelter)

### Group Trips
- [ ] Multi-user trip planning
- [ ] Shared gear assignment ("who's carrying the stove?")
- [ ] Weight balancing across group members

### Content & SEO
- [ ] "Best [category]" collection pages (e.g., `/gear/best-quilts`)
- [ ] SEO slugs on compare: `/compare/nemo-tensor-vs-thermarest-neoair`
- [ ] Gear reviews aggregation

### Price Tracking (DEFERRED — high infrastructure cost)
- [ ] Price monitoring via affiliate APIs
- [ ] Deal alerts for wishlist items
- [ ] Price history charts on gear pages

---

## 🔧 TECH DEBT (Clean Up When Time Allows)

- [ ] Remove static `src/data/gear-database.ts` data array (keep types only, use Supabase for all data)
- [ ] Unify Supabase clients (old `supabase.ts` → new `supabase/client.ts` pattern)
- [ ] Rename store's `Loadout` type to `PackLoadout` to avoid collision with loadout-api's `Loadout`
- [ ] Remove `src/lib/loadout-api.ts` once all users have migrated (only used by MigratePack)
- [ ] Performance: virtualize long lists in gear search
- [ ] Accessibility audit
- [ ] Error boundaries on all pages
