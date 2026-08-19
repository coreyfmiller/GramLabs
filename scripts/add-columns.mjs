/**
 * Add missing columns to gear_items table in Supabase.
 * 
 * Run this once: node scripts/add-columns.mjs
 * 
 * Uses Supabase's REST API with the service role key or 
 * the SQL editor via the anon key with RPC.
 * 
 * NOTE: The anon key can't run ALTER TABLE directly.
 * You need to run these SQL statements in your Supabase dashboard:
 * 
 * Go to: https://supabase.com/dashboard → Your Project → SQL Editor
 * Paste and run:
 */

const SQL = `
-- Add fill_power column (integer, nullable)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS fill_power integer;

-- Add waterproof column (boolean, nullable)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS waterproof boolean;

-- Add fill_weight column (oz of fill, decimal)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS fill_weight real;

-- Add fabric column (text)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS fabric text;

-- Add fabric_denier column (integer)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS fabric_denier integer;

-- Add setup_type column (freestanding, semi-freestanding, non-freestanding, tarp)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS setup_type text;

-- Add peak_height column (inches)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS peak_height real;

-- Add floor_area column (sq ft)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS floor_area real;

-- Add frame_type column (framed, frameless, removable, stays)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS frame_type text;

-- Add hip_belt column (integrated, removable, none)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS hip_belt text;

-- Add battery_type column (rechargeable, AAA, AA, CR2032)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS battery_type text;

-- Add runtime column (hours on max)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS runtime real;

-- Add hood_type column (hooded, hoodless)
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS hood_type text;

-- Add packed_size column (text like "4x16 in")
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS packed_size text;
`;

console.log('='.repeat(60));
console.log('Run this SQL in your Supabase Dashboard SQL Editor:');
console.log('https://supabase.com/dashboard → SQL Editor');
console.log('='.repeat(60));
console.log(SQL);
console.log('='.repeat(60));
console.log('\nAfter running, execute: node scripts/enrich-database.mjs');
