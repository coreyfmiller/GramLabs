/**
 * HikeMind Database Audit
 * 
 * Queries Supabase and reports fill rates for every column,
 * broken down by category. Shows exactly what's populated vs empty.
 * 
 * Usage: node scripts/audit-data.mjs
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// All spec columns we care about (excluding id, name, brand, etc. which are always filled)
const SPEC_COLUMNS = [
  'url', 'subcategory',
  // Shelter
  'shelter_type', 'capacity', 'seasons', 'setup_type', 'floor_area', 'peak_height', 'packed_size',
  // Sleep
  'temp_rating', 'fill_type', 'fill_power', 'fill_weight', 'sleep_style',
  'r_value', 'thickness', 'pad_width', 'pad_length',
  // Pack
  'volume', 'frame_type', 'hip_belt',
  // Clothing
  'waterproof', 'hood_type',
  // Kitchen
  'fuel_type',
  // Electronics
  'lumens', 'battery_type', 'runtime',
  // Trekking poles
  'pole_material',
  // Fabric (cross-category)
  'fabric', 'fabric_denier',
  // YouTube
  'youtube_video_ids',
];

// Which specs matter for which categories (for the "relevant fill rate")
const CATEGORY_RELEVANT_SPECS = {
  shelter: ['shelter_type', 'capacity', 'seasons', 'setup_type', 'floor_area', 'peak_height', 'packed_size', 'fabric', 'fabric_denier'],
  sleep: ['temp_rating', 'fill_type', 'fill_power', 'fill_weight', 'sleep_style', 'r_value', 'thickness', 'pad_width', 'pad_length'],
  pack: ['volume', 'frame_type', 'hip_belt', 'fabric', 'fabric_denier'],
  kitchen: ['fuel_type'],
  electronics: ['lumens', 'battery_type', 'runtime'],
  accessories: ['pole_material', 'waterproof', 'fabric'],
  clothing: ['waterproof', 'hood_type', 'fabric', 'fill_power', 'fill_type', 'fill_weight'],
  tools: [],
  hygiene: [],
};

async function main() {
  console.log('='.repeat(70));
  console.log('  HIKEMIND DATABASE AUDIT — Full Field Coverage Report');
  console.log('='.repeat(70));
  console.log('');

  // Fetch all items
  const { data: items, error } = await supabase
    .from('gear_items')
    .select('*')
    .order('category');

  if (error || !items) {
    console.error('Failed to fetch:', error?.message);
    process.exit(1);
  }

  console.log(`Total items in database: ${items.length}`);
  console.log('');

  // === OVERALL FILL RATES ===
  console.log('-'.repeat(70));
  console.log('  OVERALL FILL RATES (all items)');
  console.log('-'.repeat(70));
  console.log('');
  console.log(`${'Column'.padEnd(22)} ${'Filled'.padStart(7)} ${'Empty'.padStart(7)} ${'Fill %'.padStart(8)}  ${'Status'}`);
  console.log(`${'—'.repeat(22)} ${'—'.repeat(7)} ${'—'.repeat(7)} ${'—'.repeat(8)}  ${'—'.repeat(12)}`);

  for (const col of SPEC_COLUMNS) {
    const filled = items.filter(i => i[col] !== null && i[col] !== undefined && i[col] !== '').length;
    const empty = items.length - filled;
    const pct = ((filled / items.length) * 100).toFixed(1);
    const status = filled === 0 ? '❌ EMPTY' : filled === items.length ? '✅ FULL' : pct >= 80 ? '✅ GOOD' : pct >= 50 ? '⚠️  PARTIAL' : pct > 0 ? '🟡 SPARSE' : '❌ EMPTY';
    console.log(`${col.padEnd(22)} ${String(filled).padStart(7)} ${String(empty).padStart(7)} ${(pct + '%').padStart(8)}  ${status}`);
  }

  // === BY CATEGORY BREAKDOWN ===
  console.log('');
  console.log('='.repeat(70));
  console.log('  BREAKDOWN BY CATEGORY');
  console.log('='.repeat(70));

  const categories = [...new Set(items.map(i => i.category))].sort();

  for (const cat of categories) {
    const catItems = items.filter(i => i.category === cat);
    const relevantSpecs = CATEGORY_RELEVANT_SPECS[cat] || [];
    
    console.log('');
    console.log(`\n  ${cat.toUpperCase()} (${catItems.length} items)`);
    console.log(`  ${'—'.repeat(50)}`);

    if (relevantSpecs.length === 0) {
      console.log(`  No category-specific specs defined (weight + price only)`);
      continue;
    }

    // Show subcategory breakdown
    const subcats = [...new Set(catItems.map(i => i.subcategory || 'none'))].sort();
    if (subcats.length > 1) {
      console.log(`  Subcategories: ${subcats.join(', ')}`);
    }

    console.log(`  ${'Spec'.padEnd(20)} ${'Filled'.padStart(7)} / ${'Total'.padStart(5)}  ${'Fill %'.padStart(7)}  ${'Status'}`);

    for (const spec of relevantSpecs) {
      const filled = catItems.filter(i => i[spec] !== null && i[spec] !== undefined && i[spec] !== '').length;
      const pct = ((filled / catItems.length) * 100).toFixed(1);
      const status = filled === 0 ? '❌ EMPTY' : filled === catItems.length ? '✅ FULL' : pct >= 80 ? '✅ GOOD' : pct >= 50 ? '⚠️  PARTIAL' : '🟡 SPARSE';
      console.log(`  ${spec.padEnd(20)} ${String(filled).padStart(7)} / ${String(catItems.length).padStart(5)}  ${(pct + '%').padStart(7)}  ${status}`);
    }

    // Overall category readiness
    const totalRelevant = relevantSpecs.length * catItems.length;
    const totalFilled = relevantSpecs.reduce((sum, spec) => {
      return sum + catItems.filter(i => i[spec] !== null && i[spec] !== undefined && i[spec] !== '').length;
    }, 0);
    const overallPct = ((totalFilled / totalRelevant) * 100).toFixed(1);
    console.log(`  ${'—'.repeat(50)}`);
    console.log(`  CATEGORY READINESS: ${overallPct}%`);
  }

  // === COMPARE PAGE READINESS ===
  console.log('');
  console.log('='.repeat(70));
  console.log('  GEAR COMPARE READINESS ASSESSMENT');
  console.log('='.repeat(70));
  console.log('');

  // Core (always needed)
  const coreFields = ['weight_oz', 'price_usd'];
  const coreFilled = coreFields.every(f => items.every(i => i[f] !== null)) ? '✅' : '❌';
  console.log(`  ${coreFilled} Core (weight + price): 100% — every item`);

  // YouTube
  const ytFilled = items.filter(i => i.youtube_video_ids && i.youtube_video_ids.length > 0).length;
  console.log(`  ${ytFilled > 0 ? '⚠️' : '❌'} YouTube videos: ${ytFilled}/${items.length} items have videos`);

  // URLs
  const urlFilled = items.filter(i => i.url && i.url !== '').length;
  console.log(`  ${urlFilled > 0 ? '⚠️' : '❌'} Buy links (url): ${urlFilled}/${items.length} items have URLs`);

  // Compare readiness per category
  console.log('');
  console.log('  Per-category compare readiness (extended specs):');
  for (const cat of categories) {
    const catItems = items.filter(i => i.category === cat);
    const relevantSpecs = CATEGORY_RELEVANT_SPECS[cat] || [];
    if (relevantSpecs.length === 0) {
      console.log(`    ${cat}: N/A (no specs to compare beyond weight/price)`);
      continue;
    }
    const totalRelevant = relevantSpecs.length * catItems.length;
    const totalFilled = relevantSpecs.reduce((sum, spec) => {
      return sum + catItems.filter(i => i[spec] !== null && i[spec] !== undefined && i[spec] !== '').length;
    }, 0);
    const pct = ((totalFilled / totalRelevant) * 100).toFixed(1);
    const icon = pct >= 80 ? '✅' : pct >= 50 ? '⚠️' : pct > 0 ? '🟡' : '❌';
    console.log(`    ${icon} ${cat}: ${pct}% of relevant specs filled (${totalFilled}/${totalRelevant} data points)`);
  }

  // === MISSING COLUMNS CHECK ===
  console.log('');
  console.log('-'.repeat(70));
  console.log('  COLUMNS THAT EXIST IN TYPESCRIPT BUT NOT IN DATABASE');
  console.log('-'.repeat(70));

  const sampleItem = items[0] || {};
  const dbColumns = Object.keys(sampleItem);
  
  const tsOnlyFields = [
    'boilTime', 'igniter', 'potIncluded', 'simmerControl',
    'heelDrop', 'stackHeight', 'toeBoxWidth',
    'waterproofRating', 'breathability', 'fabricTech', 'pitZips', 'seamSealed',
    'collapsedLength', 'lockType', 'gripMaterial', 'poleSections',
    'maxCarryWeight', 'frameMaterial', 'packFabric', 'torsoRange', 'waterBottleAccess',
    'chargeMethod', 'redLight', 'ipxRating',
    'stakesNeeded', 'doors', 'vestibuleArea',
    'sleepWidth', 'sleepLength', 'padAttachment', 'enTested', 'padPackedSize', 'padShape', 'inflationMethod',
    'pockets', 'packable',
    'communityRating', 'pctUsagePercent', 'pairsPerThru',
  ];

  // Convert camelCase to snake_case for DB check
  const toSnake = (s) => s.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
  
  const missingFromDb = tsOnlyFields.filter(f => !dbColumns.includes(toSnake(f)));
  const existsInDb = tsOnlyFields.filter(f => dbColumns.includes(toSnake(f)));

  if (existsInDb.length > 0) {
    console.log(`\n  Already in DB (${existsInDb.length}):`);
    existsInDb.forEach(f => console.log(`    ✅ ${toSnake(f)}`));
  }

  console.log(`\n  NOT in DB yet (${missingFromDb.length}):`);
  missingFromDb.forEach(f => console.log(`    ❌ ${toSnake(f)}`));

  console.log('');
  console.log('='.repeat(70));
  console.log('  AUDIT COMPLETE');
  console.log('='.repeat(70));
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
