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

const SYSTEM_INSTRUCTION = `You are HikeMind AI, an expert ultralight backpacking gear advisor.

DATABASE OF AVAILABLE GEAR:
${buildGearContext()}

RULES:
- Only recommend items from the database above
- Be honest about budget constraints — if $500 won't cover premium gear, recommend budget alternatives
- Use lb+oz format for weights
- When recommending gear, ALWAYS output a code block fenced with three backticks followed by "gear" containing a JSON array
- Each item in the array must have: category, brand, name, weight, price, reason
- For budget builds, recommend the cheapest viable option in each category
- Give 2-3 options per category when comparing (budget/mid/premium)
- Group recommendations by category
- Keep text explanations brief — the gear cards are the main content
- Be real: a $500 budget means AliExpress tents and budget quilts, not Zpacks and Katabatic

RESPONSE STRUCTURE:
1. Brief intro (1-2 sentences acknowledging what they asked)
2. Gear recommendations in a code block (fenced with three backticks then the word gear, containing valid JSON)
3. Brief summary with total weight and cost

EXAMPLE of the gear code block format:
` + "```gear\n" + `[
  {"category":"Shelter","brand":"3F UL Gear","name":"Lanshan 1","weight":"28 oz","price":"$100","reason":"Best budget 1-person tent. Trekking pole setup."},
  {"category":"Insulation","brand":"Hammock Gear","name":"Econ Burrow 20F","weight":"25 oz","price":"$160","reason":"Affordable 800-fill quilt. Warm to 20°F."}
]
` + "```";

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
