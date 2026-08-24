import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface PackItemInput {
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  weightOz: number;
  priceUsd: number;
  status: string; // packed, worn, consumable
  quantity: number;
  tempRating?: number | null;
  rValue?: number | null;
  fillType?: string | null;
  waterproof?: boolean;
  volume?: number | null;
  shelterType?: string | null;
  capacity?: number | null;
  seasons?: string | null;
}

const SYSTEM_PROMPT = `You are HikeMind Pack Analyzer — an elite ultralight backpacking systems analyst with the combined expertise of Andrew Skurka (systems thinking, layering), Jupiter (real-world thru-hike testing), Darwin (minimal sub-8lb), Adventure Alan (spec obsession, warmth-to-weight), and Halfway Anywhere (community data patterns).

You analyze packs at the SYSTEM level, not just individual items. You think about how gear interacts: combined warmth (quilt + pad R-value + shelter + clothing), redundancy, missing function gaps, and weight distribution.

ANALYSIS FRAMEWORK:

1. WEIGHT DISTRIBUTION
- Big 3 (shelter + sleep + pack) should be 50-60% of base weight
- If Big 3 > 65%, the user needs lighter options in that category
- Base weight classifications: <10lb ultralight, 10-15lb lightweight, 15-20lb traditional, 20+ heavy
- Skin-out total matters too — heavy worn clothing is still weight on your body

2. SLEEP SYSTEM WARMTH (CRITICAL)
- Combined comfort = quilt/bag temp rating + pad R-value contribution
- Pad R-value comfort boost: R2=+5°F, R3=+10°F, R4=+15°F, R5=+20°F, R6+=+25°F
- If no temp rating on quilt/bag, note it as "unknown warmth — verify before cold weather"
- Sleeping in a shelter adds ~5-10°F effective warmth vs exposed
- Flag if combined comfort is within 10°F of expected conditions (user should specify or assume 3-season: 25-35°F lows)

3. REDUNDANCY CHECK
- Puffy + fleece + base layer = OK (layering system)
- Puffy + fleece on a summer trip where lows > 50°F = redundant, drop one
- Headlamp + lantern = redundant unless group camping
- Multiple fire-starting methods = OK (redundancy for safety is fine)
- Rain jacket + wind jacket = usually redundant (rain jacket IS a wind jacket)
- Water filter + purification tablets = OK (backup is smart)

4. MISSING ESSENTIALS (flag as red)
- No sleep system (quilt/bag) for overnight trip
- No shelter of any kind
- No water treatment
- No headlamp/light
- No insulation layer and temps below 50°F expected
- No rain protection (jacket or poncho)

5. WEIGHT OPPORTUNITIES (rank by oz saved per $ spent)
- Identify the heaviest items that have lighter alternatives
- Focus on the "easy wins" — items where 30-50% weight savings exist at reasonable cost
- Cold soaking vs stove system for summer trips (saves 10-16oz)
- Frameless pack if base weight < 15lb (saves 20-40oz vs framed)
- DCF shelter vs silnylon (saves 10-20oz but $$)

6. BUDGET UPGRADE PATH
- Rank upgrades by "oz saved per dollar spent"
- Best value swaps: heavy tent → trekking pole tent, synthetic bag → down quilt, frame pack → frameless
- Note diminishing returns (spending $400 to save 2oz is not worth it for most hikers)

RESPONSE FORMAT — valid JSON only, no markdown:
{
  "score": 7,
  "classification": "lightweight",
  "baseWeight": "12 lb 4.2 oz",
  "big3Weight": "7 lb 2.1 oz",
  "big3Percentage": 58,
  "redFlags": [
    "Sleep system only comfortable to ~38°F — risky for shoulder season trips with lows in the 20s"
  ],
  "redundancies": [
    "Carrying both a puffy (12oz) and heavyweight fleece (14oz). For 3-season above 35°F lows, one active insulation layer is sufficient. Drop the fleece, save 14oz."
  ],
  "missingEssentials": [
    "No headlamp detected — essential for any overnight trip"
  ],
  "weightOpportunities": [
    { "item": "Osprey Exos 58", "currentOz": 38.4, "suggestion": "Switch to ULA Circuit (39oz) or Gossamer Gear Mariposa (26oz) if base weight allows frameless", "savingsOz": 12, "estimatedCost": "$200-280" },
    { "item": "MSR Hubba Hubba 2", "currentOz": 52, "suggestion": "Durston X-Mid 2 (40oz) — lighter trekking pole tent with similar space", "savingsOz": 12, "estimatedCost": "$250" }
  ],
  "systemNotes": [
    "Your layering system is solid for 3-season: base layer → fleece → puffy → rain shell gives you coverage from 60°F down to 25°F",
    "Sleep warmth analysis: 20°F quilt + R4.2 pad ≈ comfortable to ~5°F. Well matched for shoulder season."
  ],
  "summary": "Solid lightweight kit with room to cut 1-2 lb through shelter and pack upgrades. Sleep system is well-matched. Main opportunity is the Big 3 — currently 64% of base weight."
}`;

