import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { isValidPackId } from "@/lib/pack-id";
import { sanitizeSharePayload, MAX_PACK_NAME } from "@/lib/pack-share";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/packs/:id — load one pack. Readable if it's public OR owned by the caller.
 * RLS enforces this; we just surface a clean 404.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isValidPackId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_packs")
    .select("id, name, payload, is_public, view_count, updated_at, owner_id")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json({
    id: data.id,
    name: data.name,
    payload: data.payload,
    isPublic: data.is_public,
    viewCount: data.view_count,
    updatedAt: data.updated_at,
    isOwner: !!user && user.id === data.owner_id,
  });
}

/**
 * PUT /api/packs/:id — update an owned pack (name / payload / visibility). Login required.
 * Body: { name?, payload?, isPublic? }
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isValidPackId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const check = await rateLimit(req, { maxPerMinute: 20, requireAuth: true, feature: "save-pack" });
  if (check.error) return check.error;
  const user = check.user!;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.name != null) patch.name = String(body.name).slice(0, MAX_PACK_NAME) || "Untitled Pack";
  if (body.isPublic != null) patch.is_public = body.isPublic === true;
  if (body.payload != null) {
    const payload = sanitizeSharePayload(body.payload);
    if (!payload || payload.i.length === 0) {
      return NextResponse.json({ error: "A valid pack payload with at least one item is required." }, { status: 400 });
    }
    patch.payload = payload;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const supabase = await createClient();
  // owner_id filter + RLS both guard ownership; return the row to confirm it applied.
  const { data, error } = await supabase
    .from("user_packs")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found or not yours." }, { status: 404 });

  return NextResponse.json({ success: true, id, url: `/p/${id}` });
}

/**
 * DELETE /api/packs/:id — delete an owned pack. Login required.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isValidPackId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const check = await rateLimit(req, { maxPerMinute: 20, requireAuth: true, feature: "save-pack" });
  if (check.error) return check.error;
  const user = check.user!;

  const supabase = await createClient();
  const { error } = await supabase.from("user_packs").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
