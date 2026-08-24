/**
 * Sync Gear Database from Supabase
 *
 * Pulls ALL gear items from the Supabase gear_items table and writes them
 * to src/data/gear-database.ts, preserving the existing file's type definitions,
 * CATEGORY_LABELS, SUBCATEGORIES, etc.
 *
 * Run via: npm run sync-db
 *
 * This is the canonical way to ensure the local TS file matches Supabase.
 * Supabase is the source of truth.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = "https://kkncobvfavgyibisdevc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbmNvYnZmYXZneWliaXNkZXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODQ5MDMsImV4cCI6MjEwMjU2MDkwM30.xEszj-RJq1RtTvu9OLny7Ic7lSlmG15V9AHFuKB3wnI";

const DB_PATH = resolve(__dirname, "../src/data/gear-database.ts");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Map a Supabase row (snake_case) to a GearItem object (camelCase).
 * Only includes non-null fields to keep the file clean.
 */
function mapRow(row) {
  const item = {};

  // Required fields
  item.id = row.id;
  item.name = row.name;
  item.brand = row.brand;
  item.category = row.category;
  item.tier = row.tier;
  item.weightOz = row.weight_oz;
  item.priceUsd = row.price_usd;
  item.description = row.description;

  // Optional fields — only include if non-null
  if (row.subcategory) item.subcategory = row.subcategory;
  if (row.url) item.url = row.url;

  // Shelter
  if (row.shelter_type) item.shelterType = row.shelter_type;
  if (row.capacity) item.capacity = row.capacity;
  if (row.seasons) item.seasons = row.seasons;
  if (row.setup_type) item.setupType = row.setup_type;
  if (row.fabric) item.fabric = row.fabric;
  if (row.fabric_denier) item.fabricDenier = row.fabric_denier;
  if (row.floor_area) item.floorArea = row.floor_area;
  if (row.peak_height) item.peakHeight = row.peak_height;
  if (row.packed_size) item.packedSize = row.packed_size;
  if (row.stakes_needed) item.stakesNeeded = row.stakes_needed;
  if (row.doors) item.doors = row.doors;
  if (row.vestibule_area) item.vestibuleArea = row.vestibule_area;

  // Sleep
  if (row.temp_rating != null) item.tempRating = row.temp_rating;
  if (row.fill_type) item.fillType = row.fill_type;
  if (row.fill_power) item.fillPower = row.fill_power;
  if (row.fill_weight) item.fillWeight = row.fill_weight;
  if (row.sleep_style) item.sleepStyle = row.sleep_style;
  if (row.sleep_width) item.sleepWidth = row.sleep_width;
  if (row.sleep_length) item.sleepLength = row.sleep_length;
  if (row.pad_attachment != null) item.padAttachment = row.pad_attachment;
  if (row.en_tested != null) item.enTested = row.en_tested;
  if (row.r_value != null) item.rValue = row.r_value;
  if (row.thickness) item.thickness = row.thickness;
  if (row.pad_width) item.padWidth = row.pad_width;
  if (row.pad_length) item.padLength = row.pad_length;
  if (row.pad_packed_size) item.padPackedSize = row.pad_packed_size;
  if (row.pad_shape) item.padShape = row.pad_shape;
  if (row.inflation_method) item.inflationMethod = row.inflation_method;

  // Pack
  if (row.volume) item.volume = row.volume;
  if (row.frame_type) item.frameType = row.frame_type;
  if (row.max_carry_weight) item.maxCarryWeight = row.max_carry_weight;
  if (row.frame_material) item.frameMaterial = row.frame_material;
  if (row.pack_fabric) item.packFabric = row.pack_fabric;
  if (row.torso_range) item.torsoRange = row.torso_range;
  if (row.hip_belt) item.hipBelt = row.hip_belt;
  if (row.water_bottle_access) item.waterBottleAccess = row.water_bottle_access;

  // Clothing
  if (row.hood_type) item.hoodType = row.hood_type;
  if (row.pockets) item.pockets = row.pockets;
  if (row.packable != null) item.packable = row.packable;
  if (row.waterproof != null) item.waterproof = row.waterproof;
  if (row.waterproof_rating) item.waterproofRating = row.waterproof_rating;
  if (row.breathability) item.breathability = row.breathability;
  if (row.fabric_tech) item.fabricTech = row.fabric_tech;
  if (row.pit_zips != null) item.pitZips = row.pit_zips;
  if (row.seam_sealed != null) item.seamSealed = row.seam_sealed;

  // Kitchen
  if (row.fuel_type) item.fuelType = row.fuel_type;
  if (row.boil_time) item.boilTime = row.boil_time;
  if (row.igniter != null) item.igniter = row.igniter;
  if (row.pot_included != null) item.potIncluded = row.pot_included;
  if (row.simmer_control != null) item.simmerControl = row.simmer_control;

  // Electronics
  if (row.lumens) item.lumens = row.lumens;
  if (row.battery_type) item.batteryType = row.battery_type;
  if (row.charge_method) item.chargeMethod = row.charge_method;
  if (row.runtime) item.runtime = row.runtime;
  if (row.red_light != null) item.redLight = row.red_light;
  if (row.ipx_rating) item.ipxRating = row.ipx_rating;

  // Trekking poles
  if (row.pole_material) item.poleMaterial = row.pole_material;
  if (row.collapsed_length) item.collapsedLength = row.collapsed_length;
  if (row.lock_type) item.lockType = row.lock_type;
  if (row.grip_material) item.gripMaterial = row.grip_material;
  if (row.pole_sections) item.poleSections = row.pole_sections;

  // Shoes
  if (row.heel_drop) item.heelDrop = row.heel_drop;
  if (row.stack_height) item.stackHeight = row.stack_height;
  if (row.toe_box_width) item.toeBoxWidth = row.toe_box_width;

  // Community
  if (row.community_rating) item.communityRating = row.community_rating;
  if (row.pct_usage_percent) item.pctUsagePercent = row.pct_usage_percent;
  if (row.pairs_per_thru) item.pairsPerThru = row.pairs_per_thru;

  return item;
}

