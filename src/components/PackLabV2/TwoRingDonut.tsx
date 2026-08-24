"use client";

import { useEffect, useRef, useState } from "react";
import { formatWeightWithUnit } from "@/utils/format";

const SIZE = 200;
const OUTER_STROKE = 10;
const INNER_STROKE = 18;
const OUTER_RADIUS = (SIZE - OUTER_STROKE) / 2;
const INNER_RADIUS = OUTER_RADIUS - OUTER_STROKE / 2 - INNER_STROKE / 2 - 3; // 3px gap between rings
const OUTER_CIRC = 2 * Math.PI * OUTER_RADIUS;
const INNER_CIRC = 2 * Math.PI * INNER_RADIUS;
const GAP_DEG = 1.5;

interface ItemData {
  id: string;
  name: string;
  brand: string;
  category: string;
  weightOz: number;
}

export interface TwoRingDonutProps {
  items: ItemData[];
  baseWeight: number;
  categoryColors: Record<string, string>;
  categoryLabels: Record<string, string>;
  weightUnit: "oz" | "g";
}

/** Animates 0→1 on mount for the ring reveal */
function useReveal(duration = 900) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration]);

  return progress;
}

export function TwoRingDonut({ items, baseWeight, categoryColors, categoryLabels, weightUnit }: TwoRingDonutProps) {
  const [hover, setHover] = useState<{ type: "category" | "item"; id: string } | null>(null);
  const progress = useReveal(900);

  if (baseWeight === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={INNER_RADIUS} fill="none" stroke="currentColor" strokeWidth={INNER_STROKE} className="text-white/[0.05]" />
            <circle cx={SIZE / 2} cy={SIZE / 2} r={OUTER_RADIUS} fill="none" stroke="currentColor" strokeWidth={OUTER_STROKE} className="text-white/[0.05]" />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">No items</span>
          </div>
        </div>
      </div>
    );
  }

  // Build category aggregation (inner ring)
  const categoryMap = new Map<string, { weightOz: number; items: ItemData[] }>();
  items.forEach((item) => {
    const entry = categoryMap.get(item.category) || { weightOz: 0, items: [] };
    entry.weightOz += item.weightOz;
    entry.items.push(item);
    categoryMap.set(item.category, entry);
  });

  const categories = Array.from(categoryMap.entries())
    .map(([cat, data]) => ({
      category: cat,
      weightOz: data.weightOz,
      items: data.items,
      percentage: (data.weightOz / baseWeight) * 100,
      color: categoryColors[cat] || "#888",
      label: categoryLabels[cat] || cat,
    }))
    .sort((a, b) => b.weightOz - a.weightOz);

  // Build inner ring arcs (categories)
  let innerOffset = -90;
  const innerArcs = categories.map((cat) => {
    const sweep = (cat.weightOz / baseWeight) * 360;
    const arc = {
      ...cat,
      rotation: innerOffset,
      length: Math.max((sweep - GAP_DEG) / 360, 0) * INNER_CIRC,
    };
    innerOffset += sweep;
    return arc;
  });

  // Build outer ring arcs (individual items, ordered by category)
  let outerOffset = -90;
  const outerArcs: {
    id: string;
    name: string;
    brand: string;
    category: string;
    weightOz: number;
    color: string;
    rotation: number;
    length: number;
  }[] = [];

  categories.forEach((cat) => {
    cat.items
      .sort((a, b) => b.weightOz - a.weightOz)
      .forEach((item) => {
        const sweep = (item.weightOz / baseWeight) * 360;
        outerArcs.push({
          id: item.id,
          name: item.name,
          brand: item.brand,
          category: item.category,
          weightOz: item.weightOz,
          color: cat.color,
          rotation: outerOffset,
          length: Math.max((sweep - GAP_DEG * 0.5) / 360, 0) * OUTER_CIRC,
        });
        outerOffset += sweep;
      });
  });

  // Center label logic
  let centerLabel = `${(baseWeight / 16).toFixed(2)}`;
  let centerSub = "lb base weight";

  if (hover?.type === "category") {
    const cat = categories.find((c) => c.category === hover.id);
    if (cat) {
      centerLabel = formatWeightWithUnit(cat.weightOz, weightUnit);
      centerSub = cat.label;
    }
  } else if (hover?.type === "item") {
    const item = outerArcs.find((a) => a.id === hover.id);
    if (item) {
      centerLabel = formatWeightWithUnit(item.weightOz, weightUnit);
      centerSub = item.name;
    }
  }

  const hoveredCategory = hover?.type === "category" ? hover.id : hover?.type === "item" ? outerArcs.find((a) => a.id === hover.id)?.category : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`Two-ring weight distribution: ${categories.map((c) => `${c.label} ${c.percentage.toFixed(0)}%`).join(", ")}`}
        >
          {/* Background tracks */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={INNER_RADIUS} fill="none" stroke="currentColor" strokeWidth={INNER_STROKE} className="text-white/[0.05]" />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={OUTER_RADIUS} fill="none" stroke="currentColor" strokeWidth={OUTER_STROKE} className="text-white/[0.05]" />

          {/* Inner ring — categories */}
          {innerArcs.map((arc) => {
            const isDim = hoveredCategory !== null && hoveredCategory !== arc.category;
            return (
              <circle
                key={`inner-${arc.category}`}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={INNER_RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={hover?.type === "category" && hover.id === arc.category ? INNER_STROKE + 3 : INNER_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${arc.length * progress} ${INNER_CIRC}`}
                transform={`rotate(${arc.rotation} ${SIZE / 2} ${SIZE / 2})`}
                opacity={isDim ? 0.2 : 1}
                style={{ transition: "opacity 200ms ease, stroke-width 200ms ease", cursor: "pointer" }}
                onMouseEnter={() => setHover({ type: "category", id: arc.category })}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}

          {/* Outer ring — individual items */}
          {outerArcs.map((arc) => {
            const isDim = hoveredCategory !== null && hoveredCategory !== arc.category;
            const isActive = hover?.type === "item" && hover.id === arc.id;
            return (
              <circle
                key={`outer-${arc.id}`}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={OUTER_RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={isActive ? OUTER_STROKE + 3 : OUTER_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${arc.length * progress} ${OUTER_CIRC}`}
                transform={`rotate(${arc.rotation} ${SIZE / 2} ${SIZE / 2})`}
                opacity={isDim ? 0.2 : isActive ? 1 : 0.7}
                style={{ transition: "opacity 200ms ease, stroke-width 200ms ease", cursor: "pointer" }}
                onMouseEnter={() => setHover({ type: "item", id: arc.id })}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-[26px] font-semibold leading-none tracking-tight text-foreground">
            {centerLabel}
          </span>
          <span className="mt-1.5 max-w-[110px] truncate text-center text-[10px] uppercase leading-tight tracking-[0.14em] text-muted-foreground">
            {centerSub}
          </span>
        </div>
      </div>

      {/* Legend — categories with item sub-rows on hover */}
      <ul className="flex w-full flex-col gap-0.5">
        {categories.map((cat) => (
          <li key={cat.category}>
            <button
              type="button"
              onMouseEnter={() => setHover({ type: "category", id: cat.category })}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover({ type: "category", id: cat.category })}
              onBlur={() => setHover(null)}
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-white/[0.05]"
            >
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 truncate text-[12px] text-muted-foreground">{cat.label}</span>
              <span className="num text-[12px] font-medium">{formatWeightWithUnit(cat.weightOz, weightUnit)}</span>
              <span className="num w-9 text-right text-[11px] text-muted-foreground">{cat.percentage.toFixed(0)}%</span>
            </button>
            {/* Item sub-rows — shown when this category is hovered */}
            {hoveredCategory === cat.category && (
              <ul className="ml-4 flex flex-col">
                {cat.items
                  .sort((a, b) => b.weightOz - a.weightOz)
                  .map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setHover({ type: "item", id: item.id })}
                        onMouseLeave={() => setHover({ type: "category", id: cat.category })}
                        className="flex w-full items-center gap-2 rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full opacity-60" style={{ backgroundColor: cat.color }} />
                        <span className="flex-1 truncate text-[11px] text-muted-foreground">{item.brand} {item.name}</span>
                        <span className="num text-[11px] text-muted-foreground">{formatWeightWithUnit(item.weightOz, weightUnit)}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
