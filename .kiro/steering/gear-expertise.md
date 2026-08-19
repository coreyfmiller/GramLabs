---
inclusion: auto
---

# HikeMind Gear Expertise — Source of Truth

## Project Context
HikeMind (codenamed "ridgeline") is an ultralight backpacking intelligence platform. When working on gear data, recommendations, AI prompts, or product knowledge for this project, use the expertise below.

## Top 10 Ultralight Experts & Their Knowledge Domains

### 1. Andrew Skurka (andrewskurka.com)
- National Geographic Adventurer of the Year. 30,000+ trail miles including the Great Western Loop (6,875 mi) and Sea-to-Sea Route (7,778 mi).
- Expertise: Layering systems ("Core 13" clothing system), trip planning methodology, conditions-based gear selection, "stupid light" vs smart ultralight philosophy.
- Key insight: Function > weight. He advocates systems thinking — how gear pieces work together, not just individual gram savings.
- Gear philosophy: Mid-weight ultralight (12-15 lb base weight), emphasizes skills reducing gear needs.

### 2. Jupiter / James Hoher (YouTube: JupiterHikes)
- Triple Crown hiker (AT, PCT, CDT). 20,000+ miles. Documentary-style content.
- Expertise: Real-world long-distance gear testing, budget-to-premium comparisons, gear evolution over thousands of miles.
- Key insight: Gear that works for 100 miles may fail at 2,000. Durability matters differently on thru-hikes.
- Gear philosophy: Practical ultralight (8-10 lb base weight), favors proven performers over bleeding-edge.

### 3. Darwin / Nic Rakestraw (darwinonthetrail.com)
- Triple Crown hiker, adventure cyclist, outdoor filmmaker. Based in Northern Arizona.
- Expertise: Detailed gear lists for every trip (published on site), seasonal adaptation, desert/alpine crossover, bikepacking gear overlap.
- Key insight: Publishes full gear lists with weights for every single trip — the best public dataset of how one expert adapts gear to conditions.
- Gear philosophy: Minimalist ultralight, frequently sub-8 lb base weight.

### 4. Dixie / Jessica Mills (homemadewanderlust.com, YouTube)
- Triple Crown hiker. Massive YouTube following (800k+). Accessible to beginners.
- Expertise: Gear for women hikers, transitioning from traditional to ultralight, real talk on what works vs marketing hype.
- Key insight: Bridges the gap between ultralight purists and mainstream hikers. Great signal for what "normal" hikers actually buy.
- Gear philosophy: Approachable ultralight (10-12 lb), comfort-conscious.

### 5. Halfway Anywhere / Mac (halfwayanywhere.com)
- THE data source for PCT gear. Annual hiker survey (2016-present) with hundreds of respondents.
- Expertise: Quantified gear data — usage percentages, ratings, popularity trends, base weight distributions, most common items by category.
- Key insight: The only source of statistically meaningful community gear data. Their surveys show what thru-hikers ACTUALLY carry vs what influencers recommend.
- Data available: Most common gear per category, highest-rated items, average weights, price data, year-over-year trends.

### 6. Adventure Alan (adventurealan.com)
- Running since 1999. Deep-dive gear reviews, annual "best of" lists, gear trend analysis.
- Expertise: Technical specs deep-dives, warmth-to-weight ratios, fabric science, cottage manufacturer coverage, new gear scouting.
- Key insight: The most spec-obsessed reviewer. Covers fill power, denier, R-values, and materials science in ways others don't. Great source for filling spec gaps.
- Gear philosophy: Performance ultralight, willing to pay premium for measurable gains.

### 7. Clever Hiker / Dan Becker (cleverhiker.com)
- 25,000+ miles tested. Structured comparison reviews, tutorial content.
- Expertise: Side-by-side gear comparisons with scoring rubrics, "best for X budget" recommendations, beginner-to-advanced progression guides.
- Key insight: Best at framing gear choices as budget-tiered recommendations. Their scoring system maps well to our tier system (ultra-budget → premium).
- Gear philosophy: Value-oriented ultralight, emphasizes best bang-for-buck.

### 8. Outdoor Gear Lab (outdoorgearlab.com)
- Professional testing team. Purchases all products independently. Months of field testing.
- Expertise: Standardized scoring methodology, lab-verified specs, side-by-side controlled comparisons, "best for" awards.
- Key insight: The most rigorous testing methodology. Their scores are trusted because they test 10-20 products in each category simultaneously under identical conditions.
- Focus: Quantitative performance data with ratings.

