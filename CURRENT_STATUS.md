# HikeMind — Current Status

**Last updated:** August 23, 2026  
**Deployed:** Vercel (auto-deploys from `main` branch)  
**Database:** Supabase (PostgreSQL)  
**AI:** Google Gemini 2.0 Flash  
**Framework:** Next.js 16.3.1 (App Router, Turbopack)

---

## What's Live and Working

### Core Platform
- [x] Landing page with rotating hero video scenes
- [x] Dark theme with light mode toggle
- [x] Responsive nav: MY GEAR | PACK LAB | COMPARE | AI ADVISOR | TRIP ENGINE
- [x] Sitemap.xml for SEO (auto-generated from gear database)

### Pack Lab (the main product)
- [x] Multi-loadout gear list builder
- [x] Drag/drop reordering
- [x] Category breakdown donut chart + Big 3 tracking
- [x] Worn/packed/consumable status per item
- [x] Weight unit toggle (oz/g)
- [x] Custom item entry (any gear, not just from DB)
- [x] Custom categories with colors
- [x] Share URL generation (base64-encoded pack)
- [x] CSV export
- [x] LighterPack URL import
- [x] Buy list / wishlist
- [x] Item starring
- [x] "My Gear" tab (shows closet items when logged in)
- [x] Supabase sync when authenticated (usePackSync hook, 3s debounced)
- [x] localStorage fallback for anonymous users

### Gear Database
- [x] 1,560+ items in Supabase with full specs
- [x] Full-text search (fts tsvector column)
- [x] Paginated queries (handles >1000 row Supabase cap)
- [x] Categories: shelter, sleep, pack, kitchen, electronics, safety, accessories
- [x] Subcategory tagging
- [x] Pre-computed embeddings for semantic search (gear-embeddings.json)
- [x] 92+ items with YouTube video IDs

### AI Features (all require auth, rate-limited)
- [x] AI Advisor chat (Gemini + semantic gear retrieval, 20 msg/day)
- [x] Build My Kit wizard (AI-generated complete kits by budget/trip/climate, 5/day)
- [x] Trip Engine (location + weather → pack readiness AI analysis, 10/day)
- [x] Pack Analyzer (AI systems-level pack audit, 10/day)
- [x] Import AI matching (fuzzy match + Gemini verification for medium-confidence)

### Auth & User System
- [x] Supabase Auth (email/password + Google OAuth)
- [x] Next.js 16 proxy-based session refresh
- [x] Protected routes: /closet, /trip, /import
- [x] useAuth hook for client components
- [x] Profile auto-creation on signup (trigger)
- [x] Early adopter tier (first 1,000 users get 2x AI limits)
- [x] User numbering (sequential signup order)

### Gear Closet (/closet)
- [x] Full gear inventory grid with category filters
- [x] Add from database (search) or add custom items
- [x] Remove items
- [x] "Let's build your gear closet" onboarding state for new users
- [x] Migration banner (detects localStorage pack data, offers to import to account)
- [x] Import flow link

### Import (/import)
- [x] LighterPack URL parsing (fetches JSON from share links)
- [x] CSV parsing with auto-column detection
- [x] Plain text parsing (detects items + weights from freeform text)
- [x] AI matching against 1,560+ item database (confidence tiers)
- [x] Review step: accept/reject items, toggle linked vs custom
- [x] Batch import to closet

### Compare (/compare)
- [x] Select 2-3 items to compare
- [x] Category-locked comparisons
- [x] Side-by-side specs table
- [x] Winner detection (lightest, cheapest, best value)
- [x] Shareable comparison URL (query params)

### Gear Detail Pages (/gear/[id])
- [x] Server-rendered (SSR) for SEO
- [x] Full specs display
- [x] YouTube video embeds
- [x] JSON-LD Product structured data
- [x] "Compare with similar" internal linking

### Security & Rate Limiting
- [x] IP-based rate limiting (in-memory, per-minute caps)
- [x] User-based daily limits (Supabase-backed usage_tracking table)
- [x] Auth required on all AI routes
- [x] Pro users bypass daily limits
- [x] Early adopters get 2x daily limits
- [x] Abuse detection: repeated prompt blocking (3x same msg in 5min)
- [x] Rapid-fire detection (10+ prompts in 1min = blocked)
- [x] Bot user-agent blocking on chat route
- [x] Atomic increment_usage() RPC (no race conditions)

### Monetization Infrastructure
- [x] affiliate_url + affiliate_source columns on gear_items
- [x] Affiliate click tracking table (affiliate_clicks)
- [x] /api/click route (tracks click → returns redirect URL)
- [x] Plan column on profiles ('free' | 'early-adopter' | 'pro')
- [x] Rate limiter checks plan before enforcing limits

---

## What's NOT Working / Needs Manual Action

| Item | Status | Action Required |
|------|--------|-----------------|
| Google OAuth | ⚠️ redirect_uri_mismatch | Add JS origins + Vercel production URL to Google Cloud credentials |
| Gemini spend cap | ❌ Not set | Set $15/day budget in Google Cloud Console → Billing → Budgets |
| Stripe payments | ❌ Not built | Future: /api/stripe/checkout + webhook + upgrade UI |
| Affiliate URLs | ❌ Empty | Need to sign up for REI/Amazon programs and populate URLs |
| Pack Lab sync | ⚠️ Untested | Deployed but never manually verified end-to-end |
| Closet | ⚠️ Untested | Deployed but needs manual test with logged-in user |

---

## Architecture

```
User (browser)
  ├── Anonymous → Pack Lab (localStorage), Compare, Gear Pages
  └── Logged In → Pack Lab (Supabase sync), Closet, Import, AI features

Next.js 16 App Router
  ├── src/proxy.ts → session refresh + protected route redirects
  ├── src/app/ → pages (closet, pack-lab, import, compare, chat, trip, build, gear/[id])
  ├── src/app/api/ → AI routes (chat, build-kit, trip, analyze-pack, import, click)
  ├── src/lib/ → data layer (gear-api, closet-api, loadout-api, rate-limit, abuse-detection)
  ├── src/store/ → Zustand pack-store (localStorage persist + Supabase sync hook)
  └── src/components/ → UI (PackLabV2, Nav, Hero, MigratePack)

Supabase
  ├── gear_items (1,560+ rows, public read)
  ├── profiles (user accounts, tier, plan)
  ├── user_gear (closet inventory)
  ├── loadouts + loadout_items (server-side pack configs)
  ├── trips + trip_gear_notes (future)
  ├── usage_tracking (AI rate limiting)
  └── affiliate_clicks (revenue tracking)
```

---

## Business Model

| Revenue Source | Status | Expected |
|---|---|---|
| Affiliate links (REI, Amazon, Avantlink) | Infrastructure built, URLs not populated | Primary revenue |
| Pro tier ($5/month) | Schema ready, Stripe not integrated | Secondary revenue |
| Donations | Not built | Nice-to-have |

**Cost structure:** ~$0.09/active user/month in AI costs. $500/month budget supports ~5,500 active users.

---

## What's Next (Priority Order)

1. **Test the deployed site manually** — sign up with Google, visit closet, add gear, open Pack Lab, send a chat message
2. **Set Gemini spend cap** (Google Cloud Console — $15/day)
3. **Fix Google OAuth** if still broken (add Vercel production URL to credentials)
4. **Build Quadropus Command Center** (agent visualization dashboard)
5. **Populate affiliate URLs** (sign up for programs, run script)
6. **Stripe integration** (Pro tier checkout + webhooks)
7. **Community features** (public loadout sharing, trip logs)
