import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "coreyfmiller@gmail.com";

/**
 * POST /api/admin/enrich/save
 * Body options:
 *   { gearItemId, action: "approve_video", videoId, videoTitle, channelName }
 *   { gearItemId, action: "reject_video", videoId }
 *   { gearItemId, action: "set_url", url }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { gearItemId, action } = body as { gearItemId: string; action: string };

  if (!gearItemId || !action) {
    return NextResponse.json({ error: "gearItemId and action required" }, { status: 400 });
  }

  if (action === "approve_video") {
    const { videoId, videoTitle, channelName } = body as { videoId: string; videoTitle?: string; channelName?: string };
    if (!videoId) {
      return NextResponse.json({ error: "videoId required" }, { status: 400 });
    }

    // Get current video IDs
    const { data: item } = await supabase
      .from("gear_items")
      .select("youtube_video_ids")
      .eq("id", gearItemId)
      .single();

    const currentIds: string[] = item?.youtube_video_ids || [];

    if (currentIds.includes(videoId)) {
      return NextResponse.json({ success: true, message: "Already approved" });
    }

    // Add to gear item
    const { error: updateErr } = await supabase
      .from("gear_items")
      .update({ youtube_video_ids: [...currentIds, videoId] })
      .eq("id", gearItemId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Also store in video_candidates as approved (for audit trail)
    await supabase
      .from("video_candidates")
      .upsert({
        gear_item_id: gearItemId,
        video_id: videoId,
        video_title: videoTitle || "",
        channel_name: channelName || "",
        status: "approved",
        reviewed_at: new Date().toISOString(),
      }, { onConflict: "gear_item_id,video_id" })
      .select();

    return NextResponse.json({ success: true, action: "approved", videoId });
  }

  if (action === "reject_video") {
    const { videoId } = body as { videoId: string };
    if (!videoId) {
      return NextResponse.json({ error: "videoId required" }, { status: 400 });
    }

    // Store as rejected so it never gets suggested again
    await supabase
      .from("video_candidates")
      .upsert({
        gear_item_id: gearItemId,
        video_id: videoId,
        video_title: "",
        channel_name: "",
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      }, { onConflict: "gear_item_id,video_id" })
      .select();

    return NextResponse.json({ success: true, action: "rejected", videoId });
  }

  if (action === "set_url") {
    const { url } = body as { url: string };
    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from("gear_items")
      .update({ url })
      .eq("id", gearItemId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: "url_saved", url });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
