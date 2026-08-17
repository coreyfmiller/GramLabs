# HikeMind — Data Strategy

## Overview

HikeMind's competitive advantage is a living gear intelligence layer built from the entire ultralight community's collective knowledge. This document maps every data source, what to extract from each, and the pipeline architecture.

---

## Source Map

### Tier 1 — Core (build first)

| Source | Type | What to Extract | Update Frequency |
|--------|------|-----------------|-----------------|
| r/Ultralight | Reddit | Gear shakedowns (full pack lists w/ weights + prices), gear reviews, swap recommendations, common complaints | Daily |
| r/ULgeartrade | Reddit | Real-time market pricing, demand signals (what sells fast vs sits), gear popularity | Daily |
| r/PacificCrestTrail | Reddit | Trail-specific gear validation, what worked/failed in real conditions | Weekly |
| r/AppalachianTrail | Reddit | AT-specific gear discussion, seasonal recommendations | Weekly |
| r/CDT | Reddit | CDT-specific gear, high-altitude/exposure gear needs | Weekly |
| halfwayanywhere.com surveys | Web | Structured quantified data: ratings (1-10), weights, prices, usage %, most common + highest rated | Yearly (when published) |
| LighterPack public lists | Web | Thousands of real packs with exact items, weights, prices, categories. JSON embedded in page HTML. | Weekly scrape |
| redditrecs.com | Web | Aggregated Reddit reviews per product, already structured by model | Weekly |

### Tier 2 — Supplementary

| Source | Type | What to Extract | Update Frequency |
|--------|------|-----------------|-----------------|
| r/CampingGear | Reddit | Broad gear reviews, sleeping bag/tent/pad discussions, beginner recommendations | Weekly |
| r/MYOG | Reddit | DIY gear materials, weights, costs, patterns, construction methods | Weekly |
| r/UltralightCanada | Reddit | Canadian pricing, availability, cottage manufacturers, international shipping | Weekly |
| r/JMT | Reddit | JMT-specific gear (bear canisters, high altitude), permit/conditions | Weekly |
| r/Thruhiking | Reddit | General thru-hike gear philosophy, long-distance wear/tear reports | Weekly |
| r/PNWhiking | Reddit | PNW-specific: rain gear ratings, moisture management, shoulder season | Weekly |
| Outdoor Gear Lab | Web | Structured reviews with ratings, weight comparisons, "best of" lists | Monthly |
| Backpacking Light forums | Web | Deep technical discussions, veteran hiker insights, gear science | Monthly |

### Tier 3 — Niche / Specialty

