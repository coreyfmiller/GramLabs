/**
 * HikeMind Database Enrichment Script
 * 
 * Goes through every item in the gear database, uses Gemini AI to:
 * 1. Fill missing specs (R-value, temp rating, capacity, fill power, fabric, etc.)
 * 2. Verify weight and price accuracy
 * 3. Flag items that need attention
 * 
 * Usage:
 *   node scripts/enrich-database.mjs                    # Run full enrichment
 *   node scripts/enrich-database.mjs --category shelter # Run on one category
 *   node scripts/enrich-database.mjs --dry-run          # Preview without updating DB
 *   node scripts/enrich-database.mjs --report-only      # Just generate gap report
 * 
 * Requires: GEMINI_API_KEY env var (or reads from .env.local)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env from .env.local
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
} catch { /* ignore */ }

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars. Need GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Columns that actually exist in the Supabase gear_items table right now.
// The script will only write specs that match these — prevents "column not found" errors.
// UPDATE THIS SET after running add-all-columns.sql in Supabase Dashboard.
const DB_COLUMNS = new Set([
  'id', 'name', 'brand', 'category', 'subcategory', 'tier', 'weight_oz', 'price_usd',
  'description', 'url', 'shelter_type', 'capacity', 'seasons', 'temp_rating', 'fill_type',
  'sleep_style', 'r_value', 'thickness', 'pad_width', 'pad_length', 'volume', 'fuel_type',
  'lumens', 'pole_material', 'created_at', 'fts', 'youtube_video_ids',
  // Added via add-columns.mjs (first batch — confirmed present):
  'fill_power', 'waterproof', 'fill_weight', 'fabric', 'fabric_denier', 'setup_type',
  'peak_height', 'floor_area', 'frame_type', 'hip_belt', 'battery_type', 'runtime',
  'hood_type', 'packed_size',
  // Added via add-all-columns.sql (second batch — NOW ACTIVE):
  'boil_time', 'igniter', 'pot_included', 'simmer_control',
  'heel_drop', 'stack_height', 'toe_box_width',
  'waterproof_rating', 'breathability', 'fabric_tech', 'pit_zips', 'seam_sealed',
  'collapsed_length', 'lock_type', 'grip_material', 'pole_sections',
  'max_carry_weight', 'frame_material', 'pack_fabric', 'torso_range', 'water_bottle_access',
  'charge_method', 'red_light', 'ipx_rating',
  'stakes_needed', 'doors', 'vestibule_area',
  'sleep_width', 'sleep_length', 'pad_attachment', 'en_tested', 'pad_packed_size', 'pad_shape', 'inflation_method',
  'pockets', 'packable',
  'community_rating', 'pct_usage_percent', 'pairs_per_thru',
]);

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const REPORT_ONLY = args.includes('--report-only');
const categoryFilter = args.find(a => a.startsWith('--category='))?.split('=')[1] 
  || (args.includes('--category') ? args[args.indexOf('--category') + 1] : null);

// Rate limiting
const BATCH_SIZE = 5; // Items per Gemini call — small enough for careful attention per item
const DELAY_MS = 500; // Minimal delay between waves
const CONCURRENT = 5; // Fire 5 batches in parallel (independent calls, no accuracy cost)

// Stats
const stats = {
  total: 0,
  enriched: 0,
  flagged: 0,
  skipped: 0,
  errors: 0,
  updates: [],
  flags: [],
};

