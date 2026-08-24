/**
 * Seed the 24 missing must-have items into Supabase.
 * Uses Gemini to get accurate specs for each item.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
} catch { /* ignore */ }

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const MISSING_ITEMS = [
  // Shelters
  { name: 'Stratospire 2', brand: 'Tarptent', category: 'shelter', subcategory: 'trekking-pole-tent' },
  { name: 'Triplex', brand: 'Zpacks', category: 'shelter', subcategory: 'trekking-pole-tent' },
  { name: 'Skyscape Scout', brand: 'Six Moon Designs', category: 'shelter', subcategory: 'trekking-pole-tent' },
  { name: 'Niak 1.5', brand: 'Hilleberg', category: 'shelter', subcategory: 'freestanding-tent' },
  { name: 'Bryce 2P', brand: 'Paria Outdoor Products', category: 'shelter', subcategory: 'freestanding-tent' },
  // Pads
  { name: 'Flyer Self-Inflating Pad', brand: 'NEMO', category: 'sleep', subcategory: 'pad-inflatable' },
  { name: 'Synmat HL Medium', brand: 'Exped', category: 'sleep', subcategory: 'pad-inflatable' },
  // Packs
  { name: 'Aura AG 65', brand: 'Osprey', category: 'pack', subcategory: 'thru-hike' },
  { name: 'Katmai 55', brand: 'Gregory', category: 'pack', subcategory: 'thru-hike' },
  { name: 'Joey', brand: "Pa'lante", category: 'pack', subcategory: 'fast-light' },
  { name: 'KS50', brand: 'KS Ultralight', category: 'pack', subcategory: 'thru-hike' },
  { name: 'KS40', brand: 'KS Ultralight', category: 'pack', subcategory: 'fast-light' },
  // Quilts & Bags
  { name: 'Econ Bandit 20°F', brand: 'UGQ', category: 'sleep', subcategory: 'quilt' },
  { name: 'Arc Alpinist 20°F', brand: 'Nunatak', category: 'sleep', subcategory: 'quilt' },
  { name: '20°F Classic Quilt', brand: 'Zpacks', category: 'sleep', subcategory: 'quilt' },
  { name: 'Hummingbird UL 20°F', brand: 'Feathered Friends', category: 'sleep', subcategory: 'sleeping-bag' },
  { name: 'Swift UL 20°F', brand: 'Feathered Friends', category: 'sleep', subcategory: 'sleeping-bag' },
  { name: 'Igneo 17°F', brand: 'REI Co-op', category: 'sleep', subcategory: 'sleeping-bag' },
  { name: 'Eolus 15°F', brand: 'Hyke & Byke', category: 'sleep', subcategory: 'sleeping-bag' },
  { name: 'Flame Ultralight 25°F', brand: 'Sea to Summit', category: 'sleep', subcategory: 'sleeping-bag' },
  // Stoves
  { name: 'Micro Regulator Stove', brand: 'SOTO', category: 'kitchen', subcategory: 'stove' },
  { name: 'Wing Stove (Titanium)', brand: 'Esbit', category: 'kitchen', subcategory: 'stove' },
  // Water
  { name: 'Hiker Pro', brand: 'Katadyn', category: 'kitchen', subcategory: 'water-filter' },
  { name: 'Peak Series Gravity Filter', brand: 'LifeStraw', category: 'kitchen', subcategory: 'water-filter' },
];

async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 16384 },
      }),
    }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function run() {
  console.log('=== Seeding 24 Missing Must-Have Items ===\n');

  // Process in batches of 8
  for (let i = 0; i < MISSING_ITEMS.length; i += 8) {
    const batch = MISSING_ITEMS.slice(i, i + 8);
    
    const itemList = batch.map((item, idx) =>
      `${idx + 1}. ${item.brand} ${item.name} | category: ${item.category} | subcategory: ${item.subcategory}`
    ).join('\n');

    const prompt = `You are a backpacking gear expert. For each item below, provide accurate specs for insertion into a gear database. Use manufacturer data.

ITEMS:
${itemList}

For EACH item, return these fields:
- weight_oz: weight in ounces (number, trail weight for shelters/packs, fill weight excluded for bags)
- price_usd: current MSRP in USD (number)
- tier: one of "ultra-budget", "budget", "mid", "premium"
- description: one sentence describing the product (max 100 chars)

PLUS category-specific fields:

SHELTER: shelter_type, capacity, seasons, setup_type, floor_area, peak_height, packed_size, fabric, fabric_denier, stakes_needed, doors, vestibule_area
SLEEP (quilt/bag): temp_rating, fill_type, fill_power, fill_weight, sleep_style
SLEEP (pad): r_value, thickness, pad_width, pad_length
PACK: volume, frame_type, hip_belt, max_carry_weight, frame_material, pack_fabric
KITCHEN (stove): fuel_type, boil_time, igniter, pot_included, simmer_control
KITCHEN (water-filter): (just weight, price, description)

Respond with ONLY a valid JSON array. No markdown fences:
[{"index":1,"weight_oz":26,"price_usd":349,"tier":"premium","description":"2-person double-wall trekking pole tent","shelter_type":"trekking-pole-tent","capacity":2,"seasons":"3","setup_type":"non-freestanding","floor_area":30,"peak_height":44,"packed_size":"5x18 in","fabric":"20D Silpoly","fabric_denier":20,"stakes_needed":8,"doors":2,"vestibule_area":16}]

Only include specs you're >80% confident about. Omit unknowns.`;

    console.log(`Processing batch ${Math.floor(i/8) + 1}/3...`);
    
    const response = await callGemini(prompt);
    const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let results;
    try {
      results = JSON.parse(jsonStr);
    } catch (e) {
      console.error('  ❌ Parse error:', jsonStr.slice(0, 200));
      continue;
    }

    for (const result of results) {
      const item = batch[result.index - 1];
      if (!item) continue;

      // Build the insert object
      const id = (item.brand + '-' + item.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);

      const insert = {
        id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        subcategory: item.subcategory,
        weight_oz: result.weight_oz,
        price_usd: result.price_usd,
        tier: result.tier,
        description: result.description,
      };

      // Add category-specific fields
      const specFields = [
        'shelter_type', 'capacity', 'seasons', 'setup_type', 'floor_area',
        'peak_height', 'packed_size', 'fabric', 'fabric_denier', 'stakes_needed',
        'doors', 'vestibule_area', 'temp_rating', 'fill_type', 'fill_power',
        'fill_weight', 'sleep_style', 'r_value', 'thickness', 'pad_width',
        'pad_length', 'volume', 'frame_type', 'hip_belt', 'max_carry_weight',
        'frame_material', 'pack_fabric', 'fuel_type', 'boil_time', 'igniter',
        'pot_included', 'simmer_control',
      ];

      for (const field of specFields) {
        if (result[field] !== undefined && result[field] !== null) {
          insert[field] = result[field];
        }
      }

      // Insert into Supabase
      const { error } = await supabase.from('gear_items').upsert(insert, { onConflict: 'id' });
      
      if (error) {
        console.log(`  ❌ ${item.brand} ${item.name}: ${error.message}`);
      } else {
        console.log(`  ✅ ${item.brand} ${item.name} (${result.weight_oz}oz, $${result.price_usd})`);
      }
    }

    // Small delay between batches
    if (i + 8 < MISSING_ITEMS.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('\n=== Done! ===');
}

run().catch(e => console.error(e));
