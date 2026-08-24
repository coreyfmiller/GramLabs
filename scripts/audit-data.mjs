/**
 * HikeMind Database Audit v2
 * 
 * Measures COMPARE READINESS: for each item, does it have the specs
 * required for its category/subcategory? Uses the same REQUIRED_SPECS
 * as the enrichment script — the single source of truth.
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

// ─── REQUIRED SPECS PER SUBCATEGORY ─────────────────────────────────────────
// This is the source of truth. If a subcategory has an empty array, those items
// are compare-ready with just weight + price (which every item has).
// "fill_power" is only required when fill_type includes "down".

const REQUIRED_SPECS = {
  // SHELTER
  'freestanding-tent': ['setup_type', 'floor_area', 'peak_height', 'fabric', 'capacity', 'seasons'],
  'trekking-pole-tent': ['setup_type', 'floor_area', 'peak_height', 'fabric', 'capacity', 'seasons'],
  'tarp': ['capacity', 'seasons', 'fabric'],
  'tarp-system': ['capacity', 'seasons', 'fabric'],
  'pyramid': ['capacity', 'seasons', 'fabric', 'floor_area', 'peak_height'],
  'hammock': ['capacity', 'seasons', 'fabric'],
  'bivy': ['capacity', 'seasons', 'fabric'],

  // SLEEP
  'quilt': ['temp_rating', 'fill_type', 'sleep_style'],
  'sleeping-bag': ['temp_rating', 'fill_type', 'sleep_style'],
  'underquilt': ['temp_rating', 'fill_type'],
  'pad-inflatable': ['r_value', 'thickness', 'pad_width', 'pad_length'],
  'pad-foam': ['r_value', 'thickness'],
  'pillow': [],
  'liner': [],

  // PACK
  'thru-hike': ['volume', 'frame_type', 'hip_belt'],
  'fast-light': ['volume', 'frame_type', 'hip_belt'],
  'daypack': ['volume'],
  'running-vest': ['volume'],

  // KITCHEN
  'stove': ['fuel_type', 'boil_time'],
  'cookware': [],
  'water-filter': [],
  'water-storage': [],
  'food': [],
  'fuel': [],
  'fire-signal': [],

  // ELECTRONICS
  'headlamp': ['lumens', 'battery_type', 'runtime'],
  'power': ['battery_type'],
  'satellite': ['battery_type'],
  'gps-watch': ['battery_type'],
  'solar': [],
  'camera': [],
  'nav-app': [],

  // ACCESSORIES
  'trekking-poles': ['pole_material', 'collapsed_length', 'lock_type', 'grip_material'],
  'rain-gear': ['waterproof'],
  'insulation': ['fill_type'],
  'socks': [],
  'camp-comfort': [],
  'hammock-suspension': [],
  'hygiene': [],
  'stuff-sacks': [],
  'sun-protection': [],

  // SAFETY
  // No specs beyond weight/price

  // CLOTHING (if we add it)
  'rain-shell': ['waterproof', 'hood_type'],
  'wind-shell': ['hood_type'],
  'puffy': ['fill_type', 'hood_type'],
  'fleece': [],
  'base-layer': [],
};

// Conditional spec: fill_power is required only when fill_type is down
function getEffectiveRequired(item) {
  const base = REQUIRED_SPECS[item.subcategory] || REQUIRED_SPECS[item.category] || [];
  const specs = [...base];

  // Add fill_power requirement for down items
  if (specs.includes('fill_type') && item.fill_type && item.fill_type.includes('down')) {
    if (!specs.includes('fill_power')) specs.push('fill_power');
  }

  return specs;
}

function isFieldFilled(item, field) {
  const val = item[field];
  return val !== null && val !== undefined && val !== '';
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  // Paginate to get ALL items (Supabase default limit is 1000)
  let items = [];
  let offset = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('gear_items')
      .select('*')
      .order('category')
      .order('subcategory')
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) { console.error('Failed to fetch:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    items = items.concat(data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  console.log('='.repeat(70));
  console.log('  HIKEMIND GEAR COMPARE — READINESS AUDIT');
  console.log('='.repeat(70));
  console.log(`\n  Total items: ${items.length}\n`);

  // Score every item
  let totalReady = 0;
  let totalItems = 0;
  const bySubcategory = {};
  const failures = [];

  for (const item of items) {
    const sub = item.subcategory || 'none';
    const required = getEffectiveRequired(item);

    if (!bySubcategory[sub]) {
      bySubcategory[sub] = { category: item.category, total: 0, ready: 0, specs: required, missing: [] };
    }

    bySubcategory[sub].total++;
    totalItems++;

    if (required.length === 0) {
      // No specs required beyond weight/price — always ready
      bySubcategory[sub].ready++;
      totalReady++;
    } else {
      const missingFields = required.filter(f => !isFieldFilled(item, f));
      if (missingFields.length === 0) {
        bySubcategory[sub].ready++;
        totalReady++;
      } else {
        bySubcategory[sub].missing.push({ name: `${item.brand} ${item.name}`, fields: missingFields });
        failures.push({ name: `${item.brand} ${item.name}`, sub, fields: missingFields });
      }
    }
  }

  // ─── RESULTS BY SUBCATEGORY ───
  const categories = [...new Set(items.map(i => i.category))].sort();

  for (const cat of categories) {
    const subs = Object.entries(bySubcategory)
      .filter(([, v]) => v.category === cat)
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (subs.length === 0) continue;

    const catTotal = subs.reduce((s, [, v]) => s + v.total, 0);
    const catReady = subs.reduce((s, [, v]) => s + v.ready, 0);
    const catPct = ((catReady / catTotal) * 100).toFixed(1);
    const catIcon = catPct == 100 ? '✅' : catPct >= 95 ? '🟢' : catPct >= 80 ? '⚠️' : '🟡';

    console.log(`${catIcon} ${cat.toUpperCase()} — ${catReady}/${catTotal} (${catPct}%)`);

    for (const [sub, data] of subs) {
      const pct = ((data.ready / data.total) * 100).toFixed(0);
      const icon = pct == 100 ? '✅' : pct >= 95 ? '🟢' : '⚠️';
      const specLabel = data.specs.length > 0 ? `[${data.specs.join(', ')}]` : '[weight + price only]';
      console.log(`    ${icon} ${sub} (${data.ready}/${data.total}) ${pct}%  ${specLabel}`);
    }
    console.log('');
  }

  // ─── OVERALL ───
  const overallPct = ((totalReady / totalItems) * 100).toFixed(1);
  console.log('='.repeat(70));
  console.log(`  OVERALL COMPARE READINESS: ${totalReady}/${totalItems} (${overallPct}%)`);
  console.log('='.repeat(70));

  // ─── FAILURES (if any) ───
  if (failures.length > 0 && failures.length <= 30) {
    console.log(`\n  ❌ ITEMS NOT COMPARE-READY (${failures.length}):`);
    failures.forEach(f => {
      console.log(`    • ${f.name} [${f.sub}] — missing: ${f.fields.join(', ')}`);
    });
  } else if (failures.length > 30) {
    console.log(`\n  ❌ ${failures.length} ITEMS NOT COMPARE-READY (showing first 30):`);
    failures.slice(0, 30).forEach(f => {
      console.log(`    • ${f.name} [${f.sub}] — missing: ${f.fields.join(', ')}`);
    });
    console.log(`    ... and ${failures.length - 30} more`);
  }

  // ─── SUPPLEMENTARY: URLs + YouTube ───
  const urlFilled = items.filter(i => i.url && i.url !== '').length;
  const ytFilled = items.filter(i => i.youtube_video_ids && i.youtube_video_ids.length > 0).length;
  console.log(`\n  📎 Buy URLs: ${urlFilled}/${items.length} (${((urlFilled / items.length) * 100).toFixed(0)}%)`);
  console.log(`  🎬 YouTube: ${ytFilled}/${items.length} (${((ytFilled / items.length) * 100).toFixed(0)}%)`);

  console.log('\n' + '='.repeat(70));
  console.log('  AUDIT COMPLETE');
  console.log('='.repeat(70));
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