// === SPEC REQUIREMENTS BY CATEGORY ===
// EXPANDED: Every field that a serious compare page needs, per category/subcategory.
const REQUIRED_SPECS = {
  shelter: [
    'shelter_type', 'capacity', 'seasons', 'setup_type',
    'floor_area', 'peak_height', 'packed_size',
    'fabric', 'fabric_denier', 'stakes_needed', 'doors', 'vestibule_area',
  ],
  sleep: {
    quilt: [
      'temp_rating', 'fill_type', 'fill_power', 'fill_weight',
      'sleep_style', 'sleep_width', 'sleep_length', 'pad_attachment', 'en_tested',
    ],
    'sleeping-bag': [
      'temp_rating', 'fill_type', 'fill_power', 'fill_weight',
      'sleep_style', 'sleep_width', 'sleep_length', 'en_tested',
    ],
    'pad-inflatable': [
      'r_value', 'thickness', 'pad_width', 'pad_length',
      'pad_packed_size', 'pad_shape', 'inflation_method',
    ],
    'pad-foam': [
      'r_value', 'thickness', 'pad_width', 'pad_length', 'pad_shape',
    ],
    underquilt: ['temp_rating', 'fill_type', 'fill_power', 'fill_weight'],
    pillow: [],
    liner: ['temp_rating'],
  },
  pack: [
    'volume', 'frame_type', 'hip_belt', 'fabric', 'fabric_denier',
    'max_carry_weight', 'frame_material', 'pack_fabric', 'torso_range', 'water_bottle_access',
  ],
  kitchen: {
    stove: ['fuel_type', 'boil_time', 'igniter', 'pot_included', 'simmer_control'],
    cookware: [],
    'water-filter': [],
    'water-storage': [],
    food: [],
    default: [],
  },
  electronics: {
    headlamp: ['lumens', 'battery_type', 'runtime', 'charge_method', 'red_light', 'ipx_rating'],
    power: ['battery_type', 'charge_method'],
    satellite: ['battery_type', 'charge_method'],
    'gps-watch': ['battery_type', 'charge_method'],
    solar: [],
    camera: [],
    'nav-app': [],
    default: [],
  },
  accessories: {
    'trekking-poles': [
      'pole_material', 'collapsed_length', 'lock_type', 'grip_material', 'pole_sections',
    ],
    'rain-gear': [
      'waterproof', 'waterproof_rating', 'breathability', 'fabric_tech',
      'pit_zips', 'seam_sealed',
    ],
    insulation: ['fill_type', 'fill_power', 'hood_type', 'pockets', 'packable'],
    socks: [],
    'camp-comfort': [],
    'hammock-suspension': [],
    hygiene: [],
    'stuff-sacks': [],
    'sun-protection': [],
    default: [],
  },
  clothing: {
    'rain-shell': [
      'waterproof', 'waterproof_rating', 'breathability', 'fabric_tech',
      'pit_zips', 'seam_sealed', 'hood_type', 'pockets', 'packable',
    ],
    'wind-shell': ['hood_type', 'pockets', 'packable'],
    'puffy': ['fill_type', 'fill_power', 'fill_weight', 'hood_type', 'pockets', 'packable'],
    fleece: ['hood_type', 'pockets'],
    'base-layer': ['fabric'],
    default: ['hood_type'],
  },
  safety: {
    default: [],
  },
  shoes: {
    default: ['heel_drop', 'stack_height', 'toe_box_width'],
  },
};

function getRequiredSpecs(item) {
  const catSpecs = REQUIRED_SPECS[item.category];
  if (!catSpecs) return [];
  if (Array.isArray(catSpecs)) return catSpecs;
  return catSpecs[item.subcategory] || catSpecs.default || [];
}

function getMissingSpecs(item) {
  const required = getRequiredSpecs(item);
  // Only report specs as "missing" if the column actually exists in the DB
  return required.filter(spec => DB_COLUMNS.has(spec) && (item[spec] === null || item[spec] === undefined));
}

// For the Gemini prompt — ask about ALL missing specs (including future columns)
function getAllMissingSpecs(item) {
  const required = getRequiredSpecs(item);
  return required.filter(spec => item[spec] === null || item[spec] === undefined);
}

