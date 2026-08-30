import { ImageResponse } from "next/og";
import { isValidPackId } from "@/lib/pack-id";

export const runtime = "edge";
export const alt = "HikeMind gear list";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const OZ_PER_LB = 16;

interface PayloadItem { nm: string; ca: string; wt: number; st: string; qt: number }
interface Payload { n?: string; i?: PayloadItem[] }

// Category colors mirror the app palette closely enough for a preview card.
const CAT_COLORS: Record<string, string> = {
  shelter: "#60a5fa", sleep: "#a78bfa", pack: "#fbbf24", kitchen: "#fb923c",
  electronics: "#facc15", clothing: "#34d399", safety: "#f87171", accessories: "#4ade80",
};
const FALLBACK_COLORS = ["#f97316", "#ec4899", "#14b8a6", "#8b5cf6", "#06b6d4", "#ef4444", "#6366f1", "#84cc16"];

/** Fetch the public pack row straight from Supabase REST (edge-friendly, anon key + RLS). */
async function fetchPayload(id: string): Promise<Payload | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isValidPackId(id)) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/user_packs?id=eq.${encodeURIComponent(id)}&is_public=eq.true&select=payload`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { payload: Payload }[];
    return rows[0]?.payload ?? null;
  } catch {
    return null;
  }
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await fetchPayload(id);

  let packName = "Shared gear list";
  let baseLb = "0.0";
  let totalLb = "0.0";
  let itemCount = 0;
  let cats: { pct: number; color: string }[] = [];

  if (payload) {
    packName = payload.n || "Shared gear list";
    const items = payload.i || [];
    itemCount = items.reduce((s, i) => s + (i.qt || 1), 0);
    const packed = items.filter((i) => (i.st || "packed") === "packed");
    const baseOz = packed.reduce((s, i) => s + (i.wt || 0) * (i.qt || 1), 0);
    const totalOz = items.reduce((s, i) => s + (i.wt || 0) * (i.qt || 1), 0);
    baseLb = (baseOz / OZ_PER_LB).toFixed(2);
    totalLb = (totalOz / OZ_PER_LB).toFixed(2);

    const catMap: Record<string, number> = {};
    packed.forEach((i) => { const c = i.ca || "accessories"; catMap[c] = (catMap[c] || 0) + (i.wt || 0) * (i.qt || 1); });
    cats = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, w], idx) => ({ pct: baseOz > 0 ? (w / baseOz) * 100 : 0, color: CAT_COLORS[name] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length] }));
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center", padding: "64px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "36px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>⛰</div>
          <span style={{ fontSize: "24px", fontWeight: 600, color: "#e5e5e5", letterSpacing: "-0.5px" }}>HikeMind</span>
        </div>

        <h1 style={{ fontSize: "56px", fontWeight: 700, color: "#ffffff", margin: "0 0 28px 0", textAlign: "center", maxWidth: "1000px", lineHeight: 1.1 }}>
          {packName}
        </h1>

        <div style={{ display: "flex", gap: "56px", marginBottom: "36px" }}>
          {[
            { v: baseLb, l: "lb base weight", c: "#4ade80" },
            { v: totalLb, l: "lb total", c: "#e5e5e5" },
            { v: String(itemCount), l: "items", c: "#e5e5e5" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "40px", fontWeight: 700, color: s.c }}>{s.v}</span>
              <span style={{ fontSize: "14px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>{s.l}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "3px", width: "560px", height: "14px", borderRadius: "7px", overflow: "hidden", background: "#262626" }}>
          {cats.map((c, i) => (
            <div key={i} style={{ width: `${c.pct}%`, height: "100%", backgroundColor: c.color }} />
          ))}
        </div>

        <p style={{ marginTop: "36px", fontSize: "16px", color: "#666" }}>gram-labs.vercel.app · Build your gear list free</p>
      </div>
    ),
    { ...size }
  );
}
