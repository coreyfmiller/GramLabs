---
inclusion: auto
---

# HikeMind — Product Philosophy & Standards

## Who We Are

HikeMind is building the definitive gear intelligence platform for ultralight backpackers. We are not a gear blog. We are not a spreadsheet. We are the place where community wisdom, real specs, AI reasoning, and trail conditions converge into actionable decisions.

## The Standard

We do not accept mediocrity. Every feature ships complete or it doesn't ship. Every data point is accurate or it's omitted. We'd rather show nothing than show wrong information — a hiker making decisions based on bad data could end up cold, wet, or in danger.

### Data Accuracy

- Every spec in the database must be verifiable against manufacturer data or trusted reviewer measurements
- When enriching data with AI, the confidence threshold is >80%. If uncertain, omit the field — an empty cell is better than a wrong number
- Weight is in ounces (oz), always. Prices are USD. Temperatures are Fahrenheit. R-values are ASTM-tested where possible.
- If a product is discontinued, mark it. Don't let users plan a kit around gear they can't buy.

### Product Quality

- No placeholder pages. If a feature isn't ready, it doesn't get a route.
- Mobile-first. Most hikers plan on their phones. If it doesn't work on a 375px screen, it doesn't work.
- Performance matters. A hiker on a trailhead with one bar of signal can't wait for 2MB of JavaScript. Lazy load everything non-critical.
- Accessibility is non-negotiable. Screen readers, keyboard navigation, color contrast — hikers with disabilities exist and deserve the same tool.

## Competitive Position

We beat everyone by combining things nobody else connects:

| What we have | Nobody else does this |
|---|---|
| 1000+ items with full specs | LighterPack is just a spreadsheet with no product data |
| AI that recommends from real inventory | ChatGPT hallucinates gear that doesn't exist |
| Community consensus data (future) | REI is one reviewer's opinion |
| Trip weather crossed with your pack | AllTrails has no gear layer |
| Compare tool with real specs + video | Blogs are static text, can't interact |

## The Moat We're Building

1. **Aggregated community intelligence** — what thousands of real hikers actually carry, rated, weighted, trail-tested
2. **Complete spec database** — every field filled, verified, maintained
3. **AI constrained to truth** — our chat only recommends products that exist in our database with real specs
4. **Network effects** — more users = more pack data = better recommendations = more users

## How We Make Decisions

- **Accuracy over speed.** Take the time to get the data right.
- **Depth over breadth.** 1000 items with full specs beats 10,000 items with just name and weight.
- **Community data over individual opinions.** "87% of PCT hikers used this" is more useful than "one reviewer liked it."
- **Show the math.** Don't just say "this is lighter" — show the exact weight diff, cost per oz saved, warmth-to-weight ratio.
- **Respect the user's intelligence.** Hikers are smart. Give them data, tools, and AI reasoning — not dumbed-down recommendations.

## Technical Standards

- **Database:** Every item has weight_oz and price_usd at minimum. Category-specific specs must be filled before that category appears in Compare.
- **AI prompts:** Always constrain to database inventory. Never hallucinate products. Always cite real specs.
- **State:** User data persists. Cloud-first once auth exists. localStorage is a fallback, not a strategy.
- **SEO:** Every gear page has proper title, meta description, JSON-LD structured data. We want organic traffic.
- **Sharing:** Every comparison, every pack list, every trip analysis should have a shareable URL that renders a proper social preview.

## Key Reference Documents

- `ROADMAP.md` — Strategic 30-day sprint + long-term feature plan
- `DATA_STRATEGY.md` — Full data pipeline architecture (Reddit, LighterPack, surveys)
- `TODO.md` — Tactical task backlog
- `CURRENT_STATUS.md` — What's built today
- `.kiro/steering/gear-expertise.md` — Expert sources, weight classifications, spec relationships