/**
 * Serialize a JS object to a nicely-formatted TypeScript object literal.
 */
function serializeItem(item) {
  const lines = [];
  lines.push("  {");

  for (const [key, value] of Object.entries(item)) {
    if (value === null || value === undefined) continue;

    let formatted;
    if (typeof value === "string") {
      // Escape quotes and backslashes in strings
      const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      formatted = `"${escaped}"`;
    } else if (typeof value === "boolean") {
      formatted = value.toString();
    } else {
      formatted = String(value);
    }

    lines.push(`    ${key}: ${formatted},`);
  }

  lines.push("  }");
  return lines.join("\n");
}

async function main() {
  console.log("🔄 Fetching all gear items from Supabase...");

  // Supabase limits to 1000 per request, so paginate
  let allRows = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("gear_items")
      .select("*")
      .order("category")
      .order("subcategory")
      .order("brand")
      .order("name")
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("❌ Supabase error:", error.message);
      process.exit(1);
    }

    allRows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`   Fetched ${allRows.length} items from Supabase\n`);

  // Read existing file to preserve the header (types, constants, etc.)
  const existing = readFileSync(DB_PATH, "utf-8");

  // Find where the gearDatabase array starts
  const marker = existing.match(/export\s+const\s+gearDatabase\s*:\s*GearItem\[\]\s*=\s*\[/);
  if (!marker) {
    console.error("❌ Could not find gearDatabase export in gear-database.ts");
    process.exit(1);
  }

  const header = existing.slice(0, marker.index);

  // Map and serialize all items
  const items = allRows.map(mapRow);
  const serialized = items.map(serializeItem).join(",\n");

  // Write the full file
  const output = `${header}export const gearDatabase: GearItem[] = [\n${serialized},\n];\n`;
  writeFileSync(DB_PATH, output);

  console.log(`✅ Wrote ${items.length} items to ${DB_PATH}`);
  console.log(`   File size: ${(Buffer.byteLength(output) / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
