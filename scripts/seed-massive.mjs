/**
 * HikeMind Massive Database Expansion
 * 
 * Uses Gemini to generate 600+ new gear items across all categories.
 * 
 * Rules:
 * - Medium weight cap per category (no car camping gear)
 * - All trail food/nutrition available on market
 * - Full specs per our REQUIRED_SPECS standards
 * - UL-leaning but covering all tiers
 * 
 * Weight caps (approximate - items heavier than this are car-camping):
 *   Shelter: <8 lbs (128oz) 
 *   Pack: <6 lbs (96oz)
 *   Sleep bags/quilts: <4 lbs (64oz)
 *   Sleep pads: <3 lbs (48oz)
 *   Stoves: <2 lbs (32oz)
 *   Cookware: <1.5 lbs (24oz)
 *   Rain gear: <1.5 lbs (24oz)
 *   Insulation: <2 lbs (32oz)
 *   Trekking poles: <1.5 lbs pair (24oz)
 *   Headlamps: <0.5 lbs (8oz)
 *   Food/consumables: no weight cap (all trail food)
 * 
 * Usage: node scripts/seed-massive.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env
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

const DELAY_MS = 600;

// ─── CATEGORY PROMPTS ───────────────────────────────────────────────────────

const CATEGORIES = [
  {
    name: "Trail Food & Nutrition",
    count: 100,
    prompt: `Generate 100 trail food and nutrition items available for purchase that backpackers carry. Include:
- Freeze-dried meals (Mountain House, Peak Refuel, Backpacker's Pantry, Good To-Go, Heather's Choice, AlpineAire, Trailtopia, Packit Gourmet)
- Energy bars (Clif, KIND, RXBar, Larabar, ProBar, Bobo's, GoMacro, No Cow, Perfect Bar)
- Trail snacks (nuts, jerky, dried fruit, chips, candy)
- Drink mixes (Liquid IV, LMNT, Nuun, Tailwind, Skratch Labs, Gatorade powder)
- Instant oatmeal/breakfast items
- Tuna/chicken packets (Starkist, Bumble Bee)
- Nut butters (Justin's, RX)
- Ramen/instant noodles for trail
- Energy gels and chews (GU, Honey Stinger, Clif Bloks)

For each: id (slug), name, brand, category:"kitchen", subcategory:"food", tier (ultra-budget/budget/mid/premium), weight_oz (per serving/packet), price_usd, description.
No weight cap - include everything hikers actually buy.`,
    specBlock: ``
  },
  {
    name: "Sleeping Bags",
    count: 60,
    prompt: `Generate 60 sleeping bags for backpacking that we don't already have. Focus on:
- More NEMO (Disco, Forte, Riff temps), Marmot (Trestles, Phase, Hydrogen), Kelty (Cosmic temps, Tuck temps)
- REI (Magma, Igneo, Trailbreak temps), TNF (Eco Trail, Inferno, Cat's Meow)
- Sierra Designs (Get Down, Cloud temps), Big Agnes (various)
- Budget: Teton Sports, Hyke & Byke (Quandary, Shavano), Outdoor Vitals, Mountain Warehouse
- Sea to Summit (Spark, Flame, Trek temps)
- Western Mountaineering missing models
- Women's specific versions
Max weight: 64oz. Include all temp ratings from 0F to 50F.

Required specs: temp_rating (°F number), fill_type (goose-down/duck-down/synthetic), fill_power (if down, number), sleep_style (mummy/semi-rectangular/rectangular/quilt).`,
    specBlock: `temp_rating, fill_type, fill_power (only if down - omit for synthetic), sleep_style`
  },
  {
    name: "Sleeping Pads",
    count: 30,
    prompt: `Generate 30 sleeping pads for backpacking we don't already have. Focus on:
- More Exped (Ultra series temps, Dura, Versa, Flexmat)
- Sea to Summit (Comfort Plus, Comfort Light, Camp Mat)
- NEMO (Tensor Trail, Quasar, Astro)
- Big Agnes (Rapide, Q-Core Deluxe)
- Budget: Klymit (Insulated V Ultralite, V2), Naturehike, Hikenture
- Therm-a-Rest (ProLite, Trail Scout, RidgeRest)
- Women's specific models
Max weight: 48oz.

Required specs: r_value (number), thickness (inches), pad_width (inches), pad_length (inches).`,
    specBlock: `r_value, thickness, pad_width, pad_length`
  },
  {
    name: "Tents & Shelters",
    count: 50,
    prompt: `Generate 50 backpacking tents/shelters we don't already have. Focus on:
- More Big Agnes (Fly Creek, Tiger Wall, Copper Spur temps/sizes)
- MSR (Elixir, Access, Carbon Reflex)
- NEMO (Firefly, Dagger, Hornet Elite 2P)
- Budget: Kelty (Late Start 1, Dirt Motel), Naturehike (Vik, Hiby, Opalus), 3F UL Gear (Lanshan, Floating Cloud)
- Bikepacking tents (MSR Hubba Hubba Bikepack 1)
- More cottage: Yama Mountain Gear, Locus Gear, MLD
- 4-season options: Hilleberg (Jannu, Nammatj), MSR Access
- Ultralight: Gossamer Gear (The Two), Bonfus, Trekkertent
Max weight: 128oz.

Required specs: setup_type (freestanding/semi-freestanding/non-freestanding/tarp), floor_area (sq ft), peak_height (inches), fabric (text), capacity (number), seasons (3/3+/4).`,
    specBlock: `setup_type, floor_area, peak_height, fabric, capacity, seasons`
  },
  {
    name: "Backpacks",
    count: 40,
    prompt: `Generate 40 backpacking packs we don't already have. Focus on:
- Women's specific: Osprey (Eja, Aura, Tempest), Gregory (Deva, Maven, Jade sizes), REI (Flash Women's)
- Budget: Naturehike, 3F UL Gear, Amazon Basics 40L, Mountaintop, Teton Sports (Hiker 3700)
- Cottage: Zimmerbuilt (QuickStep, Pika), Drop (40L), Seek Outside (Divide, Gila)
- More Osprey sizes: Talon 33, Stratos 34, Manta 24
- Fastpack: Ultimate Direction (Fastpack series), Salomon (OUT series)
- International: Decathlon (various Forclaz), Vaude, Lowe Alpine
Max weight: 96oz.

Required specs: volume (liters), frame_type (framed/frameless/removable/stays), hip_belt (integrated/removable/none).`,
    specBlock: `volume, frame_type, hip_belt`
  },
  {
    name: "Stoves & Cookware",
    count: 40,
    prompt: `Generate 40 stoves and cookware items we don't already have. Include:

STOVES (20):
- More SOTO (Amicus, Micro Regulator), Kovea (Spider, Supalite)
- Budget: Etekcity (ultralight), Fire Maple (Star, Blade, Hornet)
- Integrated: MSR Reactor, Jetboil Zip, Jetboil Sumo
- Solid fuel: Esbit stoves (titanium, steel)
- Alcohol: White Box stove, Fancy Feast cat food can stove (DIY classic)
Max weight: 32oz.
Required stove specs: fuel_type (canister/alcohol/solid/wood), boil_time (minutes for 1L), igniter (true/false), pot_included (true/false), simmer_control (true/false)

COOKWARE (20):
- Titanium: TOAKS (400ml, 650ml, 900ml, plates, sporks), Keith, Lixada
- Budget: GSI Halulite (Minimalist, Ketalist), MSR Alpine Stowaway
- Utensils: Sea to Summit Alpha spork, humangear GoBites, titanium long spoon
- Mugs: Snow Peak titanium mug, GSI Infinity mug
- Accessories: MSR Alpine cutting board, GSI Crossover Kitchen Kit
Max weight: 24oz. Cookware has no required specs beyond weight + price.`,
    specBlock: `FOR STOVES: fuel_type, boil_time, igniter, pot_included, simmer_control. FOR COOKWARE: none (weight + price only)`
  },
  {
    name: "Headlamps & Electronics",
    count: 35,
    prompt: `Generate 35 electronics items for backpacking we don't already have. Include:

HEADLAMPS (15):
- Petzl (Bindi, Tikka, Actik), Black Diamond (Cosmo, Revolt, Sprint)
- Budget: Nitecore NU20, NU22, Olight Array 2S, BioLite 200
- Premium: Petzl NAO, Fenix HM65R, Lupine Piko
Max weight: 8oz.
Required headlamp specs: lumens (number), battery_type (rechargeable/AAA/AA/CR2032), runtime (hours on max)

POWER/ACCESSORIES (10):
- Power banks: Nitecore NB10000, Anker 622, BioLite Charge 40, Goal Zero Sherpa
- Solar: BioLite SolarPanel 5+, Goal Zero Nomad 10, Anker 21W
Required power specs: battery_type (rechargeable)

GPS WATCHES (10):
- More Garmin (Instinct 2X, Enduro 2, Forerunner 265)
- COROS (APEX Pro, DURA)
- Apple Watch Ultra 2 (for hikers who use it)
- Suunto (Peak Pro, Race)
Required gps-watch specs: battery_type (rechargeable)`,
    specBlock: `HEADLAMPS: lumens, battery_type, runtime. POWER: battery_type. GPS: battery_type`
  },
  {
    name: "Quilts & Underquilts",
    count: 25,
    prompt: `Generate 25 quilts and underquilts for backpacking we don't already have. Focus on:
- More EE temps (Enigma 10, 30, 40, 50; Revelation 10, 30, 40, 50; Convert)
- Katabatic (Bristlecone, Palisade 15, Sawatch 15)
- Nunatak (Arc UL 20, 30, 40)
- Timmermade (Newt 20, 30; Wren 20)
- Budget: Hammock Gear (Econ Burrow temps), UGQ (Bandit 10, 30, 40)
- Synthetic quilts: EE Enigma APEX 30, Hammock Gear Econ Incubator synthetic
- Underquilts: More HG temps, Warbonnet Wooki 0F, UGQ Zeppelin
Max weight: 48oz.

Required specs: temp_rating (°F), fill_type (goose-down/duck-down/synthetic), sleep_style (quilt for quilts - omit for underquilts), fill_power (only if down).
For underquilts: subcategory is "underquilt" and only needs temp_rating + fill_type + fill_power (if down).`,
    specBlock: `temp_rating, fill_type, sleep_style (quilts only), fill_power (down only)`
  },
  {
    name: "Rain Gear & Insulation",
    count: 50,
    prompt: `Generate 50 rain gear and insulation items for backpacking we don't already have. Include:

RAIN GEAR (25) - subcategory: "rain-gear", category: "accessories":
- Rain jackets: Montbell Versalite, OR Aspire II, Patagonia Torrentshell, TNF Venture 2, Marmot PreCip Eco, REI Rainier, Columbia Watertight II, Outdoor Vitals Ventus
- Rain pants: OR Helium pants, Frogg Toggs rain pants, Marmot PreCip Eco pants, Montbell Versalite pants
- Rain kilts: ULA Rain Kilt, Gossamer Gear Rain Kilt
- Ponchos: Sea to Summit Ultra-Sil Tarp Poncho, Frogg Toggs poncho, Lightload poncho
Max weight: 24oz.
Required rain-gear spec: waterproof (true/false)

INSULATION (25) - subcategory: "insulation", category: "accessories":
- Down jackets: Montbell Superior Down Parka, Rab Microlight Alpine, Mountain Hardwear Ghost Whisperer/2, Decathlon Trek 100, Uniqlo UL Down
- Synthetic: Patagonia Micro Puff, Outdoor Research SuperStrand, Montbell Thermawrap
- Fleece: Patagonia R1 TechFace, Senchi Designs Swift, Alpha Direct pieces
- Vests: Montbell Superior Down Vest, Patagonia Down Sweater Vest, EE Torrid Vest
Max weight: 32oz.
Required insulation spec: fill_type (goose-down/duck-down/synthetic/none)`,
    specBlock: `RAIN GEAR: waterproof (true/false). INSULATION: fill_type`
  },
  {
    name: "Trekking Poles & Accessories",
    count: 30,
    prompt: `Generate 30 items we don't already have. Include:

TREKKING POLES (12) - subcategory: "trekking-poles":
- Leki (Makalu FX Carbon, Micro Vario Carbon, Cross Trail), Komperdell
- Black Diamond (Trail Ergo Cork, Trail Back, Distance Plus)
- Budget: Montem Ultra Strong, Hiker Hunger carbon
- Running poles: Black Diamond Distance Carbon Z running, Leki Micro Trail Race
Max weight: 24oz per pair.
Required pole specs: pole_material (carbon/aluminum), collapsed_length (inches), lock_type (flicklock/twist/z-fold/lever), grip_material (cork/foam/rubber)

WATER FILTERS (8) - subcategory: "water-filter", category: "kitchen":
- Katadyn (Steripen, Micropur tablets), MSR Guardian, Platypus GravityWorks
- Budget: Membrane Solutions straw, LifeStraw Go bottle
No required specs beyond weight + price.

WATER STORAGE (10) - subcategory: "water-storage", category: "kitchen":
- CNOC Vecto 2L/3L, Evernew water carry, HydraPak Stow 1L
- Platypus Platy 2L, Nalgene HDPE, Smartwater bottles (the classic)
- Sawyer squeeze bags, CNOC Vecto dirty bag
No required specs beyond weight + price.`,
    specBlock: `POLES: pole_material, collapsed_length, lock_type, grip_material. FILTERS/WATER: none`
  },
];

// ─── GEMINI API ─────────────────────────────────────────────────────────────

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 65536 },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gemini error: ${err.error?.message || res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 HikeMind MASSIVE Database Expansion');
  console.log(`   Categories: ${CATEGORIES.length}`);
  console.log(`   Target: ~${CATEGORIES.reduce((s, c) => s + c.count, 0)} new items\n`);

  // Get existing IDs to avoid duplicates
  const { data: existingItems } = await supabase
    .from('gear_items')
    .select('id, name, brand');
  const existingIds = new Set(existingItems.map(i => i.id));
  const existingNames = new Set(existingItems.map(i => (i.brand + ' ' + i.name).toLowerCase()));
  console.log(`📦 Existing items: ${existingIds.size}\n`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const category of CATEGORIES) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${category.name} (target: ${category.count})`);
    console.log(`${'═'.repeat(60)}`);

    const fullPrompt = `${category.prompt}

IMPORTANT RULES:
- Generate ONLY real products that exist on the market (not invented)
- Use accurate weights (oz) and prices (USD, 2024-2025 retail)
- tier must be one of: "ultra-budget", "budget", "mid", "premium"
- id must be a unique slug (brand-name-variant, lowercase, hyphens)
- DO NOT include items from these brands+names already in our DB: ${existingItems.slice(0, 50).map(i => i.brand + ' ' + i.name).join(', ')}...

${category.specBlock ? 'REQUIRED SPECS: ' + category.specBlock : ''}

Respond with ONLY a valid JSON array of objects. No markdown fences. Each object must have at minimum: id, name, brand, category, subcategory, tier, weight_oz, price_usd, description.`;

    try {
      const response = await callGemini(fullPrompt);
      const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let items;
      try {
        items = JSON.parse(jsonStr);
      } catch (e) {
        // Try to extract JSON array from response
        const match = jsonStr.match(/\[[\s\S]*\]/);
        if (match) {
          items = JSON.parse(match[0]);
        } else {
          console.error(`  ❌ Failed to parse response for ${category.name}`);
          totalErrors++;
          continue;
        }
      }

      // Filter duplicates
      const newItems = items.filter(item => {
        if (!item.id || !item.name || !item.brand) return false;
        if (existingIds.has(item.id)) return false;
        if (existingNames.has((item.brand + ' ' + item.name).toLowerCase())) return false;
        return true;
      });

      const skipped = items.length - newItems.length;
      totalSkipped += skipped;

      if (newItems.length === 0) {
        console.log(`  ⚠️  All ${items.length} items already exist or invalid`);
        continue;
      }

      // Insert in batches of 50
      let inserted = 0;
      for (let i = 0; i < newItems.length; i += 50) {
        const batch = newItems.slice(i, i + 50);
        const { error } = await supabase.from('gear_items').insert(batch);
        if (error) {
          // Try one by one
          for (const item of batch) {
            const { error: sErr } = await supabase.from('gear_items').insert(item);
            if (sErr) {
              totalErrors++;
            } else {
              inserted++;
              existingIds.add(item.id);
              existingNames.add((item.brand + ' ' + item.name).toLowerCase());
            }
          }
        } else {
          inserted += batch.length;
          batch.forEach(item => {
            existingIds.add(item.id);
            existingNames.add((item.brand + ' ' + item.name).toLowerCase());
          });
        }
      }

      totalInserted += inserted;
      console.log(`  ✅ Inserted: ${inserted} | Skipped: ${skipped} | Generated: ${items.length}`);

    } catch (e) {
      console.error(`  ❌ Error: ${e.message}`);
      totalErrors++;
    }

    // Rate limit between categories
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  // Final report
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 FINAL REPORT');
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Inserted:  ${totalInserted}`);
  console.log(`  Skipped:   ${totalSkipped} (duplicates)`);
  console.log(`  Errors:    ${totalErrors}`);
  console.log(`  Total DB:  ${existingIds.size}`);
  console.log(`${'═'.repeat(60)}`);
  console.log('\n📋 Next steps:');
  console.log('   node scripts/enrich-database.mjs   (fill remaining specs)');
  console.log('   node scripts/audit-data.mjs        (verify 100%)');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
