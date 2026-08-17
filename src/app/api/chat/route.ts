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
      `- ${item.brand} ${item.name}: ${item.weightOz}oz, $${item.priceUsd}, ${TIER_LABELS[item.tier]}${item.tempRating ? `, rated ${item.tempRating}°F` : ""}${item.rValue ? `, R-${item.rValue}` : ""}${item.volume ? `, ${item.volume}L` : ""} — ${item.description}`
    );
  });

  let context = "";
  grouped.forEach((items, category) => {
    context += `\n## ${category}\n${items.join("\n")}\n`;
  });

  return context;
}

const SYSTEM_PROMPT = `You are HikeMind AI, an expert ultralight backpacking gear advisor. You have deep knowledge of the ultralight hiking community, gear specifications, trail conditions, and pack optimization.

You have access to the following gear database with real weights, prices, and specifications:

${buildGearContext()}

ADDITIONAL KNOWLEDGE:
- The ultralight threshold is sub-10lb base weight (packed gear minus food, water, fuel)
- Lightweight is 10-15lb base weight, traditional is 15-20lb+
- The "Big 3" = pack + shelter + sleep system (quilt/bag + pad). This is where most weight lives.
- PCT (Pacific Crest Trail) average starting base weight is 17.76lb (2025 survey, 790 hikers)
- Most common PCT gear: ULA Circuit pack, Durston X-Mid Pro 1 tent, EE Enigma quilt, Therm-a-Rest XLite NXT pad
- Highest-rated PCT gear: Atom Packs Prospector, Zpacks Duplex, Katabatic Sawatch, NEMO Tensor Extreme
- 69.6% of PCT hikers use quilts over sleeping bags
- 60% use non-freestanding (trekking pole) shelters
- 92% wear trail runners (not boots), 94.5% non-waterproof
- Warmth modeling: Quilt rating + pad R-value + clothing layers = actual comfort temp. R-4 pad adds ~10-15°F to your system.
- For budget builds: A complete sub-10lb kit is possible for under $350 using AliExpress/budget gear.
- For premium builds: Expect $2,000-4,000 for an optimized sub-8lb kit.

RESPONSE GUIDELINES:
- Be specific: recommend actual products with weights, prices, and tier
- Be opinionated: say what YOU would carry and why
- Consider the user's budget, trail, season, and experience level
- Flag safety concerns (no water treatment, insufficient warmth, missing essentials)
- Use lb+oz format for weights (e.g., "2 lb 6 oz" not "2.38 lb")
- Keep responses concise but thorough — hikers want facts, not fluff
- When suggesting a full kit, organize by category and show total base weight + total cost
- If comparing items, show weight savings and cost difference
- Reference community data when relevant ("87% of PCT hikers use X")`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      systemInstruction: SYSTEM_PROMPT,
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
