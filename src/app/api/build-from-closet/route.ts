import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are HikeMind Pack Builder — an expert ultralight backpacking gear curator. Your job is to select the OPTIMAL subset of gear from a user's personal closet inventory to build the lightest complete pack for their specific trip conditions.

RULES:
1. ONLY select items the user owns (from the inventory provided). Never suggest items not in the list.
2. Build a COMPLETE pack — shelter, sleep, pack/bag, insulation, rain protection, water treatment, light source, food system. Only skip categories if the trip type doesn't need them (e.g., day hike = no shelter/sleep).
3. Pick the LIGHTEST option in each category that meets the conditions. If the user has a 20°F quilt and a 40°F quilt, pick the one that matches their expected lows.
4. Prefer packed status for most items. Mark clothing layers that would be worn while hiking as "worn". Mark food/water/fuel as "consumable".
5. Do NOT include redundant items unless layering (e.g., base layer + insulation + shell = good; two fleeces = bad).
6. For sleep: match quilt/bag temp rating to expected lows. Pick the pad with adequate R-value.
7. For shelter: pick the lightest that works for conditions (tarp for fair weather, enclosed tent for rain/bugs).
8. Quantity is always 1 unless the item clearly needs multiples (e.g., trekking poles = quantity 2 if user has a pair listed as singles).

RESPONSE FORMAT — valid JSON only, no markdown fences:
{
  "loadoutName": "3-Season Weekend",
  "items": [
    { "id": "item-id-from-inventory", "status": "packed", "quantity": 1 },
    { "id": "another-item-id", "status": "worn", "quantity": 1 }
  ],
  "notes": "Brief explanation of key choices (2-3 sentences max). Mention any gaps.",
  "gaps": ["Category or function not covered by your gear — e.g., 'No rain jacket in closet'"]
}`;

interface ClosetItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  weightOz: number;
  priceUsd: number;
  tempRating?: number | null;
  rValue?: number | null;
  fillType?: string | null;
  waterproof?: boolean;
  volume?: number | null;
  shelterType?: string | null;
  capacity?: number | null;
  seasons?: string | null;
}

export async function POST(req: NextRequest) {
  // Rate limit: require auth, 5 builds/day, 3 req/min
  const check = await rateLimit(req, {
    requireAuth: true,
    dailyLimit: 5,
    maxPerMinute: 3,
    feature: "build-from-closet",
  });
  if (check.error) return check.error;

  try {
    const { tripType, expectedLows, conditions } = await req.json() as {
      tripType: string;
      expectedLows: string;
      conditions?: string;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    if (!check.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Fetch user's closet items with gear details
    const { data: userGear, error: gearError } = await supabase
      .from("user_gear")
      .select("id, gear_item_id, custom_name, custom_brand, custom_weight_oz, custom_category")
      .eq("user_id", check.user.id)
      .eq("retired", false);

    if (gearError || !userGear || userGear.length === 0) {
      return NextResponse.json(
        { error: "No gear in your closet. Add items to your closet first." },
        { status: 400 }
      );
    }

    // Fetch linked gear item details
    const gearItemIds = userGear
      .map((g) => g.gear_item_id)
      .filter((id): id is string => id !== null);

    let gearItemsMap = new Map<string, Record<string, unknown>>();
    if (gearItemIds.length > 0) {
      const { data: gearItems } = await supabase
        .from("gear_items")
        .select("id, name, brand, category, subcategory, weight_oz, price_usd, temp_rating, r_value, fill_type, waterproof, volume, shelter_type, capacity, seasons")
        .in("id", gearItemIds);

      if (gearItems) {
        gearItemsMap = new Map(gearItems.map((g) => [g.id, g]));
      }
    }

    // Build inventory list for the prompt
    const inventory: ClosetItem[] = userGear.map((ug) => {
      if (ug.gear_item_id && gearItemsMap.has(ug.gear_item_id)) {
        const g = gearItemsMap.get(ug.gear_item_id)!;
        return {
          id: ug.id, // user_gear row ID — this is what we return
          name: g.name as string,
          brand: g.brand as string,
          category: g.category as string,
          subcategory: (g.subcategory as string) || undefined,
          weightOz: g.weight_oz as number,
          priceUsd: g.price_usd as number,
          tempRating: g.temp_rating as number | null,
          rValue: g.r_value as number | null,
          fillType: g.fill_type as string | null,
          waterproof: g.waterproof as boolean,
          volume: g.volume as number | null,
          shelterType: g.shelter_type as string | null,
          capacity: g.capacity as number | null,
          seasons: g.seasons as string | null,
        };
      }
      // Custom item
      return {
        id: ug.id,
        name: ug.custom_name || "Unknown",
        brand: ug.custom_brand || "Custom",
        category: ug.custom_category || "accessories",
        weightOz: ug.custom_weight_oz || 0,
        priceUsd: 0,
      };
    });

    const tripContext = `Trip type: ${tripType}
Expected overnight lows: ${expectedLows}
${conditions ? `Additional conditions: ${conditions}` : ""}`;

    const inventoryText = inventory
      .map((i) =>
        `- ID: "${i.id}" | ${i.brand} ${i.name} | ${i.category}${i.subcategory ? "/" + i.subcategory : ""} | ${i.weightOz}oz | $${i.priceUsd}${i.tempRating != null ? " | temp: " + i.tempRating + "°F" : ""}${i.rValue ? " | R-value: " + i.rValue : ""}${i.waterproof ? " | waterproof" : ""}${i.volume ? " | " + i.volume + "L" : ""}${i.shelterType ? " | " + i.shelterType : ""}${i.capacity ? " | " + i.capacity + "p" : ""}${i.seasons ? " | " + i.seasons + "-season" : ""}`
      )
      .join("\n");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const prompt = `Build the optimal pack from this user's gear closet:

TRIP CONTEXT:
${tripContext}

USER'S GEAR INVENTORY (${inventory.length} items — pick from ONLY these):
${inventoryText}

Select the lightest complete kit for these conditions. Return valid JSON.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.response.text();
    const jsonStr = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const loadout = JSON.parse(jsonStr);

    // Enrich the response with full item details so the client can populate the loadout
    const selectedItems = (loadout.items || []).map((selected: { id: string; status: string; quantity: number }) => {
      const inventoryItem = inventory.find((i) => i.id === selected.id);
      if (!inventoryItem) return null;

      // Find the gear_item_id for this user_gear row
      const userGearRow = userGear.find((ug) => ug.id === selected.id);
      const gearItemId = userGearRow?.gear_item_id;

      return {
        gearId: gearItemId || selected.id,
        item: {
          id: gearItemId || selected.id,
          name: inventoryItem.name,
          brand: inventoryItem.brand,
          category: inventoryItem.category,
          subcategory: inventoryItem.subcategory,
          weightOz: inventoryItem.weightOz,
          priceUsd: inventoryItem.priceUsd,
        },
        status: selected.status || "packed",
        quantity: selected.quantity || 1,
      };
    }).filter(Boolean);

    return NextResponse.json({
      loadoutName: loadout.loadoutName || `${tripType} Pack`,
      items: selectedItems,
      notes: loadout.notes || "",
      gaps: loadout.gaps || [],
    });
  } catch (error: unknown) {
    console.error("Build from closet error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to build pack";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
