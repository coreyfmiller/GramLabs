/**
 * Semantic search utility for gear items.
 *
 * Takes pre-filtered gear items, embeds the user's query, and returns the
 * top-N most relevant items ranked by cosine similarity. Ensures category
 * diversity so the AI gets a complete kit's worth of options.
 *
 * Falls back to a heuristic sort (weight/price ratio per priority) if
 * the embedding API is unavailable.
 */

import type { GearItem, GearCategory } from "@/data/gear-database";
import {
  getEmbeddingCache,
  embedQuery,
  cosineSimilarity,
} from "./gear-embeddings";

interface ScoredItem {
  item: GearItem;
  score: number;
}

/**
 * Build a search query string from the user's kit constraints.
 * This gets embedded and compared against gear item embeddings.
 */
export function buildSearchQuery(params: {
  budget: number;
  tripType: string;
  climate: string;
  sleepStyle: string;
  priority: string;
}): string {
  const priorityDesc =
    params.priority === "lightest"
      ? "ultralight, minimize weight"
      : params.priority === "value"
        ? "best weight savings per dollar, good value"
        : "comfortable, livable, quality";

  return [
    `Complete ${params.tripType} backpacking kit`,
    `${params.climate} climate conditions`,
    `${params.sleepStyle} sleep system`,
    `Budget $${params.budget}`,
    priorityDesc,
    "shelter, insulation, sleeping pad, backpack, rain gear, insulation jacket, cooking, water filtration, headlamp, trekking poles",
  ].join(". ");
}

/**
 * Minimum items to retrieve per category to ensure the AI has options
 * for building a complete kit.
 */
const MIN_PER_CATEGORY: Record<GearCategory, number> = {
  shelter: 4,
  sleep: 6, // quilts + pads + pillows
  pack: 4,
  kitchen: 5,
  electronics: 3,
  clothing: 4,
  safety: 3,
  accessories: 6,
};

/**
 * Heuristic scoring fallback when embeddings are unavailable.
 * Ranks items by a priority-weighted combination of weight and price.
 */
function heuristicScore(item: GearItem, priority: string): number {
  // Lower is better for weight and price; invert so higher score = better pick
  const weightScore = 1 / (item.weightOz + 1);
  const valueScore = weightScore / (item.priceUsd + 1);
  const comfortScore = 1 / (item.priceUsd + 1); // cheaper items aren't comfier, but tier matters

  switch (priority) {
    case "lightest":
      return weightScore * 10 + valueScore;
    case "value":
      return valueScore * 10 + weightScore;
    case "comfort":
    default:
      // Premium/mid tier items score higher for comfort
      const tierBonus =
        item.tier === "premium" ? 4 : item.tier === "mid" ? 2 : item.tier === "budget" ? 1 : 0;
      return tierBonus + comfortScore;
  }
}

/**
 * Fallback: select top-N items per category using heuristic scoring.
 * Maintains category diversity without needing embeddings.
 */
function heuristicSelect(
  filteredItems: GearItem[],
  priority: string,
  topN: number
): GearItem[] {
  const scored = filteredItems
    .map((item) => ({ item, score: heuristicScore(item, priority) }))
    .sort((a, b) => b.score - a.score);

  // Same category-diversity logic as semantic search
  const selected = new Map<string, ScoredItem[]>();
  const remaining: ScoredItem[] = [];

  for (const entry of scored) {
    const cat = entry.item.category;
    const catList = selected.get(cat) || [];
    const minNeeded = MIN_PER_CATEGORY[cat] || 3;

    if (catList.length < minNeeded) {
      catList.push(entry);
      selected.set(cat, catList);
    } else {
      remaining.push(entry);
    }
  }

  const result: GearItem[] = [];
  for (const items of selected.values()) {
    result.push(...items.map((s) => s.item));
  }

  const slotsLeft = topN - result.length;
  if (slotsLeft > 0) {
    const alreadySelected = new Set(result.map((i) => i.id));
    const extras = remaining
      .filter((s) => !alreadySelected.has(s.item.id))
      .slice(0, slotsLeft);
    result.push(...extras.map((s) => s.item));
  }

  return result;
}

/**
 * Perform semantic search over pre-filtered gear items.
 *
 * 1. Embeds the user query
 * 2. Scores each filtered item by cosine similarity
 * 3. Ensures minimum category coverage (so the AI has shelter + sleep + pack + etc.)
 * 4. Returns top-N items (default 50) for the AI prompt
 *
 * If the embedding API fails, falls back to heuristic selection.
 */
export async function semanticSearch(
  filteredItems: GearItem[],
  params: {
    budget: number;
    tripType: string;
    climate: string;
    sleepStyle: string;
    priority: string;
  },
  topN: number = 50
): Promise<GearItem[]> {
  try {
    const cache = await getEmbeddingCache();
    const query = buildSearchQuery(params);
    const queryEmbedding = await embedQuery(query);

    // Score all filtered items
    const scored: ScoredItem[] = filteredItems
      .map((item) => {
        const itemEmbedding = cache.get(item.id);
        if (!itemEmbedding) {
          return { item, score: 0 };
        }
        return { item, score: cosineSimilarity(queryEmbedding, itemEmbedding) };
      })
      .sort((a, b) => b.score - a.score);

    // Ensure category diversity: pick minimum items per category first
    const selected = new Map<string, ScoredItem[]>();
    const remaining: ScoredItem[] = [];

    for (const entry of scored) {
      const cat = entry.item.category;
      const catList = selected.get(cat) || [];
      const minNeeded = MIN_PER_CATEGORY[cat] || 3;

      if (catList.length < minNeeded) {
        catList.push(entry);
        selected.set(cat, catList);
      } else {
        remaining.push(entry);
      }
    }

    // Collect guaranteed category items
    const result: GearItem[] = [];
    for (const items of selected.values()) {
      result.push(...items.map((s) => s.item));
    }

    // Fill remaining slots with highest-scoring items across all categories
    const slotsLeft = topN - result.length;
    if (slotsLeft > 0) {
      const alreadySelected = new Set(result.map((i) => i.id));
      const extras = remaining
        .filter((s) => !alreadySelected.has(s.item.id))
        .slice(0, slotsLeft);
      result.push(...extras.map((s) => s.item));
    }

    return result;
  } catch (error) {
    // Embedding API unavailable — fall back to heuristic selection
    console.warn("[gear-search] Embedding search failed, using heuristic fallback:", error);
    return heuristicSelect(filteredItems, params.priority, topN);
  }
}