import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: require auth, 10 analyses/day, 5 req/min
  const check = await rateLimit(req, {
    requireAuth: true,
    dailyLimit: 10,
    maxPerMinute: 5,
    feature: "analyze-pack",
  });
  if (check.error) return check.error;

  try {
    const { items, tripContext } = await req.json() as {
      items: PackItemInput[];
      tripContext?: string; // optional: "3-season", "summer", "winter", "PCT thru-hike", etc.
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in pack to analyze" }, { status: 400 });
    }

    // Calculate stats to include in prompt
    const packedItems = items.filter(i => i.status === "packed");
    const wornItems = items.filter(i => i.status === "worn");
    const consumableItems = items.filter(i => i.status === "consumable");

    const baseWeight = packedItems.reduce((s, i) => s + i.weightOz * i.quantity, 0);
    const wornWeight = wornItems.reduce((s, i) => s + i.weightOz * i.quantity, 0);
    const totalWeight = items.reduce((s, i) => s + i.weightOz * i.quantity, 0);

    const big3Cats = ["shelter", "sleep", "pack"];
    const big3Weight = packedItems
      .filter(i => big3Cats.includes(i.category))
      .reduce((s, i) => s + i.weightOz * i.quantity, 0);

    const totalCost = items.reduce((s, i) => s + i.priceUsd * i.quantity, 0);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const prompt = `Analyze this backpacking pack:

TRIP CONTEXT: ${tripContext || "General 3-season backpacking (assume overnight lows 25-40°F)"}

PACK STATISTICS:
- Base weight: ${(baseWeight / 16).toFixed(1)} lb (${baseWeight.toFixed(1)} oz)
- Worn weight: ${(wornWeight / 16).toFixed(1)} lb
- Total skin-out: ${(totalWeight / 16).toFixed(1)} lb
- Big 3 weight: ${(big3Weight / 16).toFixed(1)} lb (${baseWeight > 0 ? ((big3Weight / baseWeight) * 100).toFixed(0) : 0}% of base)
- Total cost: $${totalCost.toFixed(0)}
- Item count: ${items.reduce((s, i) => s + i.quantity, 0)}

PACKED ITEMS (base weight):
${packedItems.map(i => `- ${i.brand} ${i.name} | ${i.category}${i.subcategory ? '/' + i.subcategory : ''} | ${(i.weightOz * i.quantity).toFixed(1)}oz${i.quantity > 1 ? ' (x' + i.quantity + ')' : ''} | $${i.priceUsd}${i.tempRating !== undefined && i.tempRating !== null ? ' | temp: ' + i.tempRating + '°F' : ''}${i.rValue ? ' | R-value: ' + i.rValue : ''}${i.waterproof ? ' | waterproof' : ''}${i.volume ? ' | ' + i.volume + 'L' : ''}${i.shelterType ? ' | ' + i.shelterType : ''}${i.capacity ? ' | ' + i.capacity + 'p' : ''}${i.seasons ? ' | ' + i.seasons + '-season' : ''}`).join('\n')}

WORN ITEMS:
${wornItems.length > 0 ? wornItems.map(i => `- ${i.brand} ${i.name} | ${i.weightOz}oz | $${i.priceUsd}`).join('\n') : '(none)'}

CONSUMABLE ITEMS:
${consumableItems.length > 0 ? consumableItems.map(i => `- ${i.brand} ${i.name} | ${i.weightOz}oz`).join('\n') : '(none)'}

Provide a comprehensive system-level analysis. Think like an expert who has hiked 10,000+ miles and seen hundreds of packs. Be specific about which items and which numbers you're referencing. Return valid JSON.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.response.text();
    const jsonStr = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(jsonStr);

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error("Pack Analyzer error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze pack";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
