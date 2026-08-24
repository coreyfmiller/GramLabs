/**
 * HikeMind Database Gap Analysis
 * 
 * Checks for must-have popular items that hikers compare and debate.
 * These are the items that NEED to be in the database for Compare to work.
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data } = await supabase.from('gear_items').select('name, brand, category, subcategory');
  
  const allNames = data.map(i => (i.brand + ' ' + i.name).toLowerCase());
  
  function check(item) {
    // Check if any DB item contains the key words
    const words = item.toLowerCase().split(' ');
    // Try matching brand + first product word at minimum
    return allNames.some(dbItem => {
      return words.every(w => dbItem.includes(w)) || 
             dbItem.includes(words.slice(1).join(' '));
    });
  }

  const categories = {
    'SHELTERS': [
      // Tarptent
      'Tarptent Aeon Li', 'Tarptent Protrail Li', 'Tarptent Stratospire Li',
      'Tarptent Stratospire 2', 'Tarptent Notch Li', 'Tarptent Rainbow',
      // Zpacks
      'Zpacks Duplex', 'Zpacks Plex Solo', 'Zpacks Altaplex', 'Zpacks Triplex',
      // Nemo
      'Nemo Hornet', 'Nemo Dragonfly', 'Nemo Dagger', 'Nemo Hornet OSMO',
      // MSR
      'MSR Hubba Hubba', 'MSR FreeLite 2', 'MSR Hubba Hubba LT',
      // Big Agnes
      'Big Agnes Tiger Wall', 'Big Agnes Copper Spur', 'Big Agnes Fly Creek',
      // Durston
      'Durston X-Mid 1', 'Durston X-Mid 2', 'Durston X-Mid Pro 1', 'Durston X-Mid Pro 2',
      // SMD
      'Six Moon Designs Lunar Solo', 'Six Moon Designs Skyscape Scout',
      // Gossamer Gear
      'Gossamer Gear The One', 'Gossamer Gear The Two',
      // Hilleberg
      'Hilleberg Enan', 'Hilleberg Soulo', 'Hilleberg Anjan', 'Hilleberg Niak',
      // Others
      'REI Flash Air', 'REI Quarter Dome', 'Sierra Designs High Route',
      'SlingFin SplitWing', 'Lightheart Gear SoLong 6',
      'Paria Outdoor Bryce', 'Naturehike Cloud-Up 2',
      // Hammock
      'Warbonnet Blackbird', 'Hennessy Explorer', 'Dutchware Chameleon',
    ],
    'SLEEPING PADS': [
      'Therm-a-Rest NeoAir XLite', 'Therm-a-Rest NeoAir UberLite',
      'Therm-a-Rest NeoAir XTherm', 'Therm-a-Rest Z Lite SOL',
      'Nemo Tensor', 'Nemo Tensor Insulated', 'Nemo Flyer', 'Nemo Switchback',
      'Sea to Summit Ether Light XT', 'Sea to Summit Ultralight Insulated',
      'Exped Ultra 5R', 'Exped Ultra 3R', 'Exped Dura 5R', 'Exped Synmat HL',
      'Big Agnes Rapide SL', 'Big Agnes Q-Core SLX',
      'Klymit Static V', 'Klymit Insulated Static V',
      'Gossamer Gear NightLight',
    ],
    'PACKS': [
      'Osprey Exos 58', 'Osprey Exos 48', 'Osprey Atmos 65', 'Osprey Aura 65',
      'Gossamer Gear Mariposa', 'Gossamer Gear Gorilla', 'Gossamer Gear Kumo',
      'ULA Circuit', 'ULA Ohm 2.0', 'ULA Catalyst',
      'Granite Gear Crown2 60', 'Granite Gear Blaze 60',
      'Zpacks Arc Haul', 'Zpacks Nero', 'Zpacks Arc Blast',
      'Hyperlite Mountain Gear Southwest', 'Hyperlite Mountain Gear Windrider',
      'Hyperlite Mountain Gear Junction',
      'Gregory Focal 48', 'Gregory Katmai 55',
      "Pa'lante V2", "Pa'lante Joey",
      'Durston Kakwa 40', 'Durston Kakwa 55',
      'Atom Packs Prospector', 'Atom Packs Mo',
      'KS Ultralight KS50', 'KS Ultralight KS40',
      'LiteAF Curve 35', 'SWD Long Haul',
      'Mountain Laurel Designs Burn', 'Mountain Laurel Designs Prophet',
      'REI Flash 55',
    ],
    'QUILTS & BAGS': [
      // Quilts
      'Enlightened Equipment Enigma', 'Enlightened Equipment Revelation',
      'Enlightened Equipment Convert', 'Enlightened Equipment Conundrum',
      'Katabatic Palisade', 'Katabatic Sawatch', 'Katabatic Alsek',
      'UGQ Bandit', 'UGQ Econ Bandit',
      'Hammock Gear Econ Burrow', 'Hammock Gear Premium Burrow',
      'Nunatak Arc UL', 'Nunatak Arc Alpinist',
      'Timmermade Newt', 'Timmermade Wren',
      'Zpacks 20F Quilt',
      // Bags
      'Western Mountaineering NanoLite', 'Western Mountaineering UltraLite',
      'Western Mountaineering Megalite',
      'Feathered Friends Tanager', 'Feathered Friends Hummingbird',
      'Feathered Friends Swift',
      'Marmot Phase', 'Nemo Disco', 'Nemo Forte',
      'REI Magma', 'REI Igneo',
      'Kelty Cosmic', 'Hyke & Byke Eolus',
      'Sea to Summit Spark', 'Sea to Summit Flame',
    ],
    'STOVES': [
      'MSR PocketRocket 2', 'MSR PocketRocket Deluxe', 'MSR WindBurner',
      'MSR WhisperLite', 'MSR Reactor',
      'Jetboil Flash', 'Jetboil Stash', 'Jetboil MiniMo',
      'SOTO Windmaster', 'SOTO Amicus', 'SOTO Micro Regulator',
      'BRS 3000T', 'Fire Maple FMS-300T',
      'Snow Peak LiteMax', 'Snow Peak GigaPower',
      'Kovea Spider', 'Trail Designs Caldera Cone',
      'Esbit Wing Stove', 'Vargo Hexagon',
      'Firebox Nano', 'BRS Titanium Wood Stove',
    ],
    'WATER FILTERS': [
      'Sawyer Squeeze', 'Sawyer Mini', 'Sawyer Micro',
      'Katadyn BeFree', 'Katadyn Hiker Pro',
      'Platypus QuickDraw', 'LifeStraw Peak Series',
      'Grayl GeoPress', 'Grayl UltraPress',
      'Aquamira Drops', 'MSR TrailShot',
      'HydroBlu Versa Flow', 'SteriPen Ultra',
      'CNOC Vecto',
    ],
    'TREKKING POLES': [
      'Black Diamond Distance Carbon Z', 'Black Diamond Distance FLZ',
      'Black Diamond Alpine Carbon Cork', 'Black Diamond Trail',
      'Gossamer Gear LT5', 'Leki Micro Vario',
      'Leki Makalu FX Carbon', 'Leki Black Series',
      'REI Flash Carbon', 'Cascade Mountain Tech Carbon',
      'Ruta Locura Rik Stik', 'Fizan Compact',
    ],
    'HEADLAMPS': [
      'Nitecore NU25', 'Nitecore NU25 UL', 'Nitecore NU27',
      'Petzl Actik Core', 'Petzl IKO Core', 'Petzl Swift RL',
      'Black Diamond Spot 400', 'Black Diamond Storm 500-R',
      'BioLite HeadLamp 330', 'Fenix HL26R',
    ],
  };

  let totalMissing = 0;
  let totalChecked = 0;

  console.log('='.repeat(70));
  console.log('  HIKEMIND GEAR GAP ANALYSIS — Must-Have Items Check');
  console.log('='.repeat(70));
  console.log('');

  for (const [category, items] of Object.entries(categories)) {
    const missing = [];
    const found = [];
    
    items.forEach(item => {
      if (check(item)) found.push(item);
      else missing.push(item);
    });

    totalChecked += items.length;
    totalMissing += missing.length;

    const pct = ((found.length / items.length) * 100).toFixed(0);
    const icon = pct >= 90 ? '✅' : pct >= 70 ? '⚠️' : '❌';
    
    console.log(`${icon} ${category}: ${found.length}/${items.length} (${pct}%)`);
    
    if (missing.length > 0) {
      console.log(`   MISSING:`);
      missing.forEach(m => console.log(`     ❌ ${m}`));
    }
    console.log('');
  }

  console.log('='.repeat(70));
  console.log(`  TOTAL: ${totalChecked - totalMissing}/${totalChecked} must-have items present (${((totalChecked - totalMissing) / totalChecked * 100).toFixed(0)}%)`);
  console.log(`  MISSING: ${totalMissing} items that hikers actively compare`);
  console.log('='.repeat(70));
}

run().catch(e => console.error(e));
