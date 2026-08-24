import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabase as publicSupabase } from "@/lib/supabase";
import { parseCSV, parseText, ParsedItem } from "@/utils/import-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface MatchedItem {
  parsed: ParsedItem;
  match: {
    id: string;
    name: string;
    brand: string;
    category: string;
    weightOz: number;
  } | null;
  confidence: "high" | "medium" | "low" | "none";
}

/**
 * POST /api/import
 *
 * Body: { text: string; format: "csv" | "text" | "lighterpack-url" }
 *
 * Returns matched items with confidence scores.
 */
export async function POST(request: Request) {
  // Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { text, format } = body as { text: string; format: string };

  if (!text?.trim()) {
    return NextResponse.json({ error: "No input provided" }, { status: 400 });
  }

  try {
    // Step 1: Parse input into structured items
    let parsedItems: ParsedItem[];

    if (format === "lighterpack-url") {
      // Fetch LighterPack JSON from share URL
      const match = text.match(/lighterpack\.com\/r\/([a-z0-9]+)/i);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid LighterPack URL" },
          { status: 400 }
        );
      }
      const res = await fetch(`https://lighterpack.com/r/${match[1]}.json`);
      if (!res.ok) {
        return NextResponse.json(
          { error: "Could not fetch LighterPack data" },
          { status: 400 }
        );
      }
      const data = await res.json();
      parsedItems = (data.items || []).map(
        (item: { name?: string; category?: string; weight?: number; unit?: string; price?: number }) => {
          let weightOz = item.weight || 0;
          const unit = (item.unit || "oz").toLowerCase();
          if (unit === "g" || unit === "grams") weightOz = weightOz / 28.3495;
          if (unit === "kg") weightOz = (weightOz * 1000) / 28.3495;
          if (unit === "lb" || unit === "lbs") weightOz = weightOz * 16;
          return {
            name: item.name || "Unknown",
            category: item.category || undefined,
            weightOz: Math.round(weightOz * 100) / 100,
            price: item.price || undefined,
          };
        }
      );
    } else if (format === "csv") {
      parsedItems = parseCSV(text);
    } else {
      parsedItems = parseText(text);
    }

    if (parsedItems.length === 0) {
      return NextResponse.json(
        { error: "No items could be parsed from the input" },
        { status: 400 }
      );
    }

    // Step 2: Match each item against our database
    const matchedItems = await matchItems(parsedItems);

    return NextResponse.json({
      items: matchedItems,
      totalParsed: parsedItems.length,
      matched: matchedItems.filter((i) => i.confidence !== "none").length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}

/**
 * Match parsed items against the gear database using Supabase full-text search
 * + a Gemini pass for ambiguous matches.
 */
async function matchItems(parsedItems: ParsedItem[]): Promise<MatchedItem[]> {
  const results: MatchedItem[] = [];

  // Batch items for efficiency — do DB search in parallel
  const searchPromises = parsedItems.map(async (parsed): Promise<MatchedItem> => {
    // Search by name using full-text search
    const searchQuery = parsed.name.replace(/[^\w\s]/g, " ").trim();

    const { data: candidates } = await publicSupabase
      .from("gear_items")
      .select("id, name, brand, category, weight_oz, price_usd")
      .textSearch("fts", searchQuery, { type: "websearch" })
      .limit(5);

    if (!candidates || candidates.length === 0) {
      // Try a simpler ILIKE search as fallback
      const nameParts = parsed.name.split(/\s+/).filter((p) => p.length > 2);
      if (nameParts.length > 0) {
        const { data: ilikeCandidates } = await publicSupabase
          .from("gear_items")
          .select("id, name, brand, category, weight_oz, price_usd")
          .or(
            nameParts
              .slice(0, 3)
              .map((p) => `name.ilike.%${p}%`)
              .join(",")
          )
          .limit(5);

        if (ilikeCandidates && ilikeCandidates.length > 0) {
          const best = pickBestMatch(parsed, ilikeCandidates);
          if (best) return best;
        }
      }

      return {
        parsed,
        match: null,
        confidence: "none",
      };
    }

    const best = pickBestMatch(parsed, candidates);
    if (best) return best;

    return { parsed, match: null, confidence: "none" };
  });

  const settled = await Promise.all(searchPromises);
  results.push(...settled);

  // Step 3: For medium-confidence items, use Gemini to verify
  const mediumItems = results.filter((r) => r.confidence === "medium");
  if (mediumItems.length > 0 && mediumItems.length <= 20) {
    await verifyWithAI(mediumItems);
  }

  return results;
}

/**
 * Score candidates against a parsed item and pick the best match.
 */
function pickBestMatch(
  parsed: ParsedItem,
  candidates: { id: string; name: string; brand: string; category: string; weight_oz: number; price_usd: number }[]
): MatchedItem | null {
  let bestScore = 0;
  let bestCandidate = null;

  for (const candidate of candidates) {
    let score = 0;

    // Name similarity (fuzzy)
    const parsedWords = parsed.name.toLowerCase().split(/\s+/);
    const candidateWords = `${candidate.brand} ${candidate.name}`.toLowerCase().split(/\s+/);

    const matchingWords = parsedWords.filter((w) =>
      candidateWords.some((cw) => cw.includes(w) || w.includes(cw))
    );
    score += (matchingWords.length / Math.max(parsedWords.length, 1)) * 60;

    // Weight proximity (within 20% = good match)
    if (parsed.weightOz > 0 && candidate.weight_oz > 0) {
      const weightDiff = Math.abs(parsed.weightOz - candidate.weight_oz);
      const weightRatio = weightDiff / Math.max(parsed.weightOz, candidate.weight_oz);
      if (weightRatio < 0.1) score += 25;
      else if (weightRatio < 0.2) score += 15;
      else if (weightRatio < 0.4) score += 5;
    }

    // Brand match
    if (parsed.brand) {
      const parsedBrand = parsed.brand.toLowerCase();
      const candidateBrand = candidate.brand.toLowerCase();
      if (candidateBrand.includes(parsedBrand) || parsedBrand.includes(candidateBrand)) {
        score += 15;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  if (!bestCandidate) return null;

  let confidence: "high" | "medium" | "low" | "none";
  if (bestScore >= 70) confidence = "high";
  else if (bestScore >= 45) confidence = "medium";
  else if (bestScore >= 25) confidence = "low";
  else confidence = "none";

  // If confidence is too low, return no match
  if (confidence === "none") return null;

  return {
    parsed,
    match: {
      id: bestCandidate.id,
      name: bestCandidate.name,
      brand: bestCandidate.brand,
      category: bestCandidate.category,
      weightOz: bestCandidate.weight_oz,
    },
    confidence,
  };
}

/**
 * Use Gemini to verify medium-confidence matches.
 */
async function verifyWithAI(items: MatchedItem[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a hiking gear expert. I have a list of gear items that a user imported, and potential matches from our database. For each pair, tell me if the match is correct (the same product or a very close variant).

Reply with a JSON array of objects: [{ "index": 0, "correct": true/false }]

Items to verify:
${items.map((item, i) => `${i}. User: "${item.parsed.name}" (${item.parsed.weightOz}oz) → DB: "${item.match?.brand} ${item.match?.name}" (${item.match?.weightOz}oz)`).join("\n")}

Reply with ONLY the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse the JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const verdicts = JSON.parse(jsonMatch[0]) as { index: number; correct: boolean }[];
      for (const verdict of verdicts) {
        if (verdict.index >= 0 && verdict.index < items.length) {
          if (verdict.correct) {
            items[verdict.index].confidence = "high";
          } else {
            items[verdict.index].confidence = "low";
            // Don't clear the match — user can still accept it manually
          }
        }
      }
    }
  } catch (error) {
    console.warn("[import] AI verification failed, keeping medium confidence:", error);
    // Non-critical — medium confidence items stay as-is
  }
}
