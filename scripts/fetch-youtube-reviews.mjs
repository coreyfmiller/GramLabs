/**
 * HikeMind YouTube Review Fetcher
 * 
 * Searches YouTube for the top 1-2 review videos for each gear item.
 * Stores video IDs in Supabase for embedding on compare/detail pages.
 * 
 * Usage:
 *   node scripts/fetch-youtube-reviews.mjs              # Run (max 95 searches per run)
 *   node scripts/fetch-youtube-reviews.mjs --dry-run    # Preview searches without API calls
 *   node scripts/fetch-youtube-reviews.mjs --limit 20   # Custom limit per run
 * 
 * Rate limits:
 *   - 10,000 units/day (YouTube Data API v3 free tier)
 *   - Each search = 100 units → max 100 searches/day
 *   - Default: 95 searches per run (safe margin)
 *   - Run daily for ~10 days to cover all 1000 items
 * 
 * Skips items that already have youtube_video_ids populated.
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

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!YOUTUBE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars. Need YOUTUBE_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit'));
const DAILY_LIMIT = limitArg
  ? parseInt(args[args.indexOf('--limit') + 1] || args[0]?.split('=')[1]) || 95
  : 95;

// Preferred channels (prioritize results from these)
const PREFERRED_CHANNELS = [
  'jupiterhikes',
  'darwin onthetrail',
  'homemade wanderlust',
  'dixie',
  'clever hiker',
  'adventure alan',
  'outdoor gear lab',
  'dan becker',
  'backcountry exposure',
  'play outdoors',
  'chase mountains',
  'thetrek',
  'sintax77',
  'matthew posa',
  'neemor',
  'lint hikes',
];

const DELAY_MS = 1200; // Delay between searches (be nice to API)

// Stats
let searchesUsed = 0;
let itemsUpdated = 0;
let itemsSkipped = 0;
let itemsNoResults = 0;

/**
 * Search YouTube for review videos of a gear item
 */
async function searchYouTube(brand, name) {
  const query = `${brand} ${name} review backpacking`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=5&type=video&videoDuration=medium&relevanceLanguage=en&key=${YOUTUBE_API_KEY}`;

  const res = await fetch(url);
  
  if (!res.ok) {
    const err = await res.json();
    if (err.error?.errors?.[0]?.reason === 'quotaExceeded') {
      console.error('\n❌ QUOTA EXCEEDED — daily limit reached. Run again tomorrow.');
      process.exit(0);
    }
    throw new Error(`YouTube API error: ${err.error?.message || res.status}`);
  }

  searchesUsed++;
  const data = await res.json();
  
  if (!data.items || data.items.length === 0) return [];

  // Score results — prefer known channels and relevant titles
  const scored = data.items.map(item => {
    let score = 0;
    const title = item.snippet.title.toLowerCase();
    const channel = item.snippet.channelTitle.toLowerCase();
    
    // Boost known channels
    if (PREFERRED_CHANNELS.some(ch => channel.includes(ch))) score += 10;
    
    // Boost if title contains "review"
    if (title.includes('review')) score += 5;
    
    // Boost if title contains the product name
    if (title.includes(name.toLowerCase().split(' ')[0])) score += 3;
    
    // Penalize if title looks like unboxing/haul/shorts
    if (title.includes('unboxing') || title.includes('haul') || title.includes('#shorts')) score -= 5;
    
    // Penalize very old videos (prefer recent)
    const publishDate = new Date(item.snippet.publishedAt);
    const ageYears = (Date.now() - publishDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageYears < 2) score += 2;
    if (ageYears > 4) score -= 2;

    return { videoId: item.id.videoId, score, title: item.snippet.title, channel: item.snippet.channelTitle };
  });

  // Sort by score, take top 2
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 2);
}

async function main() {
  console.log('🎬 HikeMind YouTube Review Fetcher');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Daily limit: ${DAILY_LIMIT} searches`);
  console.log('');

  // Fetch items that DON'T have youtube_video_ids yet
  const { data: items, error } = await supabase
    .from('gear_items')
    .select('id, name, brand, category, subcategory')
    .is('youtube_video_ids', null)
    .order('category')
    .order('brand');

  if (error || !items) {
    console.error('Failed to fetch items:', error?.message);
    process.exit(1);
  }

  // Also count items that already have videos
  const { count: doneCount } = await supabase
    .from('gear_items')
    .select('id', { count: 'exact', head: true })
    .not('youtube_video_ids', 'is', null);

  console.log(`📦 Items without videos: ${items.length}`);
  console.log(`✅ Items already done: ${doneCount || 0}`);
  console.log(`🎯 Will process: ${Math.min(items.length, DAILY_LIMIT)} this run\n`);

  // Skip items that are unlikely to have good video reviews
  const skipSubcategories = ['food', 'hygiene', 'nav-app', 'fire-signal', 'repair'];
  const searchableItems = items.filter(item => {
    // Skip generic/DIY/misc brands
    if (['Various', 'Generic', 'DIY', 'Custom', 'Amazon', 'DIY/MYOG', 'Store-bought'].includes(item.brand)) return false;
    // Skip food/hygiene/nav apps
    if (skipSubcategories.includes(item.subcategory)) return false;
    return true;
  });

  console.log(`🔍 Searchable items (excluding food/hygiene/generic): ${searchableItems.length}\n`);

  const toProcess = searchableItems.slice(0, DAILY_LIMIT);

  for (let i = 0; i < toProcess.length; i++) {
    const item = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;

    if (DRY_RUN) {
      console.log(`${progress} Would search: "${item.brand} ${item.name} review backpacking"`);
      continue;
    }

    process.stdout.write(`${progress} ${item.brand} ${item.name}...`);

    try {
      const results = await searchYouTube(item.brand, item.name);

      if (results.length === 0) {
        // Store empty array so we don't re-search this item
        await supabase.from('gear_items').update({ youtube_video_ids: [] }).eq('id', item.id);
        console.log(' ⚠️ no results');
        itemsNoResults++;
      } else {
        const videoIds = results.map(r => r.videoId);
        await supabase.from('gear_items').update({ youtube_video_ids: videoIds }).eq('id', item.id);
        console.log(` ✅ ${results.map(r => r.channel).join(', ')}`);
        itemsUpdated++;
      }
    } catch (e) {
      console.log(` ❌ ${e.message}`);
    }

    // Rate limit delay
    if (i < toProcess.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  // Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORT');
  console.log('='.repeat(60));
  console.log(`Searches used:    ${searchesUsed} / ${DAILY_LIMIT}`);
  console.log(`Items updated:    ${itemsUpdated}`);
  console.log(`No results:       ${itemsNoResults}`);
  console.log(`Remaining:        ${searchableItems.length - toProcess.length}`);
  console.log('');
  if (searchableItems.length > DAILY_LIMIT) {
    console.log(`⏰ Run again tomorrow to process the next ${Math.min(searchableItems.length - DAILY_LIMIT, DAILY_LIMIT)} items.`);
  } else {
    console.log('🎉 All searchable items processed!');
  }
  console.log('='.repeat(60));
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
