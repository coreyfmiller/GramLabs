import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_LABELS, TIER_LABELS, type GearItem } from "@/data/gear-database";
import { getEmbeddingCache, embedQuery, cosineSimilarity } from "@/lib/gear-embeddings";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Retrieve the top-N gear items most relevant to the user's message
 * using embedding similarity against the pre-computed cache.
 */
async function retrieveRelevantGear(query: string, topN: number = 60): Promise<GearItem[]> {
  const { gearDatabase } = await import("@/data/gear-database");
  const cache = await getEmbeddingCache();
  const queryEmbedding = await embedQuery(query);

  const scored = gearDatabase
    .map((item) => {
      const itemEmbedding = cache.get(item.id);
      if (!itemEmbedding) return { item, score: 0 };
      return { item, score: cosineSimilarity(queryEmbedding, itemEmbedding) };
    })
    .sort((a, b) => b.score - a.score);

  // Ensure category diversity: at least 2 items per category in results
  const selected = new Map<string, GearItem[]>();
  const overflow: { item: GearItem; score: number }[] = [];

  for (const entry of scored) {
    const cat = entry.item.category;
    const catList = selected.get(cat) || [];
    if (catList.length < 3) {
      catList.push(entry.item);
      selected.set(cat, catList);
    } else {
      overflow.push(entry);
    }
  }

  const result: GearItem[] = [];
  for (const items of selected.values()) {
    result.push(...items);
  }

  // Fill remaining with top-scoring items
  const alreadySelected = new Set(result.map((i) => i.id));
  const extras = overflow
    .filter((e) => !alreadySelected.has(e.item.id))
    .slice(0, topN - result.length);
  result.push(...extras.map((e) => e.item));

  return result.slice(0, topN);
}

/**
 * Format retrieved gear items into a compact context string.
 */
function formatGearContext(items: GearItem[]): string {
  const grouped = new Map<string, string[]>();

  items.forEach((item) => {
    const cat = CATEGORY_LABELS[item.category];
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(
      `${item.brand} ${item.name} | ${item.weightOz}oz | $${item.priceUsd} | ${TIER_LABELS[item.tier]}${item.tempRating ? ` | ${item.tempRating}°F` : ""}${item.rValue ? ` | R-${item.rValue}` : ""}${item.volume ? ` | ${item.volume}L` : ""}`
    );
  });

  let context = "";
  grouped.forEach((items, category) => {
    context += `\n${category}: ${items.join("; ")}\n`;
  });

  return context;
}

const BACKTICKS = "```";

function buildSystemInstruction(gearContext: string, itemCount: number): string {
  return `You are HikeMind AI, an expert ultralight backpacking gear advisor.

DATABASE OF AVAILABLE GEAR (${itemCount} items most relevant to this conversation):
${gearContext}

RULES:
- Only recommend items from the database above. Never invent items.
- Be honest about budget constraints. A $300 budget means AliExpress gear, not premium brands.
- Use lb+oz format for weights.
- Keep text explanations brief. Gear cards are the main content.
- If asked about gear NOT in the list above, say you don't have data on that specific item but suggest alternatives from what's available.

GEAR DEPENDENCIES (MANDATORY):
- Trekking pole tent or tarp → MUST include trekking poles
- Canister stove → MUST include fuel canister AND lighter
- Water filter → MUST include water bottles or containers
- Quilt or sleeping bag → MUST include a sleeping pad
- Hammock → MUST include tarp, suspension straps, and underquilt
- Every complete kit MUST have: shelter, insulation, sleeping pad, pack, rain jacket, warm layer, headlamp, water treatment, first aid kit

RESPONSE FORMAT:
1. One brief sentence intro
2. A code block fenced with ${BACKTICKS}gear containing a JSON array of items
3. One sentence with total base weight and total cost

The JSON items MUST be ordered by category: Pack, Shelter, Insulation, Sleeping Pad, Clothing, Cooking, Water, Electronics, Safety, Hygiene, Accessories

Each JSON object MUST have exactly these fields:
- "category": the gear category (Pack, Shelter, Insulation, Sleeping Pad, Clothing, Cooking, Water, Electronics, Safety, Hygiene, Accessories)
- "brand": exact brand from database
- "name": exact product name from database
- "weight": weight in oz format like "17.1 oz"
- "price": price like "$599"
- "reason": one sentence explaining why this item

For comparisons, include 2-3 items with the same category label.

Example:
${BACKTICKS}gear
[
  {"category":"Pack","brand":"3F UL Gear","name":"Qidian 2.0 (40L)","weight":"30 oz","price":"$60","reason":"Budget frameless pack for loads under 20lb."},
  {"category":"Shelter","brand":"FLAME'S CREED","name":"Lanshan 1 (Silnylon)","weight":"33 oz","price":"$70","reason":"Budget 1-person trekking pole tent."},
  {"category":"Accessories","brand":"Cascade Mountain Tech","name":"Carbon Fiber Trekking Poles","weight":"15.6 oz","price":"$65","reason":"Required for the trekking pole tent."},
  {"category":"Insulation","brand":"Hammock Gear","name":"Econ Burrow 20F","weight":"25 oz","price":"$160","reason":"Budget 800-fill quilt comfortable to 20°F."},
  {"category":"Sleeping Pad","brand":"Flextail","name":"Zero Mattress R05 Mummy","weight":"18.3 oz","price":"$55","reason":"R-5.6 pad for under $60. Great warmth."}
]
${BACKTICKS}`;
}

import { rateLimit } from "@/lib/rate-limit";
import { isAbusivePrompt, isBotUserAgent } from "@/lib/abuse-detection";

export async function POST(req: NextRequest) {
  // Block known bots
  if (isBotUserAgent(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit: require auth, 20 messages/day, 10 req/min
  const check = await rateLimit(req, {
    requireAuth: true,
    dailyLimit: 20,
    maxPerMinute: 10,
    feature: "chat",
  });
  if (check.error) return check.error;

  try {
    const { messages } = await req.json();

    // Abuse detection: check for repeated prompts
    const latestUserMsg = messages?.filter((m: { role: string }) => m.role === "user").pop();
    if (latestUserMsg && check.user) {
      const abuse = isAbusivePrompt(check.user.id, latestUserMsg.content);
      if (abuse.blocked) {
        return NextResponse.json({ error: abuse.reason }, { status: 429 });
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Build a search query from recent conversation context
    // Use the last user message + any earlier context for better retrieval
    const userMessages = messages
      .filter((m: { role: string }) => m.role === "user")
      .slice(-3)
      .map((m: { content: string }) => m.content);
    const searchQuery = userMessages.join(" ");

    // Retrieve only relevant gear items via semantic search
    const relevantGear = await retrieveRelevantGear(searchQuery, 60);
    const gearContext = formatGearContext(relevantGear);
    const systemInstruction = buildSystemInstruction(gearContext, relevantGear.length);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction,
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response.text();

    return NextResponse.json({ message: response });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate response";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
