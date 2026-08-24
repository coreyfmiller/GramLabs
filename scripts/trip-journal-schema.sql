-- Trip Journal Schema
-- Run this in Supabase SQL Editor to enable the trip journal feature.

-- Trips table
CREATE TABLE public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  start_date DATE,
  end_date DATE,
  distance_miles NUMERIC(6,1),
  elevation_ft INTEGER,
  conditions TEXT, -- free-form: "Hot and dry, 85F days, clear skies"
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  notes TEXT, -- general trip notes/reflections
  loadout_name TEXT, -- which loadout they took (snapshot name)
  loadout_snapshot JSONB, -- full gear list at time of trip (items array)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-item gear notes from a trip
CREATE TABLE public.trip_gear_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  gear_name TEXT NOT NULL, -- item name (not FK — loadout items may be custom)
  gear_brand TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  note TEXT,
  tags TEXT[] DEFAULT '{}', -- 'essential', 'too-heavy', 'didnt-use', 'broke', 'replace', 'perfect'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_trips_user ON public.trips(user_id);
CREATE INDEX idx_trips_date ON public.trips(user_id, start_date DESC);
CREATE INDEX idx_trip_gear_notes_trip ON public.trip_gear_notes(trip_id);

-- Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_gear_notes ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see/modify their own trips
CREATE POLICY "Users can view own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- Gear notes inherit access from their parent trip
CREATE POLICY "Users can view own trip gear notes" ON public.trip_gear_notes
  FOR SELECT USING (
    trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create trip gear notes" ON public.trip_gear_notes
  FOR INSERT WITH CHECK (
    trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own trip gear notes" ON public.trip_gear_notes
  FOR UPDATE USING (
    trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own trip gear notes" ON public.trip_gear_notes
  FOR DELETE USING (
    trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
  );
