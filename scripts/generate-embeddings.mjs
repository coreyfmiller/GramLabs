/**
 * Generate Gear Embeddings
 *
 * Pre-computes embeddings for all gear items using Gemini's embedding API
 * and writes them to src/data/gear-embeddings.json for use at runtime.
 *
 * Run via: npm run generate-embeddings
 * Requires: GEMINI_API_KEY env var
 *
 * Re-run this script whenever the gear database changes.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-embedding-001";
const BATCH_SIZE = 100;

const OUTPUT_PATH = resolve(__dirname, "../src/data/gear-embeddings.json");
const DB_PATH = resolve(__dirname, "../src/data/gear-database.ts");

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY not set");
  process.exit(1);
}

// --- Parse gear database (extract the exported array from TS source) ---

function parseGearDatabase() {
  const source = readFileSync(DB_PATH, "utf-8");

  // Find the gearDatabase array start (handle potential line breaks in declaration)
  const startMatch = source.match(/export\s+const\s+gearDatabase\s*:\s*GearItem\[\]\s*=\s*\[/);
  if (!startMatch) {
    console.error("❌ Could not find gearDatabase export in gear-database.ts");
    process.exit(1);
  }

  // Find the opening bracket of the array
  const matchEnd = startMatch.index + startMatch[0].length;
  const arrayStart = matchEnd - 1; // position of the '['

  // Extract the array by tracking bracket depth
  let depth = 0;
  let i = arrayStart;
  for (; i < source.length; i++) {
    if (source[i] === "[") depth++;
    if (source[i] === "]") depth--;
    if (depth === 0) break;
  }

  const arrayStr = source.slice(arrayStart, i + 1);

  // Clean TS-specific syntax for eval: remove type assertions, trailing commas before ]
  const cleaned = arrayStr
    .replace(/\/\/.*$/gm, "") // strip single-line comments
    .replace(/as\s+\w+/g, ""); // strip type assertions

  // Parse with Function constructor (safe — we control the input file)
  const items = new Function(`return ${cleaned}`)();
  return items;
}

// --- Build text representation (mirrors buildItemText in gear-embeddings.ts) ---

const CATEGORY_LABELS = {
  shelter: "Shelter",
  sleep: "Sleep",
  pack: "Pack",
  kitchen: "Kitchen",
  electronics: "Electronics",
  clothing: "Clothing",
  safety: "Safety",
  accessories: "Accessories",
};

function buildItemText(item) {
  const parts = [
    `${item.brand} ${item.name}`,
    CATEGORY_LABELS[item.category] || item.category,
    item.subcategory || "",
    item.tier,
    `${item.weightOz}oz`,
    `$${item.priceUsd}`,
    item.description,
  ];

  if (item.shelterType) parts.push(`shelter type: ${item.shelterType}`);
  if (item.capacity) parts.push(`${item.capacity}-person`);
  if (item.seasons) parts.push(`${item.seasons}-season`);
  if (item.setupType) parts.push(item.setupType);
  if (item.fabric) parts.push(item.fabric);

  if (item.tempRating != null) parts.push(`${item.tempRating}°F rating`);
  if (item.fillType) parts.push(item.fillType);
  if (item.fillPower) parts.push(`${item.fillPower} fill power`);
  if (item.rValue != null) parts.push(`R-value ${item.rValue}`);
  if (item.sleepStyle) parts.push(item.sleepStyle);

  if (item.volume) parts.push(`${item.volume}L`);
  if (item.frameType) parts.push(item.frameType);
  if (item.maxCarryWeight) parts.push(`carries ${item.maxCarryWeight}lbs`);

  if (item.waterproof) parts.push("waterproof");
  if (item.fabricTech) parts.push(item.fabricTech);
  if (item.hoodType) parts.push(item.hoodType);

  if (item.fuelType) parts.push(`${item.fuelType} fuel`);

  if (item.lumens) parts.push(`${item.lumens} lumens`);
  if (item.batteryType) parts.push(item.batteryType);

  return parts.filter(Boolean).join(". ");
}

// --- Batch embed via Gemini API ---

async function batchEmbed(texts) {
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} items)...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents?key=${API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: batch.map((text) => ({
          model: `models/${MODEL}`,
          content: { parts: [{ text }] },
        })),
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`\n❌ Embedding API error: ${res.status} ${error}`);
      process.exit(1);
    }

    const data = await res.json();
    allEmbeddings.push(...data.embeddings.map((e) => e.values));
    console.log(" ✓");

    // Small delay to avoid rate limits
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return allEmbeddings;
}

// --- Main ---

async function main() {
  console.log("🔍 Parsing gear database...");
  const items = parseGearDatabase();
  console.log(`   Found ${items.length} gear items\n`);

  console.log("🧠 Generating embeddings...");
  const texts = items.map(buildItemText);
  const embeddings = await batchEmbed(texts);

  console.log(`\n📦 Writing ${OUTPUT_PATH}...`);

  // Store as { id: embedding } map for fast lookup
  const output = {};
  items.forEach((item, idx) => {
    output[item.id] = embeddings[idx];
  });

  writeFileSync(OUTPUT_PATH, JSON.stringify(output));

  const sizeMB = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(2);
  console.log(`   ${Object.keys(output).length} embeddings written (${sizeMB} MB)`);
  console.log("\n✅ Done! Embeddings are ready for runtime use.");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
