import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { generatePackId } from "@/lib/pack-id";
import { sanitizeSharePayload, MAX_PACK_NAME, type SharePayload } from "@/lib/pack-share";

/**
 * POST /api/packs — save the current pack. Login required.
 * Body: { name?, payload: SharePayload, isPublic?: boolean }
 * Returns: { id, url } where url is the /p/<id> public link.
 */
export async function POST(req: NextRequest) {
  const check = await rateLimit(req, { maxPerMinute: 12, requireAuth: true, feature: "save-pack" });
  if (check.error) return check.error;
  const user = check.user!;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = sanitizeSharePayload(body.payload);
  if (!payload) {
    return NextResponse.json({ error: "A valid pack payload with at least one item is required." }, { status: 400 });
  }
  if (payload.i.length === 0) {
    return NextResponse.json({ error: "Add at least one item before saving." }, { status: 400 });
  }

  const name = (body.name ? String(body.name) : payload.n).slice(0, MAX_PACK_NAME) || "Untitled Pack";
  const isPublic = body.isPublic === false ? false : true;
  const id = generatePackId();

  const supabase = await createClient();
  const { error } = await supabase.from("user_packs").insert({
    id,
    owner_id: user.id,
    name,
    payload,
    is_public: isPublic,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id, url: `/p/${id}` });
}

/**
 * GET /api/packs — list the signed-in user's saved packs (metadata only, newest first).
 */
export async function GET(req: NextRequest) {
  const check = await rateLimit(req, { maxPerMinute: 30, requireAuth: true, feature: "list-packs" });
  if (check.error) return check.error;
  const user = check.user!;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_packs")
    .select("id, name, is_public, view_count, created_at, updated_at, payload")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return a lightweight summary (item count) instead of the full payload per row.
  const packs = (data || []).map((row) => {
    const items = Array.isArray((row.payload as SharePayload | null)?.i) ? (row.payload as SharePayload).i.length : 0;
    return {
      id: row.id,
      name: row.name,
      isPublic: row.is_public,
      viewCount: row.view_count,
      itemCount: items,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
  return NextResponse.json({ packs });
}
