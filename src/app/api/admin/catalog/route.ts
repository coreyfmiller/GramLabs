import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "coreyfmiller@gmail.com";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }), supabase: null };
  }
  return { error: null, supabase };
}

/**
 * GET /api/admin/catalog
 * Returns gear candidates with optional filters.
 * Query params: status (default: pending), category, brand, limit (default: 20), offset (default: 0)
 */
export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  let query = supabase!
    .from("gear_candidates")
    .select("*", { count: "exact" })
    .eq("status", status)
    .order("brand", { ascending: true })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (brand) query = query.ilike("brand", `%${brand}%`);
  if (search) query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);

  const { data: candidates, count, error: fetchErr } = await query;

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  // If any candidates have duplicate_of set, fetch those gear items for comparison
  const duplicateIds = (candidates || [])
    .map((c) => c.duplicate_of)
    .filter((id): id is string => id !== null);

  let duplicateItems: Record<string, { id: string; name: string; brand: string; weight_oz: number; price_usd: number; category: string }> = {};
  if (duplicateIds.length > 0) {
    const { data: dupes } = await supabase!
      .from("gear_items")
      .select("id, name, brand, weight_oz, price_usd, category")
      .in("id", [...new Set(duplicateIds)]);

    if (dupes) {
      duplicateItems = Object.fromEntries(dupes.map((d) => [d.id, d]));
    }
  }

  return NextResponse.json({
    candidates: candidates || [],
    duplicateItems,
    total: count || 0,
  });
}

/**
 * POST /api/admin/catalog
 * Body: { id, action: "approve" | "reject" }
 *
 * Approve: generates a clean ID, copies all spec columns into gear_items, marks candidate as approved.
 * Reject: marks candidate as rejected so it doesn't resurface.
 */
export async function POST(req: NextRequest) {
  const { error, supabase } = await verifyAdmin();
  if (error) return error;

  const { id, action } = await req.json() as { id: string; action: "approve" | "reject" };

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Need id and action (approve/reject)" }, { status: 400 });
  }

  // Fetch the candidate
  const { data: candidate, error: fetchErr } = await supabase!
    .from("gear_candidates")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  if (candidate.status !== "pending") {
    return NextResponse.json({ error: `Already ${candidate.status}` }, { status: 400 });
  }

  if (action === "reject") {
    const { error: updateErr } = await supabase!
      .from("gear_candidates")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    return NextResponse.json({ success: true, action: "rejected" });
  }

  // === APPROVE: Copy to gear_items ===

  // Generate a clean, URL-safe ID from brand + name
  const gearId = generateGearId(candidate.brand, candidate.name);

  // Check if this ID already exists in gear_items (final safety net)
  const { data: existing } = await supabase!
    .from("gear_items")
    .select("id")
    .eq("id", gearId)
    .single();

  if (existing) {
    // Mark as duplicate rather than failing
    await supabase!
      .from("gear_candidates")
      .update({ status: "rejected", match_notes: `Duplicate: gear_items already has id "${gearId}"`, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ error: `Item already exists in database with id "${gearId}"`, duplicate: true }, { status: 409 });
  }

  // Build the gear_items insert from candidate data
  const gearItem: Record<string, unknown> = {
    id: gearId,
    name: candidate.name,
    brand: candidate.brand,
    category: candidate.category,
    subcategory: candidate.subcategory || null,
    tier: candidate.tier || "mid",
    weight_oz: candidate.weight_oz,
    price_usd: candidate.price_usd,
    description: candidate.description || "",
    url: candidate.source_url || candidate.url || null,
    // Shelter
    shelter_type: candidate.shelter_type || null,
    capacity: candidate.capacity || null,
    seasons: candidate.seasons || null,
    setup_type: candidate.setup_type || null,
    floor_area: candidate.floor_area || null,
    peak_height: candidate.peak_height || null,
    packed_size: candidate.packed_size || null,
    fabric: candidate.fabric || null,
    fabric_denier: candidate.fabric_denier || null,
    stakes_needed: candidate.stakes_needed || null,
    doors: candidate.doors || null,
    vestibule_area: candidate.vestibule_area || null,
    // Sleep
    temp_rating: candidate.temp_rating || null,
    fill_type: candidate.fill_type || null,
    fill_power: candidate.fill_power || null,
    fill_weight: candidate.fill_weight || null,
    sleep_style: candidate.sleep_style || null,
    r_value: candidate.r_value || null,
    thickness: candidate.thickness || null,
    pad_width: candidate.pad_width || null,
    pad_length: candidate.pad_length || null,
    // Pack
    volume: candidate.volume || null,
    frame_type: candidate.frame_type || null,
    hip_belt: candidate.hip_belt || null,
    // Kitchen
    fuel_type: candidate.fuel_type || null,
    boil_time: candidate.boil_time || null,
    igniter: candidate.igniter ?? null,
    pot_included: candidate.pot_included ?? null,
    simmer_control: candidate.simmer_control ?? null,
    // Electronics
    lumens: candidate.lumens || null,
    battery_type: candidate.battery_type || null,
    runtime: candidate.runtime || null,
    // Poles
    pole_material: candidate.pole_material || null,
    // Clothing
    waterproof: candidate.waterproof ?? null,
    hood_type: candidate.hood_type || null,
    // Community
    community_rating: candidate.community_rating || null,
  };

  // Insert into gear_items
  const { error: insertErr } = await supabase!
    .from("gear_items")
    .insert(gearItem);

  if (insertErr) {
    return NextResponse.json({ error: `Failed to insert into gear_items: ${insertErr.message}` }, { status: 500 });
  }

  // Mark candidate as approved
  await supabase!
    .from("gear_candidates")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ success: true, action: "approved", gearItemId: gearId });
}

/**
 * Generate a URL-safe ID from brand + product name.
 * e.g., "Zpacks" + "Duplex" → "zpacks-duplex"
 */
function generateGearId(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
