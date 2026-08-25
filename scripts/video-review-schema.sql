-- ============================================
-- HikeMind: Video Review System
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Wipe all existing youtube_video_ids (unreliable data)
UPDATE gear_items SET youtube_video_ids = NULL;

-- Step 2: Create video_candidates table
CREATE TABLE IF NOT EXISTS video_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gear_item_id TEXT NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL DEFAULT '',
  channel_name TEXT NOT NULL DEFAULT '',
  match_confidence TEXT NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate candidates for the same video+item combo
  UNIQUE(gear_item_id, video_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_video_candidates_status ON video_candidates(status);
CREATE INDEX IF NOT EXISTS idx_video_candidates_gear_item ON video_candidates(gear_item_id);
CREATE INDEX IF NOT EXISTS idx_video_candidates_created ON video_candidates(created_at DESC);

-- Step 3: RLS policies (admin-only write, no public access)
ALTER TABLE video_candidates ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read (admin check happens in the API layer)
CREATE POLICY "Authenticated users can read video candidates"
  ON video_candidates
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert (the fetch script runs authenticated)
CREATE POLICY "Authenticated users can insert video candidates"
  ON video_candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update (approve/reject)
CREATE POLICY "Authenticated users can update video candidates"
  ON video_candidates
  FOR UPDATE
  TO authenticated
  USING (true);

-- Step 4: Grant service role full access (for the GitHub Action / scripts)
GRANT ALL ON video_candidates TO service_role;

-- ============================================
-- DONE. 
-- Next: run the YouTube fetch script to populate video_candidates
-- Then: review at /admin/videos
-- ============================================
