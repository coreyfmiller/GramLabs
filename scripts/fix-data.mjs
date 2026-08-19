import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://kkncobvfavgyibisdevc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbmNvYnZmYXZneWliaXNkZXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODQ5MDMsImV4cCI6MjEwMjU2MDkwM30.xEszj-RJq1RtTvu9OLny7Ic7lSlmG15V9AHFuKB3wnI'
);

async function main() {
  console.log('=== Fixing temp ratings ===');
  
  // Fix 2 bags with 0°F ratings that are missing
  const { error: e1 } = await s.from('gear_items').update({ temp_rating: 0 }).ilike('name', '%Cosmic 0%');
  console.log('Kelty Cosmic 0F:', e1 ? `ERR: ${e1.message}` : 'OK');
  
  const { error: e2 } = await s.from('gear_items').update({ temp_rating: 0 }).ilike('name', '%Wasatch 0%');
  console.log('TNF Wasatch 0F:', e2 ? `ERR: ${e2.message}` : 'OK');

  console.log('\n=== Adding Senchi Designs ===');
  
  const senchiItems = [
    {
      id: 'senchi-lark',
      name: 'Lark Hoodie',
      brand: 'Senchi Designs',
      category: 'accessories',
      subcategory: 'insulation',
      tier: 'premium',
      weight_oz: 5.5,
      price_usd: 135,
      description: 'Alpha Direct fleece hoodie. 90 GSM Polartec Alpha Direct. The gold standard ultralight active insulation.',
    },
    {
      id: 'senchi-wren',
      name: 'Wren Hoodie',
      brand: 'Senchi Designs',
      category: 'accessories',
      subcategory: 'insulation',
      tier: 'premium',
      weight_oz: 7.0,
      price_usd: 155,
      description: 'Alpha Direct fleece hoodie. 120 GSM Polartec Alpha Direct. Warmer than Lark for shoulder seasons.',
    },
    {
      id: 'senchi-swift',
      name: 'Swift Hoodie',
      brand: 'Senchi Designs',
      category: 'accessories',
      subcategory: 'insulation',
      tier: 'premium',
      weight_oz: 4.2,
      price_usd: 125,
      description: 'Alpha Direct fleece hoodie. 60 GSM Polartec Alpha Direct. Minimal warmth for running/fastpacking.',
    },
  ];

  for (const item of senchiItems) {
    const { error } = await s.from('gear_items').upsert(item, { onConflict: 'id' });
    console.log(`  ${item.name}: ${error ? `ERR: ${error.message}` : 'OK'}`);
  }

  console.log('\n=== Adding Lightheart Gear ===');
  
  const lightHeartItems = [
    {
      id: 'lightheart-solong6',
      name: 'SoLong 6',
      brand: 'Lightheart Gear',
      category: 'shelter',
      subcategory: 'trekking-pole-tent',
      shelter_type: 'trekking-pole-tent',
      tier: 'mid',
      weight_oz: 26,
      price_usd: 295,
      description: 'Tall-person 1P trekking pole tent. 6ft+ friendly with extra length. Silpoly.',
      capacity: 1,
      seasons: '3',
    },
    {
      id: 'lightheart-duo',
      name: 'Duo',
      brand: 'Lightheart Gear',
      category: 'shelter',
      subcategory: 'trekking-pole-tent',
      shelter_type: 'trekking-pole-tent',
      tier: 'mid',
      weight_oz: 34,
      price_usd: 345,
      description: '2-person trekking pole tent. Roomy for couples. Silpoly.',
      capacity: 2,
      seasons: '3',
    },
    {
      id: 'lightheart-solong-tarp',
      name: 'SoLong Sil Tarp',
      brand: 'Lightheart Gear',
      category: 'shelter',
      subcategory: 'tarp',
      shelter_type: 'tarp',
      tier: 'mid',
      weight_oz: 11,
      price_usd: 145,
      description: 'Ultralight silpoly tarp for tall hikers. 6ft ridgeline.',
      capacity: 1,
      seasons: '3',
    },
  ];

  for (const item of lightHeartItems) {
    const { error } = await s.from('gear_items').upsert(item, { onConflict: 'id' });
    console.log(`  ${item.name}: ${error ? `ERR: ${error.message}` : 'OK'}`);
  }

  console.log('\n=== Adding trekking pole materials ===');
  
  const poleMaterials = [
    { name: 'Alpine Carbon Cork', material: 'carbon' },
    { name: 'Trail Cork', material: 'aluminum' },
    { name: 'Trail', material: 'aluminum' },
    { name: 'Distance Carbon Z', material: 'carbon' },
    { name: 'Distance Plus FLZ', material: 'carbon' },
    { name: 'Makalu Cork Lite', material: 'aluminum' },
    { name: 'LT5', material: 'carbon' },
    { name: 'Flash Carbon', material: 'carbon' },
    { name: 'Carbon Fiber Trekking Poles', material: 'carbon' },
    { name: 'Aluminum Trekking Poles', material: 'aluminum' },
    { name: 'Fizan Compact 3', material: 'aluminum' },
    { name: 'Cork Grip Carbon', material: 'carbon' },
    { name: 'Carbon Fiber Quick Lock', material: 'carbon' },
  ];

  for (const p of poleMaterials) {
    const { error } = await s.from('gear_items')
      .update({ pole_material: p.material })
      .ilike('name', `%${p.name}%`)
      .eq('subcategory', 'trekking-poles');
    if (error) console.log(`  ERR ${p.name}: ${error.message}`);
    else console.log(`  ${p.name}: ${p.material}`);
  }

  console.log('\n=== Final audit ===');
  const { count: total } = await s.from('gear_items').select('*', { count: 'exact', head: true });
  const { data: noSeason } = await s.from('gear_items').select('id').eq('category', 'shelter').is('seasons', null);
  const { data: noCap } = await s.from('gear_items').select('id').eq('category', 'shelter').is('capacity', null);
  const { data: noTemp } = await s.from('gear_items').select('id').eq('category', 'sleep').in('subcategory', ['quilt', 'sleeping-bag']).is('temp_rating', null);
  
  console.log(`Total items: ${total}`);
  console.log(`Shelters missing seasons: ${noSeason ? noSeason.length : 0}`);
  console.log(`Shelters missing capacity: ${noCap ? noCap.length : 0}`);
  console.log(`Quilts/bags missing temp rating: ${noTemp ? noTemp.length : 0}`);
}

main().catch(console.error);
