import { createClient } from "@/lib/supabase/client";

export interface Trip {
  id: string;
  name: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  distance_miles?: number;
  elevation_ft?: number;
  conditions?: string;
  overall_rating?: number;
  notes?: string;
  loadout_name?: string;
  loadout_snapshot?: { name: string; brand: string; category: string; weightOz: number }[];
  created_at: string;
}

export interface TripGearNote {
  id: string;
  trip_id: string;
  gear_name: string;
  gear_brand?: string;
  rating?: number;
  note?: string;
  tags: string[];
  created_at: string;
}

export interface CreateTripInput {
  name: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  distance_miles?: number;
  elevation_ft?: number;
  conditions?: string;
  overall_rating?: number;
  notes?: string;
  loadout_name?: string;
  loadout_snapshot?: { name: string; brand: string; category: string; weightOz: number }[];
}

export interface CreateGearNoteInput {
  trip_id: string;
  gear_name: string;
  gear_brand?: string;
  rating?: number;
  note?: string;
  tags?: string[];
}

// --- Trips ---

export async function getTrips(): Promise<Trip[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch trips:", error);
    return [];
  }
  return data || [];
}

export async function getTrip(id: string): Promise<Trip | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createTrip(input: CreateTripInput): Promise<Trip | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("trips")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error("Failed to create trip:", error);
    return null;
  }
  return data;
}

export async function updateTrip(id: string, updates: Partial<CreateTripInput>): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trips")
    .update(updates)
    .eq("id", id);

  return !error;
}

export async function deleteTrip(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", id);

  return !error;
}

// --- Gear Notes ---

export async function getGearNotes(tripId: string): Promise<TripGearNote[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_gear_notes")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");

  if (error) return [];
  return data || [];
}

export async function addGearNote(input: CreateGearNoteInput): Promise<TripGearNote | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_gear_notes")
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error("Failed to add gear note:", error);
    return null;
  }
  return data;
}

export async function updateGearNote(id: string, updates: Partial<CreateGearNoteInput>): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trip_gear_notes")
    .update(updates)
    .eq("id", id);

  return !error;
}

export async function deleteGearNote(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trip_gear_notes")
    .delete()
    .eq("id", id);

  return !error;
}