| Source | Type | What to Extract | Update Frequency |
|--------|------|-----------------|-----------------|
| r/Hammocks + r/ULHammocking | Reddit | Hammock-specific gear ecosystem (quilts, tarps, straps, pads) | Monthly |
| r/TrailRunning | Reddit | Shoes, watches, hydration systems, GPS devices | Monthly |
| r/onebag | Reddit | Pack comparisons, minimalist packing philosophy, organization | Monthly |
| r/WildernessBackpacking | Reddit | Trip reports with gear mentions, conditions-based recommendations | Monthly |
| r/CampingandHiking | Reddit | General backcountry discussion, beginner-to-intermediate gear | Monthly |
| Manufacturer websites | Web | Official specs, pricing, new product launches, discontinuations | Weekly |
| REI product pages | Web | Pricing, user reviews, specs, availability | Weekly |
| Amazon product pages | Web | Budget gear pricing, user reviews, weight specs, availability | Weekly |
| AliExpress | Web | Ultra-budget gear specs, pricing, seller ratings | Monthly |
| Cottage manufacturer sites | Web | Small-batch gear specs (Katabatic, Nunatak, Timmermade, Pa'lante, etc.) | Monthly |

---

## Data Extraction: What We Pull From Each Source Type

### Reddit Posts & Comments

**Structured extraction targets:**
- Gear item mentions (brand + product name)
- Weights (numbers + oz/g/lb/kg)
- Prices ($ amounts)
- Ratings/sentiment (positive/negative/neutral)
- Trail context (which trail, what season, what conditions)
- Complaints/failures ("leaked", "broke", "cold", "heavy")
- Recommendations ("switched to", "replaced with", "upgrade to")
- Shakedown posts (full gear lists with all items, weights, categories)

**Post types to prioritize:**
- `[Shakedown]` tagged posts (formatted gear lists)
- `[Gear Review]` posts
- "What [item] do you use?" threads
- "Switching from X to Y" posts
- Trip reports mentioning gear performance

### LighterPack Lists

**Data structure (embedded as JSON in page HTML):**
- Item name, category, weight, quantity, worn/consumable flags
- Total base weight, total weight
- Share URL (unique identifier)

**What we can build from this:**
- Community average weights per category
- Most common items (frequency analysis)
- Common gear pairings (items that appear together)
- Base weight distribution curves
- "Packs like mine" similarity matching

### Hiker Surveys (halfwayanywhere.com)

**Already structured data:**
- Most common gear per category (ranked lists)
- Highest-rated gear per category (1-10 scale, 10+ raters minimum)
- Weight breakdowns per item
- Price data
- Usage percentages
- Big 3 / Big 4 totals
- Base weight averages (start vs end of trail)
- Gear advice from experienced hikers

### Product Pages (REI, Amazon, Manufacturer)

**Extract:**
- Official weight (manufacturer claimed)
- Price (current, sale, MSRP)
- Specs (R-value, temp rating, volume, materials, dimensions)
- Availability (in stock / discontinued)
- User review count + average rating
- URL (for linking)

---

## Pipeline Architecture

```
┌──────────────────────────────────────────────────┐
│                   DATA SOURCES                     │
│  Reddit API │ Web Scraping │ Manual Entry │ APIs  │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│              INGESTION LAYER                       │
│  Reddit API client (PRAW/async)                   │
│  Web scraper (Playwright/Puppeteer)               │
│  LighterPack parser                               │
│  Product page scrapers                            │
│  Scheduled jobs (GitHub Actions / Vercel Cron)    │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│              PROCESSING LAYER                      │
│  NLP: Extract gear mentions from text             │
│  Classification: Map to known products            │
│  Sentiment: Positive/negative/neutral             │
│  Deduplication: Merge mentions of same product    │
│  Weight normalization: Convert all to oz          │
│  Price normalization: USD, handle ranges          │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│              STORAGE LAYER                         │
│  PostgreSQL (Supabase)                            │
│                                                   │
│  Tables:                                          │
│  - gear_items (master product catalog)            │
│  - gear_mentions (every Reddit/web mention)       │
│  - gear_reviews (extracted reviews + sentiment)   │
│  - pack_lists (imported LighterPack data)         │
│  - trail_reports (gear + conditions + trail)      │
│  - price_history (price tracking over time)       │
│  - community_ratings (aggregated scores)          │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│              APPLICATION LAYER                     │
│                                                   │
│  HikeMind Features Powered by Data:                │
│                                                   │
│  • Gear Database — enriched with community data   │
│  • AI Suggestions — "87% of PCT hikers use X"    │
│  • Smart Swaps — based on real switch patterns    │
│  • Community Ratings — aggregated from all sources│
│  • Trail Intelligence — conditions + gear match   │
│  • Price Alerts — track drops, used market        │
│  • Trending Gear — what's gaining/losing          │
│  • "Packs Like Mine" — similarity matching        │
└──────────────────────────────────────────────────┘
```

---

## Technical Implementation Notes

### Reddit API Access
- Use Reddit's official API (free tier: 100 requests/minute)
- Authenticate via OAuth2 (script app type)
- Target subreddits: search by flair, keywords, post type
- Store raw posts + extracted structured data separately
- Respect rate limits and Reddit TOS

### Web Scraping
- LighterPack: Parse URL-encoded JSON from page HTML (no JS rendering needed)
- redditrecs.com: Standard HTML scraping
- Product pages: Likely need Playwright for JS-rendered content
- halfwayanywhere.com: Static HTML, straightforward
- Respect robots.txt, rate limit to 1 req/sec

### NLP / Classification
- Start simple: regex patterns for gear names, weights, prices
- Build a product name dictionary from our existing database
- Fuzzy matching for variations ("EE Enigma" = "Enlightened Equipment Enigma")
- Sentiment: keyword-based initially (positive: "love", "solid", "recommend"; negative: "leaked", "broke", "returned", "cold")
- Graduate to LLM-based extraction if volume warrants it

### Scheduling
- Daily: r/Ultralight, r/ULgeartrade (high-volume, time-sensitive)
- Weekly: Other subreddits, LighterPack scraping, product pages
- Monthly: Manufacturer sites, niche subreddits
- Yearly: Survey data integration (manual, when published)

---

## Phase Plan

### Phase 1 (Now)
Manual data entry from surveys and research. This is what we're doing — building the database by hand from PCT survey data, AliExpress listings, and manufacturer specs.

### Phase 2 (When we have users)
- Reddit API integration for r/Ultralight shakedowns
- LighterPack list parser (bulk import public lists)
- Basic community rating aggregation
- Price tracking from major retailers

### Phase 3 (Scale)
- Full NLP pipeline for gear mention extraction
- Real-time trending gear dashboard
- "Packs Like Mine" recommendation engine
- Used market price intelligence from r/ULgeartrade
- Trail-specific gear scoring ("how well does your pack fit the AT in October?")

---

## Competitive Moat

Once this data layer is running:
- LighterPack is just a spreadsheet (no intelligence)
- Featherline has AI but no community data
- AllTrails has trails but no gear intelligence
- No one connects community knowledge + gear data + trail conditions

HikeMind becomes the only tool that says: "Based on 4,200 PCT shakedown posts, your shelter choice is heavier than 89% of thru-hikers, and 73% of people who switched away from it went to the Durston X-Mid Pro 1."

That's the moat.
