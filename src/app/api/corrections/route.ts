import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const ADMIN_EMAIL = "coreyfmiller@gmail.com";

const EDITABLE_FIELDS = ["weight", "price", "url", "name", "other"] as const;
type Field = (typeof EDITABLE_FIELDS)[number];
// Fields that require a manufacturer/evidence link to back the claim.
const SOURCE_REQUIRED: Field[] = ["weight", "price", "name"];

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * POST /api/corrections
 * Signed-in users submit a suggested correction to a gear item (or a generic report).
 * Body: { gear_id?, gear_name?, gear_brand?, field, current_value?, suggested_value, source_url?, note? }
 */
export async function POST(req: NextRequest) {
  // Login required + light IP throttle + per-user daily cap.
  const check = await rateLimit(req, {
    maxPerMinute: 6,
    dailyLimit: 25,
    requireAuth: true,
    feature: "corrections",
  });
  if (check.error) return check.error;
  const user = check.user!;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const field = String(body.field || "").toLowerCase() as Field;
  const suggested = String(body.suggested_value ?? "").trim();
  const sourceUrl = String(body.source_url ?? "").trim();
  const note = String(body.note ?? "").trim();

  if (!EDITABLE_FIELDS.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }
  if (!suggested || suggested.length > 2000) {
    return NextResponse.json({ error: "A suggested value is required (max 2000 chars)." }, { status: 400 });
  }
  // A url correction: the suggested value must itself be a valid URL.
  if (field === "url" && !isValidUrl(suggested)) {
    return NextResponse.json({ error: "Suggested URL must be a valid http(s) link." }, { status: 400 });
  }
  // Weight/price/name corrections must cite a manufacturer/evidence link.
  if (SOURCE_REQUIRED.includes(field)) {
    if (!sourceUrl || !isValidUrl(sourceUrl)) {
      return NextResponse.json(
        { error: "Please include a manufacturer/source link (valid http(s) URL) to back this change." },
        { status: 400 }
      );
    }
  }
  if (field === "other" && !body.gear_id && note.length < 5) {
    return NextResponse.json({ error: "Tell us a bit more about the issue." }, { status: 400 });
  }

  const gearId = body.gear_id != null && body.gear_id !== "" ? Number(body.gear_id) : null;
  if (body.gear_id != null && body.gear_id !== "" && Number.isNaN(gearId)) {
    return NextResponse.json({ error: "Invalid gear id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: insErr } = await supabase.from("gear_corrections").insert({
    gear_id: gearId,
    gear_name: body.gear_name ? String(body.gear_name).slice(0, 300) : null,
    gear_brand: body.gear_brand ? String(body.gear_brand).slice(0, 300) : null,
    field,
    current_value: body.current_value != null ? String(body.current_value).slice(0, 500) : null,
    suggested_value: suggested,
    source_url: sourceUrl || null,
    note: note ? note.slice(0, 2000) : null,
    submitter_id: user.id,
    submitter_email: user.email ?? null,
    status: "pending",
  });

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }), supabase: null };
  }
  return { error: null, supabase };
}

/**
 * GET /api/corrections?status=pending  (admin only) — list submissions.
 */
export async function GET(req: NextRequest) {
  const { error, supabase } = await verifyAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const { data, error: fetchErr } = await supabase!
    .from("gear_corrections")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  return NextResponse.json({ corrections: data || [] });
}

/**
 * PATCH /api/corrections  (admin only)
 * Body: { id, action: "approve" | "reject", final_value?, admin_note? }
 * Approve applies the change to clean_products (weight/price/url) and sets confidence=verified.
 * Name & 'other' are never auto-written — admin uses final_value or just records the decision.
 */
export async function PATCH(req: NextRequest) {
  const { error, supabase } = await verifyAdmin();
  if (error) return error;

  const { id, action, final_value, admin_note } = (await req.json()) as {
    id: number; action: "approve" | "reject"; final_value?: string; admin_note?: string;
  };
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Need id and action (approve/reject)" }, { status: 400 });
  }

  const { data: row, error: getErr } = await supabase!
    .from("gear_corrections").select("*").eq("id", id).single();
  if (getErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.status !== "pending") {
    return NextResponse.json({ error: `Already ${row.status}` }, { status: 400 });
  }

  if (action === "reject") {
    await supabase!.from("gear_corrections")
      .update({ status: "rejected", admin_note: admin_note ?? null, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    return NextResponse.json({ success: true, action: "rejected" });
  }

  // === APPROVE ===
  // Determine the value to write. Admin can override via final_value.
  const value = (final_value ?? row.suggested_value ?? "").toString().trim();
  let applied = false;

  if (row.gear_id && ["weight", "price", "url", "name"].includes(row.field)) {
    const patch: Record<string, unknown> = { confidence: "verified" };
    if (row.field === "weight") {
      // Accept grams or a "NNg"/"NN oz" string; store grams + recomputed oz.
      const grams = parseWeightGrams(value);
      if (grams == null) return NextResponse.json({ error: "Could not parse a weight in grams from the value." }, { status: 400 });
      patch.weight_g = grams;
      patch.weight_oz = Math.round((grams / 28.349523125) * 100) / 100;
    } else if (row.field === "price") {
      const usd = parseFloat(value.replace(/[^0-9.]/g, ""));
      if (Number.isNaN(usd)) return NextResponse.json({ error: "Could not parse a price." }, { status: 400 });
      patch.price_usd = usd;
    } else if (row.field === "url") {
      patch.url = value;
    } else if (row.field === "name") {
      patch.name = value.slice(0, 300);
    }
    const { error: upErr } = await supabase!.from("clean_products").update(patch).eq("id", row.gear_id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    applied = true;
  }

  await supabase!.from("gear_corrections")
    .update({ status: "approved", admin_note: admin_note ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ success: true, action: "approved", applied });
}

function parseWeightGrams(v: string): number | null {
  const s = v.trim().toLowerCase();
  let m = s.match(/([\d.]+)\s*g\b/) || s.match(/^([\d.]+)$/);
  if (m) { const n = parseFloat(m[1]); return Number.isNaN(n) ? null : Math.round(n); }
  m = s.match(/([\d.]+)\s*(oz|ounce)/);
  if (m) { const n = parseFloat(m[1]); return Number.isNaN(n) ? null : Math.round(n * 28.349523125); }
  m = s.match(/([\d.]+)\s*(kg)/);
  if (m) { const n = parseFloat(m[1]); return Number.isNaN(n) ? null : Math.round(n * 1000); }
  return null;
}
