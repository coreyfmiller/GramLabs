---
inclusion: auto
---

# CEO Directive — Operational Orders

**Effective:** August 19, 2026  
**Authority:** This file is the single source of truth for what to build and in what order. If TODO.md, ROADMAP.md, or CURRENT_STATUS.md conflict with this file, this file wins. Update those docs to match — never the reverse.

---

## Rule #1: Read Before You Build

Before writing any code for this project, you MUST:
1. Read `CURRENT_STATUS.md` — know what's already built
2. Read this file — know what's next
3. Read `ROADMAP.md` — understand the strategic context

Do NOT re-discover the codebase from scratch. Do NOT suggest features that are already built. Do NOT waste time auditing things that are documented. The docs are kept current. Trust them, update them as you work.

---

## Rule #2: Update Docs As You Go

When you complete work:
1. Mark items done in `TODO.md`
2. Update `CURRENT_STATUS.md` with what changed
3. If the sprint priorities shift, update `ROADMAP.md`

Every session should leave the docs more accurate than it found them.

---

## Rule #3: No Scope Creep

Do not build features that are not on the current sprint. Do not "polish" things that aren't broken. Do not add infrastructure that isn't needed yet. The priority list exists for a reason — follow it.

If you think the priorities are wrong, state your case clearly and wait for approval. Do not unilaterally change direction.

---

## What's Built (Do Not Rebuild)

- Pack Lab — multi-loadout builder, share URLs, LighterPack import, custom items
- Gear Compare — side-by-side specs, winner detection, diffs, cost-per-oz, shareable URLs
- Gear Detail (`/gear/[id]`) — full specs, YouTube embeds, tier badges
- Build My Kit — AI wizard (Gemini), budget/trip/climate generation
- AI Chat — Gemini advisor constrained to real DB items
- Trip Engine — location + weather → pack readiness scoring
- Brands Admin — database health/coverage audit
- YouTube pipeline — script + GitHub Action + 92 items populated
- 1000+ item database — Supabase, full-text search, subcategory tags

---

## Current Sprint Priority (execute in this order)

### Priority 1: Populate YouTube Videos
- Run `node scripts/fetch-youtube-reviews.mjs` (95 items/run)
- Do this daily until all 731 remaining searchable items are covered
- Add GitHub repo secrets so the Action auto-runs monthly
- **No code to write. Just run the script.**

### Priority 2: SEO-Ready Gear Pages ✅ COMPLETE (Aug 19, 2026)
- `/gear/[id]` is now a server component with `generateMetadata`
- JSON-LD Product structured data on every item
- `/sitemap.xml` lists all 1000+ gear URLs
- "Compare with similar" internal linking on every detail page
- Still TODO: "Best [category]" collection pages, submit sitemap to Google Search Console

### Priority 3: Auth + Cloud Packs
- Supabase Auth (email + Google OAuth)
- `users` + `user_packs` tables
- Sync Zustand → Supabase when authenticated
- Migrate localStorage packs on first sign-in
- **Goal: Users don't lose data. Retention becomes possible.**

### Priority 4: Community Data Pipeline
- Reddit scraper (r/Ultralight shakedown posts)
- LighterPack parser (public packs)
- Surface: "Used by X% of hikers", "heavier than 73% of community"
- **Goal: Data nobody else has. The moat.**

---

## Decisions Made (Do Not Revisit)

| Decision | Rationale |
|----------|-----------|
| No separate `/gear` browse page | The detail pages ARE the product. Discovery comes from SEO + Compare search + Pack Lab. A browse grid adds complexity without clear user value. |
| Brands page stays admin-only | It's a database health tool, not a user feature. |
| YouTube on detail pages, not Compare | Compare is about quick specs. Detail pages are for deep-dive research including video. |
| No Stripe until 100+ auth users | Premature monetization distracts from growth. |
| No mobile app | Web-first. PWA later if justified. |
| localStorage until auth ships | Acceptable interim. Auth is Priority 3. |

---

## Quality Gates

Before any feature is considered "done":
- Mobile responsive (test at 375px width)
- No TypeScript errors (`npx tsc --noEmit`)
- No console errors in browser
- Loads in <3s on throttled connection
- If it touches the database, verify with real Supabase data
- If it's user-facing, proper loading states and error handling

---

## How to Handle "What's Next?" Questions

When the user asks what to work on next, reference this file's sprint priorities. Do not brainstorm new features. Do not suggest things outside the current sprint. Execute the plan.

If all sprint priorities are complete, reference `ROADMAP.md` "After the Sprint" section for the next phase.
