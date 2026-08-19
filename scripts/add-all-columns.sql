-- HikeMind: Add ALL missing columns to gear_items table
-- Run this in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard → Your Project → SQL Editor
--
-- These 39 columns exist in the TypeScript GearItem interface but NOT in the database.
-- After running this, execute the expanded enrichment script to fill them.

-- === STOVES / KITCHEN ===
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS boil_time real;           -- minutes for 1L
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS igniter boolean;          -- has built-in igniter
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS pot_included boolean;     -- pot comes with stove
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS simmer_control boolean;   -- has simmer control

-- === SHOES ===
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS heel_drop real;           -- mm
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS stack_height real;        -- mm
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS toe_box_width text;       -- narrow, standard, wide, extra-wide

-- === CLOTHING / SHELLS / RAIN ===
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS waterproof_rating real;   -- mm hydrostatic head
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS breathability real;       -- g/m²/24hr MVTR
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS fabric_tech text;         -- GORE-TEX, Pertex Shield, eVent, etc.
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS pit_zips boolean;         -- has pit zips
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS seam_sealed boolean;      -- fully seam sealed

-- === TREKKING POLES ===
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS collapsed_length real;    -- inches
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS lock_type text;           -- flicklock, twist, z-fold, lever
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS grip_material text;       -- cork, foam, rubber
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS pole_sections integer;    -- 2, 3, or folding

-- === PACKS ===
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS max_carry_weight real;    -- lbs recommended max load
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS frame_material text;      -- aluminum, carbon, HDPE
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS pack_fabric text;         -- DCF, Robic nylon, X-Pac, etc.
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS torso_range text;         -- e.g. "16-21 in"
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS water_bottle_access text; -- side, shoulder, both, none

-- === ELECTRONICS ===
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS charge_method text;       -- usb-c, micro-usb, none
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS red_light boolean;        -- has red light mode
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS ipx_rating integer;       -- IPX waterproof rating (4-8)

-- === SHELTERS (extended) ===
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS stakes_needed integer;    -- number of stakes required
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS doors integer;            -- number of doors
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS vestibule_area real;      -- sq ft of vestibule(s)

-- === SLEEP SYSTEM (extended) ===
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS sleep_width text;         -- narrow, regular, wide, x-wide
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS sleep_length text;        -- short, regular, long
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS pad_attachment boolean;   -- quilt attaches to pad
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS en_tested boolean;        -- ISO/EN temp rating tested
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS pad_packed_size text;     -- e.g. "4x9 in"
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS pad_shape text;           -- mummy, rectangular, wide, tapered
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS inflation_method text;    -- breath, pump, self-inflating, none

-- === CLOTHING (insulated) ===
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS pockets integer;          -- number of pockets
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS packable boolean;         -- stuffs into own pocket

-- === COMMUNITY DATA (future pipeline) ===
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS community_rating real;    -- 1-10 aggregated rating
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS pct_usage_percent real;   -- % of PCT hikers using this
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS pairs_per_thru real;      -- shoes: avg pairs per thru-hike