// === GEMINI API ===
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gemini API error: ${err.error?.message || res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// === ENRICHMENT LOGIC ===

// Spec definition blocks — only sent when relevant to the batch
const SPEC_DEFS = {
  shelter: `=== SHELTER ===
- shelter_type: one of "trekking-pole-tent", "freestanding-tent", "tarp", "tarp-system", "hammock", "bivy", "pyramid"
- capacity: number of persons (1, 2, 3, 4)
- seasons: "3", "3+", or "4"
- setup_type: one of "freestanding", "semi-freestanding", "non-freestanding", "tarp"
- floor_area: interior floor area in square feet (number, e.g. 28.5)
- peak_height: interior peak height in inches (number, e.g. 42)
- packed_size: packed dimensions as text (e.g. "4x16 in" or "5x18 in")
- fabric: primary fabric (e.g. "DCF", "15D Silnylon", "20D Silpoly", "10D Nylon")
- fabric_denier: denier number (e.g. 7, 10, 15, 20, 30)
- stakes_needed: number of stakes required for full pitch (integer)
- doors: number of doors (1 or 2)
- vestibule_area: total vestibule area in sq ft (number, sum both sides if 2)`,

  sleep_quilt: `=== SLEEP SYSTEM (quilts/bags) ===
- temp_rating: comfort temperature rating in °F (number, e.g. 20)
- fill_type: "goose-down", "duck-down", "synthetic", or "none"
- fill_power: fill power number (800, 850, 900, 950, etc.)
- fill_weight: ounces of fill material (number, e.g. 14.5)
- sleep_style: "quilt", "mummy", "semi-rectangular", or "rectangular"
- sleep_width: "narrow", "regular", "wide", or "x-wide"
- sleep_length: "short", "regular", or "long" (use "regular" for standard sizes)
- pad_attachment: true/false — does it have pad attachment straps/system
- en_tested: true/false — has EN/ISO comfort temp testing certification`,

  sleep_pad: `=== SLEEP SYSTEM (pads) ===
- r_value: R-value number (e.g. 4.2, 5.6, 2.1)
- thickness: thickness in inches (e.g. 2.5, 3.0, 0.75)
- pad_width: width in inches (e.g. 20, 25)
- pad_length: length in inches (e.g. 72, 66, 47)
- pad_packed_size: packed dimensions as text (e.g. "4x9 in" or "3.5x8 in")
- pad_shape: "mummy", "rectangular", "wide", or "tapered"
- inflation_method: "breath", "pump", "self-inflating", or "none" (none = foam)`,

  pack: `=== PACKS ===
- volume: total volume in liters (number)
- frame_type: "framed", "frameless", "removable", or "stays"
- hip_belt: "integrated", "removable", or "none"
- max_carry_weight: recommended max load in lbs (number, e.g. 25, 30)
- frame_material: "aluminum", "carbon", "HDPE", "none", or specific material
- pack_fabric: primary body fabric (e.g. "DCF", "Robic 210D", "X-Pac VX21", "Ultra 200")
- torso_range: torso fit range as text (e.g. "16-21 in" or "one-size")
- water_bottle_access: "side", "shoulder", "both", or "none"
- fabric: same as pack_fabric (use pack_fabric field instead)
- fabric_denier: denier of primary body fabric (number)`,

  kitchen: `=== STOVES / KITCHEN ===
- fuel_type: "canister", "alcohol", "solid", "wood", or "none"
- boil_time: minutes to boil 1L water (number, e.g. 3.5, 4.2)
- igniter: true/false — has built-in piezo igniter
- pot_included: true/false — pot/cup included with stove
- simmer_control: true/false — has adjustable flame`,

  electronics: `=== HEADLAMPS / ELECTRONICS ===
- lumens: max lumens output (number)
- battery_type: "rechargeable", "AAA", "AA", or "CR2032"
- runtime: hours on max brightness (number)
- charge_method: "usb-c", "micro-usb", or "none"
- red_light: true/false — has red light mode
- ipx_rating: IPX waterproof rating number (4, 5, 6, 7, or 8)`,

  trekking_poles: `=== TREKKING POLES ===
- pole_material: "carbon" or "aluminum"
- collapsed_length: collapsed length in inches (number)
- lock_type: "flicklock", "twist", "z-fold", or "lever"
- grip_material: "cork", "foam", or "rubber"
- pole_sections: number of sections (2 or 3, or use 3 for z-fold)`,

  clothing: `=== CLOTHING / SHELLS / RAIN ===
- waterproof: true or false
- waterproof_rating: hydrostatic head in mm (number, e.g. 10000, 20000)
- breathability: MVTR in g/m²/24hr (number, e.g. 15000, 25000)
- fabric_tech: membrane/technology name (e.g. "GORE-TEX", "Pertex Shield", "eVent", "Shakedry")
- pit_zips: true/false
- seam_sealed: true/false
- hood_type: "hooded" or "hoodless"
- pockets: number of pockets (integer)
- packable: true/false — stuffs into own pocket or included stuff sack`,

  insulation: `=== INSULATED CLOTHING ===
- fill_type: "goose-down", "duck-down", "synthetic", or "none"
- fill_power: fill power number (if down)
- fill_weight: ounces of fill (number)
- hood_type: "hooded" or "hoodless"
- pockets: number of pockets (integer)
- packable: true/false`,

  shoes: `=== SHOES ===
- heel_drop: heel-to-toe drop in mm (number, e.g. 4, 6, 8)
- stack_height: stack height in mm (number, e.g. 25, 30, 33)
- toe_box_width: "narrow", "standard", "wide", or "extra-wide"`,
};

// Map item category/subcategory to which spec blocks are relevant
function getRelevantSpecDefs(items) {
  const needed = new Set();
  for (const item of items) {
    const cat = item.category;
    const sub = item.subcategory || '';
    if (cat === 'shelter') needed.add('shelter');
    else if (cat === 'sleep' && (sub.includes('pad') || sub === 'pad-inflatable' || sub === 'pad-foam')) needed.add('sleep_pad');
    else if (cat === 'sleep') needed.add('sleep_quilt');
    else if (cat === 'pack') needed.add('pack');
    else if (cat === 'kitchen') needed.add('kitchen');
    else if (cat === 'electronics') needed.add('electronics');
    else if (cat === 'accessories' && sub === 'trekking-poles') needed.add('trekking_poles');
    else if (cat === 'accessories' && sub === 'rain-gear') needed.add('clothing');
    else if (cat === 'accessories' && sub === 'insulation') needed.add('insulation');
    else if (cat === 'clothing') needed.add('clothing');
    else if (cat === 'shoes') needed.add('shoes');
  }
  return [...needed].map(k => SPEC_DEFS[k]).join('\n\n');
}

async function enrichBatch(items) {
  const itemDescriptions = items.map((item, i) => {
    const missing = getAllMissingSpecs(item);
    return `${i + 1}. ${item.brand} ${item.name} | category: ${item.category} | subcategory: ${item.subcategory || 'none'} | current weight: ${item.weight_oz}oz | current price: $${item.price_usd} | missing specs: [${missing.join(', ')}]`;
  }).join('\n');

  const specDefs = getRelevantSpecDefs(items);

  const prompt = `You are a backpacking gear expert. For each item, fill in the missing specs using manufacturer data. Be precise — if you're not confident about a value, omit it.

ITEMS:
${itemDescriptions}

SPEC FORMATS:
${specDefs}

Also verify weight (oz) and price (USD) for 2024-2026. Flag if >15% weight error or >25% price error.

Respond with ONLY a valid JSON array (no markdown fences):
[{"index":1,"specs":{"r_value":4.2},"weight_correct":true,"price_correct":true,"suggested_weight":null,"suggested_price":null,"discontinued":false,"notes":""}]

Rules: Only include specs you're >80% confident about. Use true/false for booleans, raw numbers for numbers. Return an entry for EVERY item.`;

  const response = await callGemini(prompt);
  const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse Gemini response:', jsonStr.slice(0, 200));
    return null;
  }
}

