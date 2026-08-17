-- Run this in Supabase SQL Editor to create the gear_items table

CREATE TABLE IF NOT EXISTS gear_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  tier TEXT NOT NULL,
  weight_oz REAL NOT NULL,
  price_usd REAL NOT NULL,
  description TEXT NOT NULL,
  url TEXT,
  shelter_type TEXT,
  capacity INTEGER,
  seasons TEXT,
  temp_rating REAL,
  fill_type TEXT,
  sleep_style TEXT,
  r_value REAL,
  thickness REAL,
  pad_width REAL,
  pad_length REAL,
  volume REAL,
  fuel_type TEXT,
  lumens REAL,
  pole_material TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security but allow public reads
ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON gear_items
  FOR SELECT USING (true);

-- Create index for fast category filtering
CREATE INDEX idx_gear_items_category ON gear_items(category);
CREATE INDEX idx_gear_items_subcategory ON gear_items(subcategory);

-- Full text search index
ALTER TABLE gear_items ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(description, ''))
  ) STORED;

CREATE INDEX idx_gear_items_fts ON gear_items USING gin(fts);
