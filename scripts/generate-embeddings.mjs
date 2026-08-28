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
  // Records now live in gear-database.json (gear-database.ts is a typed wrapper).
  const jsonPath = DB_PATH.replace(/\.ts$/, ".json");
  return JSON.parse(readFileSync(jsonPath, "utf-8"));
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
    const body = JSON.stringify({
      requests: batch.map((text) => ({
        model: `models/${MODEL}`,
        content: { parts: [{ text }] },
        // 768-dim keeps the JSON ~4x smaller (deployable) with no meaningful
        // retrieval-quality loss. MUST match embedQuery() in src/lib/gear-embeddings.ts.
        outputDimensionality: 768,
      })),
    });

    // Retry with backoff, honoring 429 retryDelay (paid tier: 3000 embed reqs/min).
    let data = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) { data = await res.json(); break; }

      const errText = await res.text();
      if (res.status === 429) {
        // Parse suggested retry delay; default to 45s, add small buffer.
        let waitMs = 45000;
        const m = errText.match(/retry in ([\d.]+)s|"retryDelay":\s*"([\d.]+)s"/);
        if (m) waitMs = Math.ceil(parseFloat(m[1] || m[2]) * 1000) + 2000;
        process.stdout.write(` [429, waiting ${Math.round(waitMs / 1000)}s]`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      console.error(`\n❌ Embedding API error: ${res.status} ${errText}`);
      process.exit(1);
    }

    if (!data) {
      console.error(`\n❌ Batch ${batchNum} failed after retries (rate limit).`);
      process.exit(1);
    }

    allEmbeddings.push(...data.embeddings.map((e) => e.values));
    console.log(" ✓");

    // Pace to stay under the per-minute quota (~100 items/batch).
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 1500));
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