// === MAIN ===
async function main() {
  console.log('🔍 HikeMind Database Enrichment');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : REPORT_ONLY ? 'REPORT ONLY' : 'LIVE UPDATE'}`);
  if (categoryFilter) console.log(`   Category: ${categoryFilter}`);
  console.log('');

  // Fetch all items
  let query = supabase.from('gear_items').select('*').order('category').order('subcategory').order('brand');
  if (categoryFilter) query = query.eq('category', categoryFilter);
  
  const { data: items, error } = await query;
  if (error || !items) {
    console.error('Failed to fetch items:', error?.message);
    process.exit(1);
  }

  stats.total = items.length;
  console.log(`📦 Loaded ${items.length} items\n`);

  // Filter to items that need enrichment
  const needsWork = items.filter(item => {
    const missing = getMissingSpecs(item);
    return missing.length > 0;
  });

  console.log(`🔧 ${needsWork.length} items need spec enrichment`);
  console.log(`✅ ${items.length - needsWork.length} items already complete\n`);

  if (REPORT_ONLY) {
    // Just output the gap report
    const byCat = {};
    needsWork.forEach(item => {
      const key = `${item.category}/${item.subcategory || 'general'}`;
      if (!byCat[key]) byCat[key] = [];
      byCat[key].push({ name: `${item.brand} ${item.name}`, missing: getMissingSpecs(item) });
    });

    console.log('📊 GAP REPORT:');
    Object.entries(byCat).sort().forEach(([cat, items]) => {
      console.log(`\n  ${cat} (${items.length} items):`);
      items.slice(0, 10).forEach(item => {
        console.log(`    - ${item.name}: [${item.missing.join(', ')}]`);
      });
      if (items.length > 10) console.log(`    ... and ${items.length - 10} more`);
    });
    return;
  }

  // Process in batches
  const batches = [];
  for (let i = 0; i < needsWork.length; i += BATCH_SIZE) {
    batches.push(needsWork.slice(i, i + BATCH_SIZE));
  }

  console.log(`🚀 Processing ${batches.length} batches (${BATCH_SIZE} items each, ${CONCURRENT} concurrent)\n`);

  // Process batches in parallel waves
  for (let waveStart = 0; waveStart < batches.length; waveStart += CONCURRENT) {
    const wave = batches.slice(waveStart, waveStart + CONCURRENT);
    const wavePromises = wave.map(async (batch, waveIdx) => {
      const batchIdx = waveStart + waveIdx;
      const progress = `[${batchIdx + 1}/${batches.length}]`;

      try {
        const results = await enrichBatch(batch);
        
        if (!results) {
          process.stdout.write(`${progress} ❌ parse `);
          stats.errors++;
          return;
        }

        for (const result of results) {
          const item = batch[result.index - 1];
          if (!item) continue;

          const updates = {};
          let hasUpdate = false;

          // Apply spec fills — only include columns that exist in the DB
          if (result.specs && Object.keys(result.specs).length > 0) {
            for (const [key, value] of Object.entries(result.specs)) {
              if (value !== null && value !== undefined && DB_COLUMNS.has(key)) {
                updates[key] = value;
                hasUpdate = true;
              }
            }
          }

          // Flag weight/price issues
          if (!result.weight_correct && result.suggested_weight) {
            stats.flags.push({
              item: `${item.brand} ${item.name}`,
              issue: `Weight may be wrong: current ${item.weight_oz}oz, suggested ${result.suggested_weight}oz`,
            });
            stats.flagged++;
          }

          if (!result.price_correct && result.suggested_price) {
            stats.flags.push({
              item: `${item.brand} ${item.name}`,
              issue: `Price may be wrong: current $${item.price_usd}, suggested $${result.suggested_price}`,
            });
            stats.flagged++;
          }

          if (result.discontinued) {
            stats.flags.push({
              item: `${item.brand} ${item.name}`,
              issue: 'May be discontinued',
            });
            stats.flagged++;
          }

          // Update database
          if (hasUpdate && !DRY_RUN) {
            const { error: updateError } = await supabase
              .from('gear_items')
              .update(updates)
              .eq('id', item.id);

            if (updateError) {
              stats.errors++;
            } else {
              stats.enriched++;
              stats.updates.push({ item: `${item.brand} ${item.name}`, specs: updates });
            }
          } else if (hasUpdate && DRY_RUN) {
            stats.enriched++;
            stats.updates.push({ item: `${item.brand} ${item.name}`, specs: updates });
          } else {
            stats.skipped++;
          }
        }

        process.stdout.write(`${progress} ✅ `);
      } catch (e) {
        process.stdout.write(`${progress} ❌ `);
        stats.errors++;
      }
    });

    await Promise.all(wavePromises);
    
    // Minimal delay between waves to stay under rate limits
    if (waveStart + CONCURRENT < batches.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  console.log('');

  // === OUTPUT REPORT ===
  console.log('\n' + '='.repeat(60));
  console.log('📊 ENRICHMENT REPORT');
  console.log('='.repeat(60));
  console.log(`Total items:     ${stats.total}`);
  console.log(`Enriched:        ${stats.enriched}`);
  console.log(`Flagged:         ${stats.flagged}`);
  console.log(`Skipped (no AI): ${stats.skipped}`);
  console.log(`Errors:          ${stats.errors}`);
  console.log(`Mode:            ${DRY_RUN ? 'DRY RUN (no DB changes)' : 'LIVE'}`);

  if (stats.updates.length > 0) {
    console.log(`\n📝 SPECS FILLED (${stats.updates.length}):`);
    stats.updates.forEach(u => {
      console.log(`  ✅ ${u.item}: ${JSON.stringify(u.specs)}`);
    });
  }

  if (stats.flags.length > 0) {
    console.log(`\n⚠️  FLAGS (${stats.flags.length}):`);
    stats.flags.forEach(f => {
      console.log(`  🚩 ${f.item}: ${f.issue}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
