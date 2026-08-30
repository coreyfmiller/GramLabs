"use client";

/**
 * Dependency-free SVG charts for the simple /list page.
 * All category charts take a generic Slice[] so free-text categories work.
 */
import { formatWeightWithUnit } from "@/utils/format";

export interface Slice {
  label: string;
  value: number; // weight in oz
  color: string;
}
export interface ItemPoint {
  label: string;
  weightOz: number;
  priceUsd: number;
  color: string;
}

export type ListChartType = "pie" | "donut" | "bar" | "stacked" | "treemap" | "scatter" | "split";

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};
function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start <= 180 ? "0" : "1";
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} L ${cx} ${cy} Z`;
}

function Legend({ slices, unit, total }: { slices: Slice[]; unit: "oz" | "g"; total: number }) {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
      {slices.map((s) => (
        <li key={s.label} className="flex items-center gap-2 text-xs">
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
          <span className="flex-1 truncate text-muted-foreground">{s.label}</span>
          <span className="num font-medium">{formatWeightWithUnit(s.value, unit)}</span>
          <span className="num w-9 text-right text-muted-foreground">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
        </li>
      ))}
    </ul>
  );
}

export function ListChart({
  type, slices, points, unit,
}: {
  type: ListChartType;
  slices: Slice[];
  points: ItemPoint[];
  unit: "oz" | "g";
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const data = slices.filter((s) => s.value > 0).sort((a, b) => b.value - a.value);

  if (total === 0 && type !== "scatter") {
    return <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Add items to see the chart</div>;
  }

  // PIE / DONUT
  if (type === "pie" || type === "donut") {
    const SIZE = 200, cx = SIZE / 2, cy = SIZE / 2, r = 92;
    let angle = 0;
    const arcs = data.map((s) => {
      const sweep = (s.value / total) * 360;
      const p = arcPath(cx, cy, r, angle, angle + sweep);
      angle += sweep;
      return { p, color: s.color, label: s.label };
    });
    return (
      <div className="flex flex-col items-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Weight by category">
          {arcs.map((a) => <path key={a.label} d={a.p} fill={a.color} stroke="var(--background,#000)" strokeWidth={1} />)}
          {type === "donut" && <circle cx={cx} cy={cy} r={r * 0.58} fill="var(--background,#000)" />}
          {type === "donut" && (
            <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: 20, fontWeight: 600 }}>
              {formatWeightWithUnit(total, unit)}
            </text>
          )}
          {type === "donut" && (
            <text x={cx} y={cy + 16} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9, letterSpacing: 1 }}>TOTAL</text>
          )}
        </svg>
        <Legend slices={data} unit={unit} total={total} />
      </div>
    );
  }

  // BAR (per category)
  if (type === "bar") {
    const max = Math.max(...data.map((s) => s.value), 1);
    return (
      <div className="flex flex-col gap-2">
        {data.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">{s.label}</span>
            <div className="flex-1 h-5 rounded bg-white/[0.05] overflow-hidden">
              <div className="h-full rounded" style={{ width: `${(s.value / max) * 100}%`, backgroundColor: s.color }} />
            </div>
            <span className="num w-16 text-right text-xs font-medium">{formatWeightWithUnit(s.value, unit)}</span>
          </div>
        ))}
      </div>
    );
  }

  // STACKED (single horizontal bar)
  if (type === "stacked") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex h-6 w-full overflow-hidden rounded-full bg-white/[0.05]">
          {data.map((s) => (
            <div key={s.label} title={`${s.label}: ${formatWeightWithUnit(s.value, unit)}`}
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} />
          ))}
        </div>
        <Legend slices={data} unit={unit} total={total} />
      </div>
    );
  }

  // TREEMAP (simple squarified-ish row layout)
  if (type === "treemap") {
    // Greedy rows: fit slices into rows sized by sqrt of total area.
    const W = 100, H = 62; // aspect units
    const areaTotal = total;
    let y = 0;
    const rows: { items: Slice[]; h: number }[] = [];
    let remaining = [...data];
    while (remaining.length) {
      const rowCount = Math.max(1, Math.round(Math.sqrt(remaining.length)));
      const row = remaining.slice(0, rowCount);
      const rowArea = row.reduce((a, s) => a + s.value, 0);
      const h = (rowArea / areaTotal) * H;
      rows.push({ items: row, h });
      remaining = remaining.slice(rowCount);
      y += h;
    }
    return (
      <div className="w-full" style={{ aspectRatio: `${W}/${H}` }}>
        <div className="flex h-full w-full flex-col gap-0.5">
          {rows.map((row, ri) => {
            const rowArea = row.items.reduce((a, s) => a + s.value, 0);
            return (
              <div key={ri} className="flex w-full gap-0.5" style={{ flex: row.h }}>
                {row.items.map((s) => (
                  <div key={s.label} className="flex items-center justify-center overflow-hidden rounded p-1"
                    style={{ flex: s.value / rowArea, backgroundColor: s.color }}
                    title={`${s.label}: ${formatWeightWithUnit(s.value, unit)}`}>
                    <span className="truncate text-[10px] font-medium text-black/70">{s.label}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // SPLIT (base / worn / consumable) — expects slices labeled Base/Worn/Consumable
  if (type === "split") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex h-6 w-full overflow-hidden rounded-full bg-white/[0.05]">
          {data.map((s) => (
            <div key={s.label} title={`${s.label}: ${formatWeightWithUnit(s.value, unit)}`}
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} />
          ))}
        </div>
        <Legend slices={data} unit={unit} total={total} />
      </div>
    );
  }

  // SCATTER (weight vs price)
  if (type === "scatter") {
    const pts = points.filter((p) => p.weightOz > 0 || p.priceUsd > 0);
    if (!pts.length) return <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Add items with weight & price</div>;
    const W = 320, H = 220, pad = 34;
    const maxW = Math.max(...pts.map((p) => p.weightOz), 1);
    const maxP = Math.max(...pts.map((p) => p.priceUsd), 1);
    const x = (w: number) => pad + (w / maxW) * (W - pad - 8);
    const yv = (p: number) => H - pad - (p / maxP) * (H - pad - 8);
    return (
      <div className="flex flex-col items-center">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weight vs price">
          <line x1={pad} y1={H - pad} x2={W - 4} y2={H - pad} stroke="currentColor" className="text-white/20" />
          <line x1={pad} y1={4} x2={pad} y2={H - pad} stroke="currentColor" className="text-white/20" />
          {pts.map((p, i) => (
            <circle key={i} cx={x(p.weightOz)} cy={yv(p.priceUsd)} r={4} fill={p.color} opacity={0.8}>
              <title>{`${p.label}: ${formatWeightWithUnit(p.weightOz, unit)}, $${p.priceUsd.toFixed(2)}`}</title>
            </circle>
          ))}
          <text x={(W + pad) / 2} y={H - 6} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>weight →</text>
          <text x={12} y={H / 2} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`} className="fill-muted-foreground" style={{ fontSize: 9 }}>price →</text>
        </svg>
      </div>
    );
  }

  return null;
}

export const CHART_OPTIONS: { value: ListChartType; label: string }[] = [
  { value: "donut", label: "Donut" },
  { value: "pie", label: "Pie" },
  { value: "bar", label: "Bar" },
  { value: "stacked", label: "Stacked" },
  { value: "treemap", label: "Treemap" },
  { value: "split", label: "Base/Worn/Consum." },
  { value: "scatter", label: "Weight × Price" },
];
