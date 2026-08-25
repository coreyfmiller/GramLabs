import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "coreyfmiller@gmail.com";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * GET /api/admin/enrich?brand=Zpacks&name=Duplex
 * Performs a strict YouTube search for "[brand] [name] review"
 * Returns video candidates for admin approval.
 */
export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand");
  const name = searchParams.get("name");

  if (!brand || !name) {
    return NextResponse.json({ error: "brand and name required" }, { status: 400 });
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 500 });
  }

  // Strict YouTube search: exact brand + product name + "review"
  const query = `"${brand}" "${name}" review`;
  const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=8&type=video&videoDuration=medium&relevanceLanguage=en&key=${YOUTUBE_API_KEY}`;

  try {
    const ytRes = await fetch(ytUrl);
    const ytData = await ytRes.json();

    if (!ytRes.ok) {
      return NextResponse.json({ error: `YouTube API error: ${ytData.error?.message || "Unknown"}` }, { status: 500 });
    }

    const videos = (ytData.items || []).map((item: {
      id: { videoId: string };
      snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string } } };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || "",
    }));

    return NextResponse.json({ videos, query });
  } catch (error) {
    console.error("YouTube search error:", error);
    return NextResponse.json({ error: "Failed to search YouTube" }, { status: 500 });
  }
}
