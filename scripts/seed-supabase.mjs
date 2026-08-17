// Seed Supabase with gear data from gear-database.ts
// Run: node scripts/seed-supabase.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = "https://kkncobvfavgyibisdevc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbmNvYnZmYXZneWliaXNkZXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODQ5MDMsImV4cCI6MjEwMjU2MDkwM30.xEszj-RJq1RtTvu9OLny7Ic7lSlmG15V9AHFuKB3wnI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Parse gear items from TypeScript file
const content = readFileSync("src/data/gear-database.ts", "utf-8");

// Extract all item objects
const items = [];
const idRegex = /id:\s*"([^"]+)"/g;
let match;
const positions = [];

while ((match = idRegex.exec(content)) !== null) {
  positions.push({ id: match[1], index: match.index });
}

for (let i = 0; i < positions.length; i++) {
  const start = positions[i].index;
  const end = i < positions.length - 1 ? positions[i + 1].index : content.length;
  const block = content.slice(start, end);
  
  const id = positions[i].id;
  const get = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*"([^"]*)"`, ""));
    return m ? m[1] : null;
  };
  const getNum = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*([\\d.]+)`, ""));
    return m ? parseFloat(m[1]) : null;
  };

  const item = {
    id,
    name: get("name"),
    brand: get("brand"),
    category: get("category"),
    subcategory: get("subcategory"),
    tier: get("tier"),
    weight_oz: getNum("weightOz"),
    price_usd: getNum("priceUsd"),
    description: get("description"),
    url: get("url"),
    shelter_type: get("shelterType"),
    capacity: getNum("capacity"),
    seasons: get("seasons"),
    temp_rating: getNum("tempRating"),
    fill_type: get("fillType"),
    sleep_style: get("sleepStyle"),
    r_value: getNum("rValue"),
    thickness: getNum("thickness"),
    pad_width: getNum("padWidth"),
    pad_length: getNum("padLength"),
    volume: getNum("volume"),
    fuel_type: get("fuelType"),
    lumens: getNum("lumens"),
    pole_material: get("poleMaterial"),
  };

  if (item.name && item.category && item.weight_oz !== null) {
    items.push(item);
  }
}

console.log(`Parsed ${items.length} items from gear-database.ts`);

// Insert in batches of 100
const BATCH_SIZE = 100;
let inserted = 0;

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  const { error } = await supabase
    .from("gear_items")
    .upsert(batch, { onConflict: "id" });

  if (error) {
    console.error(`Error at batch ${i}:`, error.message);
    // Try one by one to find the problem item
    for (const item of batch) {
      const { error: singleError } = await supabase
        .from("gear_items")
        .upsert([item], { onConflict: "id" });
      if (singleError) {
        console.error(`  Failed item: ${item.id} - ${singleError.message}`);
      } else {
        inserted++;
      }
    }
  } else {
    inserted += batch.length;
    console.log(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${inserted} total)`);
  }
}

console.log(`\n✅ Done! ${inserted} items seeded to Supabase.`);
