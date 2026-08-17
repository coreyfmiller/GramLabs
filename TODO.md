# HikeMind — TODO

## Gear Database — Links & Monitoring
- [ ] Add manufacturer URLs to every gear item in the database
- [ ] Add affiliate links where applicable (REI, Amazon, brand sites)
- [ ] Build a daily link checker script (cron job or serverless function)
  - Ping each URL, check for 200 status
  - Flag 404s, redirects, and timeouts
  - Email/Slack alert when links break
  - Auto-disable broken links in the UI (show "link unavailable" instead of dead link)
- [ ] Admin dashboard showing link health (% working, recently broken)
- [ ] Fallback: if manufacturer link dies, auto-search for product on Google Shopping / REI / Amazon
- [ ] Consider using a link management service (e.g., Linkly, or self-hosted redirect layer) for easier updates

## Pack Lab — Polish
- [ ] Priority matrix for cost (quadrant chart: cost vs weight savings per item/upgrade)
- [ ] Drag to reorder items in pack list (persist to store)
- [ ] Export to CSV
- [ ] Price total display
- [ ] Item count display
- [ ] "Big 3" weight callout (pack + shelter + sleep system)
- [ ] Weight vs community average per category
- [ ] Category filter as horizontal scroll on mobile (currently wraps ugly)
- [ ] Improve AI suggestions — contextual ("your Big 3 is heavier than 72% of PCT hikers")

## Pack Lab — Import
- [ ] LighterPack URL import (parse their JSON-encoded URL format)
- [ ] PackWizard import
- [ ] CSV/spreadsheet import
- [ ] Lighterpack share URL detection + one-click migration

## Trip Engine (Next Major Feature)
- [ ] Trail input (name, start date, duration)
- [ ] Weather API integration (OpenWeather or WeatherAPI for forecasts)
- [ ] Day-by-day forecast tied to trail location
- [ ] Sleep system validation against overnight lows
- [ ] Water carry calculator between sources
- [ ] Calorie/food weight estimation per day
- [ ] Layering advisor based on expected temps + activity level
- [ ] Resupply planning for multi-day trips
- [ ] Daily pack weight curve (shows decrease as consumables are used)
- [ ] Risk flags ("12-mile dry stretch in 90°F — carry minimum 4L")

## Gear Intel (Future)
- [ ] Side-by-side gear comparison tool
- [ ] Warmth-to-weight ratio scoring
- [ ] Cost-per-ounce-saved metric
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
