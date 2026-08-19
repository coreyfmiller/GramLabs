import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://kkncobvfavgyibisdevc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbmNvYnZmYXZneWliaXNkZXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODQ5MDMsImV4cCI6MjEwMjU2MDkwM30.xEszj-RJq1RtTvu9OLny7Ic7lSlmG15V9AHFuKB3wnI'
);

const expected = [
  'Zpacks','Tarptent','Durston','Big Agnes','MSR','NEMO',
  'Hyperlite Mountain Gear','Six Moon Designs','Mountain Laurel Designs',
  'Gossamer Gear','Naturehike','Lightheart Gear','Hilleberg','SlingFin',
  'Sierra Designs','Warbonnet','Dutchware','ENO',
  'Enlightened Equipment','Katabatic','Western Mountaineering','Hammock Gear',
  'Nunatak','Timmermade','Feathered Friends','Underground Quilts',
  'Therm-a-Rest','Exped','Sea to Summit','Cumulus','Klymit','Aegismax','Zenbivy','Pajak',
  'Osprey','ULA','Gregory','Granite Gear',"Pa'lante",'Atom Packs','LiteAF',
  'Waymark Gear Co','Superior Wilderness Designs','Northern Ultralight',
  'KS Ultralight','Zimmerbuilt','Mystery Ranch','Deuter','Kelty','3F UL Gear',
  'TOAKS','Snow Peak','Sawyer','Platypus','Katadyn','Jetboil','BRS','SOTO','CNOC','Evernew',
  'Nitecore','Garmin','COROS','BioLite','Petzl','Black Diamond','Suunto','Anker',
  'Patagonia','Senchi Designs','Melanzana','Outdoor Research','Frogg Toggs',
  "Arc'teryx",'Mont-bell','Rab','Mountain Hardwear',
  'Altra','Hoka','Salomon','La Sportiva','Darn Tough','Injinji','Xero Shoes',
  'Adventure Medical Kits','Ursack','BearVault','Gear Aid','Leatherman',
];

const { data } = await s.from('gear_items').select('brand');
const counts = {};
data.forEach(r => { counts[r.brand] = (counts[r.brand] || 0) + 1; });

// Check what's missing from expected
const missing = expected.filter(b => !Object.keys(counts).some(k => k.toLowerCase() === b.toLowerCase()));
console.log(`MISSING from expected list (${missing.length}):`);
missing.forEach(b => console.log(`  - ${b}`));

// Check what's in DB but NOT in expected (brands with 2+ items we might want to track)
console.log(`\nBrands IN DB but NOT in expected list (2+ items):`);
const trackedLower = expected.map(e => e.toLowerCase());
const untracked = Object.entries(counts)
  .filter(([b]) => !trackedLower.includes(b.toLowerCase()))
  .sort((a, b) => b[1] - a[1]);

untracked.filter(([, c]) => c >= 2).forEach(([b, c]) => console.log(`  ${String(c).padStart(3)}  ${b}`));

console.log(`\nTotal brands in DB: ${Object.keys(counts).length}`);
console.log(`Total tracked in expected: ${expected.length}`);
console.log(`Untracked with 2+ items: ${untracked.filter(([,c]) => c >= 2).length}`);
