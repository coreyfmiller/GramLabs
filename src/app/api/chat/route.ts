import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { gearDatabase, CATEGORY_LABELS, TIER_LABELS } from "@/data/gear-database";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function buildGearContext(): string {
  const grouped = new Map<string, string[]>();

  gearDatabase.forEach((item) => {
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

const SYSTEM_INSTRUCTION = `You are HikeMind AI, an expert ultralight backpacking gear advisor.

DATABASE OF AVAILABLE GEAR:
${buildGearContext()}

RULES:
- Only recommend items from the database above. Never invent items.
- Be honest about budget constraints. A $300 budget means AliExpress gear, not premium brands.
- Use lb+oz format for weights.
- Keep text explanations brief. Gear cards are the main content.

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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
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
