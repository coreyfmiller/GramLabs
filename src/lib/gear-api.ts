import { supabase } from "./supabase";
import { GearItem, GearCategory } from "@/data/gear-database";

/**
 * IMPORTANT — Supabase Row Limit
 * ================================
 * Supabase returns a MAXIMUM of 1000 rows per query by default.
 * Any .select("*") without .range() or with a range exceeding 1000 will silently cap at 1000.
 * 
 * Rules for this file:
 * - For counts: ALWAYS use { count: "exact", head: true } — this is NOT affected by the row limit.
 * - For fetching rows: ALWAYS paginate with .range() in a loop, or use getAllGear().
 * - NEVER trust a single .select("*") to return more than 1000 rows.
 * 
 * As of Aug 2026: database has 1,560+ items. This WILL grow.
 */

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
    // Shelter
    shelterType: (row.shelter_type as string) || undefined,
    capacity: (row.capacity as number) || undefined,
    seasons: (row.seasons as string) || undefined,
    setupType: (row.setup_type as string) || undefined,
    floorArea: (row.floor_area as number) || undefined,
    peakHeight: (row.peak_height as number) || undefined,
    packedSize: (row.packed_size as string) || undefined,
    fabric: (row.fabric as string) || undefined,
    fabricDenier: (row.fabric_denier as number) || undefined,
    stakesNeeded: (row.stakes_needed as number) || undefined,
    doors: (row.doors as number) || undefined,
    vestibuleArea: (row.vestibule_area as number) || undefined,
    // Sleep
    tempRating: (row.temp_rating as number) || undefined,
    fillType: (row.fill_type as string) || undefined,
    fillPower: (row.fill_power as number) || undefined,
    fillWeight: (row.fill_weight as number) || undefined,
    sleepStyle: (row.sleep_style as string) || undefined,
    rValue: (row.r_value as number) || undefined,
    thickness: (row.thickness as number) || undefined,
    padWidth: (row.pad_width as number) || undefined,
    padLength: (row.pad_length as number) || undefined,
    // Pack
    volume: (row.volume as number) || undefined,
    frameType: (row.frame_type as string) || undefined,
    hipBelt: (row.hip_belt as string) || undefined,
    // Kitchen
    fuelType: (row.fuel_type as string) || undefined,
    boilTime: (row.boil_time as number) || undefined,
    igniter: row.igniter != null ? (row.igniter as boolean) : undefined,
    potIncluded: row.pot_included != null ? (row.pot_included as boolean) : undefined,
    simmerControl: row.simmer_control != null ? (row.simmer_control as boolean) : undefined,
    // Community
    communityRating: (row.community_rating as number) || undefined,
    // Electronics
    lumens: (row.lumens as number) || undefined,
    batteryType: (row.battery_type as string) || undefined,
    runtime: (row.runtime as number) || undefined,
    // Poles
    poleMaterial: (row.pole_material as string) || undefined,
    // Clothing
    waterproof: (row.waterproof as boolean) || undefined,
    hoodType: (row.hood_type as string) || undefined,
  } as GearItem;
}

export async function searchGear(params: GearSearchParams): Promise<GearItem[]> {
  const { query, category, subcategory, limit = 100, offset = 0 } = params;

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

/**
 * Fetch ALL items (paginated internally to avoid Supabase 1000-row cap).
 * Use for Pack Lab browse mode where the full library is needed.
 */
export async function getAllGear(params?: { category?: GearCategory | "all"; subcategory?: string }): Promise<GearItem[]> {
  const { category, subcategory } = params || {};
  let allItems: GearItem[] = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    let q = supabase
      .from("gear_items")
      .select("*")
      .order("weight_oz", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (category && category !== "all") {
      q = q.eq("category", category);
    }
    if (subcategory && subcategory !== "all") {
      q = q.eq("subcategory", subcategory);
    }

    const { data, error } = await q;
    if (error || !data || data.length === 0) break;
    allItems = allItems.concat(data.map(mapRow));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allItems;
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
  // Use exact count per category — no row-limit issues with head:true
  const categories = ["shelter", "sleep", "pack", "kitchen", "electronics", "safety", "accessories"];

  const results = await Promise.all(
    categories.map(async (cat) => {
      const { count, error } = await supabase
        .from("gear_items")
        .select("id", { count: "exact", head: true })
        .eq("category", cat);
      return [cat, error ? 0 : (count || 0)] as [string, number];
    })
  );

  return Object.fromEntries(results);
}

export async function getSubcategoryCounts(category: string): Promise<Record<string, number>> {
  // Get all distinct subcategories by paginating to avoid the 1000-row default cap
  let allRows: { subcategory: string }[] = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data } = await supabase
      .from("gear_items")
      .select("subcategory")
      .eq("category", category)
      .not("subcategory", "is", null)
      .range(offset, offset + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data as { subcategory: string }[]);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const uniqueSubs = [...new Set(allRows.map((r) => r.subcategory))];

  const results = await Promise.all(
    uniqueSubs.map(async (sub) => {
      const { count, error } = await supabase
        .from("gear_items")
        .select("id", { count: "exact", head: true })
        .eq("category", category)
        .eq("subcategory", sub);
      return [sub, error ? 0 : (count || 0)] as [string, number];
    })
  );

  // Also count items with null subcategory
  const { count: nullCount } = await supabase
    .from("gear_items")
    .select("id", { count: "exact", head: true })
    .eq("category", category)
    .is("subcategory", null);

  const map = Object.fromEntries(results);
  if (nullCount && nullCount > 0) {
    map["other"] = nullCount;
  }
  return map;
}


export async function getGearByIds(ids: string[]): Promise<GearItem[]> {
  if (ids.length === 0) return [];

  // Supabase .in() has no row-limit issue for typical pack sizes (< 200 items),
  // but batch in chunks of 500 to be safe with URL length limits.
  const CHUNK_SIZE = 500;
  let allItems: GearItem[] = [];

  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from("gear_items")
      .select("*")
      .in("id", chunk);

    if (!error && data) {
      allItems = allItems.concat(data.map(mapRow));
    }
  }

  return allItems;
}
