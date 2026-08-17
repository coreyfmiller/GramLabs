import { supabase } from "./supabase";
import { GearItem, GearCategory } from "@/data/gear-database";

export interface GearSearchParams {
  query?: string;
  category?: GearCategory | "all";
  subcategory?: string;
  limit?: number;
  offset?: number;
}

// Map Supabase snake_case rows to our camelCase GearItem interface
function mapRow(row: Record<string, unknown>): GearItem {
  return {
    id: row.id as string,
    name: row.name as string,
    brand: row.brand as string,
    category: row.category as GearCategory,
    subcategory: (row.subcategory as string) || undefined,
    tier: row.tier as GearItem["tier"],
    weightOz: row.weight_oz as number,
    priceUsd: row.price_usd as number,
    description: row.description as string,
    url: (row.url as string) || undefined,
    shelterType: (row.shelter_type as string) || undefined,
    capacity: (row.capacity as number) || undefined,
    seasons: (row.seasons as string) || undefined,
    tempRating: (row.temp_rating as number) || undefined,
    fillType: (row.fill_type as string) || undefined,
    sleepStyle: (row.sleep_style as string) || undefined,
    rValue: (row.r_value as number) || undefined,
    volume: (row.volume as number) || undefined,
    fuelType: (row.fuel_type as string) || undefined,
    lumens: (row.lumens as number) || undefined,
    poleMaterial: (row.pole_material as string) || undefined,
  } as GearItem;
}

export async function searchGear(params: GearSearchParams): Promise<GearItem[]> {
  const { query, category, subcategory, limit = 50, offset = 0 } = params;

  let q = supabase
    .from("gear_items")
    .select("*")
    .order("weight_oz", { ascending: true })
    .range(offset, offset + limit - 1);

  if (category && category !== "all") {
    q = q.eq("category", category);
  }

  if (subcategory && subcategory !== "all") {
    q = q.eq("subcategory", subcategory);
  }

  if (query && query.trim()) {
    // Use full-text search
    q = q.textSearch("fts", query.trim(), { type: "websearch" });
  }

  const { data, error } = await q;

  if (error) {
    console.error("Supabase search error:", error);
    return [];
  }

  return (data || []).map(mapRow);
}

export async function getGearCount(category?: GearCategory | "all"): Promise<number> {
  let q = supabase
    .from("gear_items")
    .select("id", { count: "exact", head: true });

  if (category && category !== "all") {
    q = q.eq("category", category);
  }

  const { count, error } = await q;
  if (error) return 0;
  return count || 0;
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("gear_items")
    .select("category");

  if (error || !data) return {};

  return data.reduce<Record<string, number>>((acc, row) => {
    const cat = row.category as string;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
}

export async function getSubcategoryCounts(category: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("gear_items")
    .select("subcategory")
    .eq("category", category);

  if (error || !data) return {};

  return data.reduce<Record<string, number>>((acc, row) => {
    const sub = (row.subcategory as string) || "other";
    acc[sub] = (acc[sub] || 0) + 1;
    return acc;
  }, {});
}
