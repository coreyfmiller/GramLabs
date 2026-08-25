-- ============================================
-- HikeMind: Gear Candidates Staging Table
-- Run this in Supabase SQL Editor
--
-- This table mirrors gear_items but adds review workflow columns.
-- Items live here until admin approves them, then get copied to gear_items.
-- The live database is NEVER touched by automation.
-- ============================================

CREATE TABLE IF NOT EXISTS gear_candidates (
  -- Same columns as gear_items
  id TEXT PRIMARY KEY DEFAULT ('candidate-' || gen_random_uuid()::text),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  tier TEXT NOT NULL DEFAULT 'mid',
  weight_oz REAL NOT NULL,
  price_usd REAL NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT,

  -- Shelter specs
  shelter_type TEXT,
  capacity INTEGER,
  seasons TEXT,
  setup_type TEXT,
  floor_area REAL,
  peak_height REAL,
  packed_size TEXT,
  fabric TEXT,
  fabric_denier INTEGER,
  stakes_needed INTEGER,
  doors INTEGER,
  vestibule_area REAL,

  -- Sleep specs
  temp_rating REAL,
  fill_type TEXT,
  fill_power INTEGER,
  fill_weight REAL,
  sleep_style TEXT,
  r_value REAL,
  thickness REAL,
  pad_width REAL,
  pad_length REAL,

  -- Pack specs
  volume REAL,
  frame_type TEXT,
  hip_belt TEXT,

  -- Kitchen specs
  fuel_type TEXT,
  boil_time REAL,
  igniter BOOLEAN,
  pot_included BOOLEAN,
  simmer_control BOOLEAN,

  -- Electronics specs
  lumens REAL,
  battery_type TEXT,
  runtime REAL,

  -- Poles
  pole_material TEXT,

  -- Clothing
  waterproof BOOLEAN,
  hood_type TEXT,

  -- Community
  community_rating REAL,

  -- === STAGING WORKFLOW COLUMNS ===
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  source_url TEXT, -- manufacturer page we pulled specs from
  duplicate_of TEXT REFERENCES gear_items(id), -- if dedup found a possible match
  match_notes TEXT, -- why dedup flagged it (e.g. "85% name similarity with existing item")
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent exact duplicates in the staging table
  UNIQUE(brand, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gear_candidates_status ON gear_candidates(status);
CREATE INDEX IF NOT EXISTS idx_gear_candidates_brand ON gear_candidates(brand);
CREATE INDEX IF NOT EXISTS idx_gear_candidates_category ON gear_candidates(category);
CREATE INDEX IF NOT EXISTS idx_gear_candidates_created ON gear_candidates(created_at DESC);

-- RLS: authenticated users only
ALTER TABLE gear_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read gear candidates"
  ON gear_candidates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert gear candidates"
  ON gear_candidates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update gear candidates"
  ON gear_candidates FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete gear candidates"
  ON gear_candidates FOR DELETE TO authenticated USING (true);

-- Service role full access (for scripts)
GRANT ALL ON gear_candidates TO service_role;

-- ============================================
-- DONE.
-- Next: run the brand audit script to populate gear_candidates
-- Then: review at /admin/catalog
-- ============================================
