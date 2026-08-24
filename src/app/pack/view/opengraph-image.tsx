import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HikeMind Pack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ searchParams }: { searchParams: { share?: string } }) {
  const share = searchParams?.share;

  let packName = "Shared Pack";
  let baseWeight = "0.0";
  let itemCount = 0;
  let categories: { name: string; pct: number; color: string }[] = [];

  if (share) {
    try {
      const data = JSON.parse(decodeURIComponent(atob(share)));
      packName = data.n || "Shared Pack";
      const items = data.i || [];
      const packed = items.filter((i: { s: string }) => i.s === "packed");
      const totalOz = packed.reduce((s: number, i: { w: number; q: number }) => s + i.w * i.q, 0);
      baseWeight = (totalOz / 16).toFixed(2);
      itemCount = items.reduce((s: number, i: { q: number }) => s + i.q, 0);

      // Category breakdown
      const catMap: Record<string, number> = {};
      packed.forEach((i: { c: string; w: number; q: number }) => {
        const cat = i.c || "accessories";
        catMap[cat] = (catMap[cat] || 0) + i.w * i.q;
      });

      const catColors: Record<string, string> = {
        shelter: "#60a5fa",
        sleep: "#a78bfa",
        pack: "#fbbf24",
        kitchen: "#fb923c",
        electronics: "#facc15",
        safety: "#f87171",
        accessories: "#4ade80",
      };

      categories = Object.entries(catMap)
        .map(([name, weight]) => ({
          name,
          pct: totalOz > 0 ? (weight / totalOz) * 100 : 0,
          color: catColors[name] || "#666",
        }))
        .sort((a, b) => b.pct - a.pct);
    } catch {
      // Invalid share data — use defaults
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#4ade80",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            ⛰
          </div>
          <span style={{ fontSize: "24px", fontWeight: 600, color: "#e5e5e5", letterSpacing: "-0.5px" }}>
            HikeMind
          </span>
        </div>

        {/* Pack name */}
        <h1 style={{ fontSize: "48px", fontWeight: 700, color: "#ffffff", margin: "0 0 20px 0", textAlign: "center" }}>
          {packName}
        </h1>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "48px", marginBottom: "36px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "36px", fontWeight: 700, color: "#4ade80", fontVariantNumeric: "tabular-nums" }}>
              {baseWeight}
            </span>
            <span style={{ fontSize: "14px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>
              lb base weight
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "36px", fontWeight: 700, color: "#e5e5e5", fontVariantNumeric: "tabular-nums" }}>
              {itemCount}
            </span>
            <span style={{ fontSize: "14px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>
              items
            </span>
          </div>
        </div>

        {/* Category bars */}
        <div style={{ display: "flex", gap: "4px", width: "500px", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
          {categories.map((cat, i) => (
            <div
              key={i}
              style={{
                width: `${cat.pct}%`,
                height: "100%",
                backgroundColor: cat.color,
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <p style={{ marginTop: "36px", fontSize: "16px", color: "#666" }}>
          gram-labs.vercel.app · Build yours free
        </p>
      </div>
    ),
    { ...size }
  );
}
