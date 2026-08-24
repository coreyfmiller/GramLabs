import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_LABELS, type GearItem } from "@/data/gear-database";
import { filterGear } from "@/lib/gear-filter";
import { semanticSearch } from "@/lib/gear-search";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Format a shortlist of gear items into a compact context string for the LLM.
 * Only includes the fields the AI needs to make a recommendation.
 */
function formatGearContext(items: GearItem[]): string {
  return items
    .map(
      (item) =>
        `${item.brand} ${item.name} | ${CATEGORY_LABELS[item.category]}${item.subcategory ? ` (${item.subcategory})` : ""} | ${item.weightOz}oz | $${item.priceUsd} | ${item.tier} | ${item.description}`
    )
    .join("\n");
}

function buildSystemPrompt(gearContext: string, itemCount: number): string {
  return `You are HikeMind Kit Builder, an expert ultralight backpacking gear advisor. You build complete, optimized hiking kits based on user constraints.

You MUST only recommend items from this curated gear shortlist (${itemCount} items pre-selected for the user's constraints):

${gearContext}

RULES:
1. ONLY recommend items that exist in the list above. Use exact brand and name.
2. Stay within the user's budget (total of all items must not exceed budget).
3. Build a COMPLETE kit — every hiker needs: shelter, insulation (quilt/bag), sleeping pad, pack, rain shell, insulation jacket, fleece/active layer, base layers, headlamp, water filter, cook system, first aid, hygiene basics, trekking poles.
4. For hammock builds: include hammock, tarp, underquilt, top quilt, and suspension instead of tent + pad.
5. Optimize based on the user's priority: "lightest" = minimize total oz; "value" = best weight-per-dollar; "comfort" = livability over pure weight savings.
6. Climate matters: desert = lighter sleep, more water capacity, sun protection; PNW = better rain gear; alpine = warmer sleep system; temperate = balanced.
7. Budget allocation guide: Big 3 (shelter+sleep+pack) = 55-65% of budget, clothing = 15-20%, everything else = 15-25%.

RESPONSE FORMAT — you MUST respond with valid JSON only, no markdown, no explanation outside the JSON:
{
  "summary": "One sentence describing this kit and its strengths",
  "baseWeight": "X lb Y.Z oz",
  "totalWeight": "X lb Y.Z oz (including worn items)",
  "totalCost": "$XXX",
  "items": [
    {
      "category": "Shelter",
      "brand": "Brand Name",
      "name": "Product Name",
      "weight": "XX.X oz",
      "price": "$XXX",
      "reason": "Why this item was chosen for this build"
    }
  ]
}

Order items by: Shelter, Insulation, Sleeping Pad, Pack, Clothing (puffy, shell, fleece, base layers), Cooking, Water, Electronics, Safety, Hygiene, Accessories.`;
}

export async function POST(req: NextRequest) {
  try {
    const { budget, tripType, climate, sleepStyle, priority } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // --- STEP 1: Hard filter (deterministic, instant) ---
    const filtered = filterGear({ budget, tripType, climate, sleepStyle, priority });

    // --- STEP 2: Semantic search (embedding similarity, top 50) ---
    const shortlist = await semanticSearch(
      filtered,
      { budget, tripType, climate, sleepStyle, priority },
      50
    );

    // --- STEP 3: Build focused prompt with only relevant items ---
    const gearContext = formatGearContext(shortlist);
    const systemPrompt = buildSystemPrompt(gearContext, shortlist.length);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: systemPrompt,
    });

    const prompt = `Build me a complete backpacking kit with these constraints:
- Budget: $${budget} maximum total
- Trip type: ${tripType}
- Climate: ${climate}
- Sleep style: ${sleepStyle}
- Priority: ${priority} (${priority === "lightest" ? "minimize weight above all" : priority === "value" ? "best weight savings per dollar spent" : "maximize comfort and livability"})

Pick the best items from the shortlist for this build. Include 15-25 items for a complete kit. Stay under budget. Be honest — if the budget is low, use ultra-budget and budget tier items. Respond with JSON only.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.response.text();

    // Parse JSON from response (strip markdown code fences if present)
    const jsonStr = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const kit = JSON.parse(jsonStr);

    return NextResponse.json({ kit });
  } catch (error: unknown) {
    console.error("Build kit error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to build kit";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