### 9. Lint / Justin Lichter
- First known winter thru-hike of the PCT. CDT, AT, Te Araroa, and many international trails.
- Expertise: Extreme-condition gear selection, winter ultralight, international trail systems, pushing boundaries of what's possible with minimal gear.
- Key insight: If it works for Lint in winter on the PCT, it works anywhere. His gear choices represent the absolute ceiling of "how light can you go in harsh conditions."
- Gear philosophy: Extreme ultralight (sub-7 lb), proven through the hardest conditions.

### 10. The Trek / Appalachian Trials (thetrek.co)
- Community platform with thousands of trail reports, gear reviews from actual thru-hikers.
- Expertise: Aggregated real-world data from many hikers (not one expert), trail-specific advice, current-year conditions and gear trends.
- Key insight: Crowd-sourced wisdom. When 50 AT hikers all say the same tent leaks, that's more reliable than one reviewer's sample.
- Focus: AT and PCT community knowledge, current-season reports.

## Gear Knowledge Principles (Apply When Building Features)

### Weight Classification
- **Ultralight**: Base weight under 10 lb (160 oz)
- **Lightweight**: Base weight 10-15 lb
- **Traditional**: Base weight 15-25 lb
- **Heavy**: Base weight 25+ lb

### The Big 3 (55-65% of base weight)
- **Shelter**: Tent/tarp/hammock system
- **Sleep system**: Quilt/bag + pad
- **Pack**: Backpack itself

### Critical Spec Relationships
- Quilt/bag temp rating should be 10-15°F BELOW expected overnight lows for comfort
- Sleeping pad R-value: R2 (summer only), R3.5 (3-season), R5+ (winter)
- Combined sleep warmth = quilt rating + pad R-value + shelter wind protection + clothing
- Pack volume: 35-45L for ultralight, 50-60L for traditional loads
- Pack frame needed when total pack weight exceeds 20-25 lb

### Budget Tiers (Our System)
- **Ultra-budget** ($0-150 total): AliExpress brands (3F UL, FLAME'S CREED, Naturehike budget line)
- **Budget** ($150-500): Hammock Gear Econ, Paria, Durston, budget cottage
- **Mid** ($500-1200): REI brands, Nemo, Thermarest, mainstream cottage
- **Premium** ($1200+): Zpacks, Katabatic, Nunatak, HMG, Western Mountaineering

### Season Definitions
- **3-season**: Spring through fall, temps 25°F+ overnight, no sustained snow
- **3+ season**: Extended shoulder season, temps 15-25°F possible, occasional snow
- **4-season**: Full winter, sub-zero possible, snow load, high winds

## Database Status (Updated Aug 2026)

### What's Solid
- 1000 items, all with weight_oz + price_usd + category + tier
- Shelters: shelter_type, capacity, seasons at 100%
- Packs: volume at 100%
- Subcategories: 97.3% tagged

### What's Being Filled (enrichment script running)
- Shelter extended specs: floor_area, peak_height, packed_size, fabric, setup_type, stakes, doors, vestibule
- Sleep: thickness, pad dimensions, pad shape, inflation method, fill weight, sleep width/length
- Packs: frame_type, hip_belt, max_carry_weight, frame_material, pack_fabric, torso_range
- Electronics: battery_type, runtime, charge_method, red_light, ipx_rating
- Stoves: boil_time, igniter, pot_included, simmer_control
- Trekking poles: collapsed_length, lock_type, grip_material, pole_sections
- Rain gear: waterproof_rating, breathability, fabric_tech, pit_zips, seam_sealed
- Insulation: hood_type, pockets, packable

### Still Missing (Future Work)
- URLs/buy links: 0/1000 (needs Serper-based link finder script)
- Community data: community_rating, pct_usage_percent (needs Reddit/survey data pipeline)
- YouTube videos: 92/1000 (needs API key setup + batch run)

## Data Sources for Filling Gaps
- halfwayanywhere.com surveys (structured ratings + weights)
- adventurealan.com reviews (detailed specs)
- outdoorgearlab.com (lab-verified specs)
- Manufacturer websites (official specs)
- r/Ultralight shakedown posts (real-world weights)
