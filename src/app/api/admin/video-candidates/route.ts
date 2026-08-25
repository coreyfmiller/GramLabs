import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "coreyfmiller@gmail.com";

async function verifyAdmin(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }), user: null, supabase: null };
  }
  return { error: null, user, supabase };
}

/**
 * GET /api/admin/video-candidates
 * Returns pending video candidates with gear item details.
 * Query params: status (default: pending), limit (default: 20), offset (default: 0)
 */
export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const { data: candidates, error: fetchError } = await supabase!
    .from("video_candidates")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Fetch gear item details for each candidate
  const gearItemIds = [...new Set((candidates || []).map((c) => c.gear_item_id))];
  let gearItems: Record<string, { id: string; name: string; brand: string; category: string; weight_oz: number; price_usd: number; url: string | null }> = {};

  if (gearItemIds.length > 0) {
    const { data: items } = await supabase!
      .from("gear_items")
      .select("id, name, brand, category, weight_oz, price_usd, url")
      .in("id", gearItemIds);

    if (items) {
      gearItems = Object.fromEntries(items.map((i) => [i.id, i]));
    }
  }

  // Get total count for pagination
  const { count } = await supabase!
    .from("video_candidates")
    .select("*", { count: "exact", head: true })
    .eq("status", status);

  const enriched = (candidates || []).map((c) => ({
    ...c,
    gear_item: gearItems[c.gear_item_id] || null,
  }));

  return NextResponse.json({ candidates: enriched, total: count || 0 });
}

/**
 * POST /api/admin/video-candidates
 * Body: { id, action: "approve" | "reject" }
 * On approve: adds video_id to the gear_item's youtube_video_ids array
 * On reject: marks as rejected so it won't be suggested again
 */
export async function POST(req: NextRequest) {
  const { error, supabase } = await verifyAdmin(req);
  if (error) return error;

  const { id, action } = await req.json() as { id: string; action: "approve" | "reject" };

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request. Need id and action (approve/reject)." }, { status: 400 });
  }

  // Get the candidate
  const { data: candidate, error: fetchErr } = await supabase!
    .from("video_candidates")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  if (candidate.status !== "pending") {
    return NextResponse.json({ error: `Already ${candidate.status}` }, { status: 400 });
  }

  // Update candidate status
  const { error: updateErr } = await supabase!
    .from("video_candidates")
    .update({ status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // If approved, add video_id to the gear_item's youtube_video_ids
  if (action === "approve") {
    // Get current video IDs for this gear item
    const { data: gearItem } = await supabase!
      .from("gear_items")
      .select("youtube_video_ids")
      .eq("id", candidate.gear_item_id)
      .single();

    const currentIds: string[] = gearItem?.youtube_video_ids || [];

    // Only add if not already present
    if (!currentIds.includes(candidate.video_id)) {
      const { error: gearUpdateErr } = await supabase!
        .from("gear_items")
        .update({ youtube_video_ids: [...currentIds, candidate.video_id] })
        .eq("id", candidate.gear_item_id);

      if (gearUpdateErr) {
        return NextResponse.json({ error: `Candidate approved but failed to update gear item: ${gearUpdateErr.message}` }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true, action, candidate_id: id });
}
