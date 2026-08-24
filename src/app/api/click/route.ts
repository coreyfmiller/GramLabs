import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/click
 *
 * Tracks an affiliate link click before redirecting the user.
 * Body: { gearItemId: string }
 * Returns: { url: string } — the affiliate or product URL to redirect to
 */
export async function POST(req: NextRequest) {
  try {
    const { gearItemId } = await req.json();
    if (!gearItemId) {
      return NextResponse.json({ error: "Missing gearItemId" }, { status: 400 });
    }

    // Get the item's affiliate URL (or fallback to regular URL)
    const { data: item } = await supabase
      .from("gear_items")
      .select("affiliate_url, url, affiliate_source")
      .eq("id", gearItemId)
      .single();

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const targetUrl = item.affiliate_url || item.url;
    if (!targetUrl) {
      return NextResponse.json({ error: "No URL available" }, { status: 404 });
    }

    // Get user if authenticated (optional — clicks work for anonymous too)
    let userId: string | null = null;
    try {
      const authSupabase = await createClient();
      const { data: { user } } = await authSupabase.auth.getUser();
      userId = user?.id || null;
    } catch {
      // Not authenticated — that's fine
    }

    // Hash IP for deduplication (not identification)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const ipHash = Buffer.from(ip).toString("base64").slice(0, 12);

    // Record the click (fire and forget — don't block the redirect)
    supabase.from("affiliate_clicks").insert({
      gear_item_id: gearItemId,
      user_id: userId,
      source: item.affiliate_source || null,
      ip_hash: ipHash,
    });

    return NextResponse.json({ url: targetUrl });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
