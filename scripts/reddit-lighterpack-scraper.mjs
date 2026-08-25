/**
 * Reddit LighterPack Scraper
 *
 * Pulls r/Ultralight posts from the past year via Arctic Shift (no auth needed),
 * extracts LighterPack URLs, parses each pack via HTML, aggregates items by frequency,
 * deduplicates against existing gear_items, and inserts gaps into gear_candidates.
 *
 * Usage: node scripts/reddit-lighterpack-scraper.mjs [--dry-run]
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = process.argv.includes("--dry-run");
const MIN_FREQUENCY = 3;

// ============================================
// Step 1: Pull posts from Arctic Shift
// ============================================

async function fetchPosts() {
  const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
  let allPosts = [];
  let after = oneYearAgo;
  let page = 0;

  console.log("Fetching r/Ultralight posts from Arctic Shift...");

  while (true) {
    const url = `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=Ultralight&query=lighterpack&after=${after}&limit=100&sort=asc&fields=id,selftext,created_utc,title`;
    const res = await fetch(url);
    if (!res.ok) { console.error(`Arctic Shift error: ${res.status}`); break; }

    const data = await res.json();
    const posts = data.data || [];
    if (posts.length === 0) break;

    allPosts.push(...posts);
    after = posts[posts.length - 1].created_utc + 1;
    page++;
    console.log(`  Page ${page}: ${posts.length} posts (total: ${allPosts.length})`);
    await sleep(1000);
    if (posts.length < 100) break;
  }

  console.log(`Found ${allPosts.length} posts\n`);
  return allPosts;
}

// ============================================
// Step 2: Extract LighterPack URLs
// ============================================

function extractLighterPackIds(posts) {
  const ids = new Set();
  const regex = /lighterpack\.com\/r\/([a-z0-9]+)/gi;
  for (const post of posts) {
    const text = (post.selftext || "") + " " + (post.title || "");
    let match;
    while ((match = regex.exec(text)) !== null) ids.add(match[1]);
  }
  console.log(`Extracted ${ids.size} unique LighterPack IDs\n`);
  return [...ids];
}

// ============================================
// Step 3: Parse each LighterPack (HTML)
// ============================================

async function parseLighterPack(shareId) {
  try {
    const res = await fetch(`https://lighterpack.com/r/${shareId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const items = [];
    const itemBlocks = html.split(/class="lpItem\s+/);
    itemBlocks.shift();

    for (const block of itemBlocks) {
      const nameMatch = block.match(/class="lpName">\s*([\s\S]*?)\s*<\/span>/);
      if (!nameMatch) continue;
      const name = nameMatch[1].trim();
      if (!name || name.length < 2) continue;

      const weightMatch = block.match(/class="lpWeight">([\d.]+)<\/span>/);
      if (!weightMatch) continue;
      const weight = parseFloat(weightMatch[1]);
      if (!weight || weight <= 0) continue;

      const unitMatch = block.match(/selected>(\w+)<\/option>/);
      const unit = unitMatch ? unitMatch[1].toLowerCase() : "oz";

      let weightOz = weight;
      if (unit === "g") weightOz = weight / 28.3495;
      if (unit === "kg") weightOz = (weight * 1000) / 28.3495;
      if (unit === "lb") weightOz = weight * 16;

      items.push({ name, category: "", weightOz: Math.round(weightOz * 100) / 100 });
    }
    return items.length > 0 ? items : null;
  } catch { return null; }
}

async function parseAllPacks(ids) {
  console.log(`Parsing ${ids.length} LighterPack lists...`);
  const allPacks = [];
  let success = 0, failed = 0;

  for (let i = 0; i < ids.length; i++) {
    const items = await parseLighterPack(ids[i]);
    if (items && items.length > 0) { allPacks.push({ packId: ids[i], items }); success++; }
    else { failed++; }
    if ((i + 1) % 50 === 0) console.log(`  Progress: ${i + 1}/${ids.length} (${success} ok, ${failed} failed)`);
    await sleep(300);
  }
  console.log(`Parsed ${success} packs, ${failed} failed\n`);
  return allPacks;
}

// ============================================
// Step 4: Aggregate items by frequency
// ============================================

function aggregateItems(packs) {
  const itemMap = new Map();
  for (const pack of packs) {
    const seenInPack = new Set();
    for (const item of pack.items) {
      const { brand, productName } = splitBrandName(item.name);
      if (!productName || productName.length < 3) continue;
      const key = `${brand.toLowerCase()}|${productName.toLowerCase()}`;
      if (seenInPack.has(key)) continue;
      seenInPack.add(key);
      if (!itemMap.has(key)) itemMap.set(key, { brand, name: productName, weights: [], count: 0 });
      const entry = itemMap.get(key);
      entry.count++;
      entry.weights.push(item.weightOz);
    }
  }

  const results = [];
  for (const [, entry] of itemMap) {
    if (entry.count < MIN_FREQUENCY) continue;
    entry.weights.sort((a, b) => a - b);
    const medianWeight = entry.weights[Math.floor(entry.weights.length / 2)];
    results.push({ brand: entry.brand, name: entry.name, weightOz: Math.round(medianWeight * 10) / 10, category: "accessories", frequency: entry.count });
  }
  results.sort((a, b) => b.frequency - a.frequency);

  console.log(`Aggregated to ${results.length} unique items (in ${MIN_FREQUENCY}+ packs)\n`);
  console.log("Top 20 most common:");
  results.slice(0, 20).forEach((item, i) => console.log(`  ${i + 1}. ${item.brand} ${item.name} - ${item.weightOz}oz (${item.frequency} packs)`));
  console.log("");
  return results;
}

// ============================================
// Step 5: Deduplicate against existing DB
// ============================================

async function deduplicateAgainstDB(items) {
  console.log("Checking for duplicates against existing gear_items...");
  let existingItems = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.from("gear_items").select("id, brand, name").range(offset, offset + 999);
    if (!data || data.length === 0) break;
    existingItems.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`  ${existingItems.length} existing items loaded`);

  let existingCandidates = [];
  offset = 0;
  while (true) {
    const { data } = await supabase.from("gear_candidates").select("brand, name").range(offset, offset + 999);
    if (!data || data.length === 0) break;
    existingCandidates.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`  ${existingCandidates.length} existing candidates loaded`);

  const existingNorm = new Map();
  existingItems.forEach((item) => existingNorm.set(normalize(`${item.brand} ${item.name}`), item.id));
  const candidateNorm = new Set();
  existingCandidates.forEach((c) => candidateNorm.add(normalize(`${c.brand} ${c.name}`)));

  const newItems = [];
  let dupeCount = 0, candDupeCount = 0, unknownCount = 0;

  for (const item of items) {
    // Skip items without a real brand
    if (item.brand === "Unknown") { unknownCount++; continue; }
    // Skip low-value categories — focus on the Big 3 + kitchen + safety gear
    const skipCats = ["clothing", "electronics", "accessories"];
    if (skipCats.includes(item.category)) { unknownCount++; continue; }
    // Skip generic items that aren't real products
    const skipNames = ["toothbrush", "toothpaste", "soap", "sunscreen", "lighter", "phone", "socks", "underwear", "shorts", "hat", "gloves", "buff", "shoes", "shirt", "pants", "fleece", "trowel", "spoon", "water"];
    if (skipNames.some(s => item.name.toLowerCase().includes(s))) { unknownCount++; continue; }
    const norm = normalize(`${item.brand} ${item.name}`);
    if (existingNorm.has(norm)) { dupeCount++; continue; }
    let fuzzy = false;
    for (const [key] of existingNorm) { if (similarity(norm, key) > 0.85) { fuzzy = true; break; } }
    if (fuzzy) { dupeCount++; continue; }
    if (candidateNorm.has(norm)) { candDupeCount++; continue; }
    newItems.push(item);
  }

  console.log(`  ${unknownCount} skipped (no brand), ${dupeCount} matched DB, ${candDupeCount} already candidates, ${newItems.length} new\n`);
  return newItems;
}

// ============================================
// Step 6: Insert into gear_candidates
// ============================================

async function insertCandidates(items) {
  if (items.length === 0) { console.log("Nothing to insert."); return; }
  if (DRY_RUN) {
    console.log(`DRY RUN - would insert ${items.length} candidates:`);
    items.slice(0, 30).forEach((item) => console.log(`  ${item.brand} ${item.name} | ${item.weightOz}oz | freq: ${item.frequency}`));
    return;
  }

  console.log(`Inserting ${items.length} candidates...`);
  let inserted = 0;
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50).map((item) => ({
      name: item.name, brand: item.brand, category: item.category,
      weight_oz: item.weightOz, price_usd: 0, tier: "mid", status: "pending",
      description: `Found in ${item.frequency} r/Ultralight packs (last 12 months)`,
      source_url: "https://reddit.com/r/Ultralight", frequency: item.frequency,
    }));
    const { error } = await supabase.from("gear_candidates").upsert(batch, { onConflict: "brand,name", ignoreDuplicates: true });
    if (error) console.error(`  Batch error: ${error.message}`);
    else inserted += batch.length;
  }
  console.log(`Inserted ${inserted} candidates\n`);
}

// ============================================
// Utilities
// ============================================

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const KNOWN_BRANDS = [
  "Zpacks", "Tarptent", "Durston", "Gossamer Gear", "Six Moon Designs",
  "Nemo", "Big Agnes", "MSR", "ULA", "Osprey", "Gregory", "HMG",
  "Hyperlite Mountain Gear", "Pa'lante", "Atom Packs", "Nashville Packs",
  "Enlightened Equipment", "UGQ", "Katabatic", "Nunatak", "Western Mountaineering",
  "Sea to Summit", "Therm-a-Rest", "Thermarest", "Exped", "Flextail",
  "REI", "REI Co-op", "Montbell", "Patagonia", "Arc'teryx", "Outdoor Research",
  "Frogg Toggs", "Rab", "Mountain Hardwear", "Cumulus",
  "Cascade Mountain Tech", "CMT", "Leki", "Black Diamond",
  "Sawyer", "Katadyn", "Platypus", "CNOC",
  "Jetboil", "Soto", "BRS", "Toaks", "Evernew", "Snow Peak", "Esbit",
  "Nitecore", "Petzl", "BioLite", "Anker", "Garmin", "COROS",
  "Hammock Gear", "Warbonnet", "Dutchware", "Hennessy",
  "3F UL", "Naturehike", "Aegismax", "Granite Gear", "MLD",
  "Borah Gear", "Timmermade", "Darn Tough", "Injinji", "Smartwool",
  "Altra", "Hoka", "La Sportiva", "Topo", "Leatherman",
  "SWD", "KS Ultralight", "Waymark", "Paria", "Trail Designs", "Fire Maple",
  "Senchi", "Farpointe", "Melanzana", "Kelty", "Nylofume",
  "SlingFin", "SMD", "Drop", "Dan Durston", "Durston Gear",
  "Ursack", "BearVault", "Bearikade",
];

function splitBrandName(fullName) {
  if (!fullName) return { brand: "Unknown", productName: "" };
  const sorted = [...KNOWN_BRANDS].sort((a, b) => b.length - a.length);
  for (const brand of sorted) {
    if (fullName.toLowerCase().startsWith(brand.toLowerCase())) {
      const rest = fullName.slice(brand.length).trim().replace(/^[-\u2013\u2014]/, "").trim();
      if (rest.length > 0) return { brand, productName: rest };
    }
  }
  const parts = fullName.split(/\s+/);
  if (parts.length >= 2 && parts[0][0] === parts[0][0].toUpperCase()) {
    return { brand: parts[0], productName: parts.slice(1).join(" ") };
  }
  return { brand: "Unknown", productName: fullName };
}

function normalize(str) {
  return str.toLowerCase().replace(/['']/g, "").replace(/\(.*?\)/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function similarity(a, b) {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  return (longer.length - levenshtein(longer, shorter)) / longer.length;
}

function levenshtein(a, b) {
  const m = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      m[i][j] = b[i - 1] === a[j - 1] ? m[i - 1][j - 1] : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
  return m[b.length][a.length];
}

// ============================================
// Main
// ============================================

async function main() {
  console.log("HikeMind Reddit LighterPack Scraper");
  console.log("====================================\n");
  if (DRY_RUN) console.log("DRY RUN MODE - no database writes\n");

  const posts = await fetchPosts();
  if (posts.length === 0) return;

  const lpIds = extractLighterPackIds(posts);
  if (lpIds.length === 0) return;

  const packs = await parseAllPacks(lpIds);
  if (packs.length === 0) return;

  const aggregated = aggregateItems(packs);
  if (aggregated.length === 0) return;

  const newItems = await deduplicateAgainstDB(aggregated);
  await insertCandidates(newItems);

  console.log("Done!");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
