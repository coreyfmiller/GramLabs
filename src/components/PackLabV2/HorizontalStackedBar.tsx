"use client";

import { useState } from "react";
import { formatWeightWithUnit } from "@/utils/format";

interface ItemData {
  id: string;
  name: string;
  brand: string;
  category: string;
  weightOz: number;
}

export interface HorizontalStackedBarProps {
  items: ItemData[];
  baseWeight: number;
  categoryColors: Record<string, string>;
  categoryLabels: Record<string, string>;
  weightUnit: "oz" | "g";
}

export function HorizontalStackedBar({ items, baseWeight, categoryColors, categoryLabels, weightUnit }: HorizontalStackedBarProps) {
  const [hover, setHover] = useState<{ type: "category" | "item"; id: string } | null>(null);

  if (baseWeight === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-6 w-full rounded-full bg-white/[0.05]" />
        <p className="text-center text-xs text-muted-foreground">No items</p>
      </div>
    );
  }

  // Group by category
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
      items: data.items.sort((a, b) => b.weightOz - a.weightOz),
      percentage: (data.weightOz / baseWeight) * 100,
      color: categoryColors[cat] || "#888",
      label: categoryLabels[cat] || cat,
    }))
    .sort((a, b) => b.weightOz - a.weightOz);

  const hoveredCategory = hover?.type === "category"
    ? hover.id
    : hover?.type === "item"
      ? items.find((i) => i.id === hover.id)?.category ?? null
      : null;

  // Center text
  let statLabel = `${(baseWeight / 16).toFixed(2)} lb`;
  let statSub = "base weight";
  if (hover?.type === "category") {
    const cat = categories.find((c) => c.category === hover.id);
    if (cat) {
      statLabel = formatWeightWithUnit(cat.weightOz, weightUnit);
      statSub = cat.label;
    }
  } else if (hover?.type === "item") {
    const item = items.find((i) => i.id === hover.id);
    if (item) {
      statLabel = formatWeightWithUnit(item.weightOz, weightUnit);
      statSub = `${item.brand} ${item.name}`;
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary stat */}
      <div className="flex items-baseline justify-between">
        <span className="num text-lg font-semibold tracking-tight text-foreground">{statLabel}</span>
        <span className="max-w-[140px] truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{statSub}</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-5 w-full overflow-hidden rounded-full bg-white/[0.05]">
        {categories.map((cat) => {
          const isDim = hoveredCategory !== null && hoveredCategory !== cat.category;
          const isActive = hover?.type === "category" && hover.id === cat.category;
          return (
            <div
              key={cat.category}
              className="relative h-full transition-opacity duration-200"
              style={{
                width: `${cat.percentage}%`,
                backgroundColor: cat.color,
                opacity: isDim ? 0.2 : 1,
                transform: isActive ? "scaleY(1.3)" : "scaleY(1)",
                transition: "opacity 200ms ease, transform 200ms ease",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHover({ type: "category", id: cat.category })}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </div>

      {/* Per-category rows with item breakdown */}
      <ul className="flex flex-col gap-1.5 mt-1">
        {categories.map((cat) => (
          <li key={cat.category}>
            <button
              type="button"
              onMouseEnter={() => setHover({ type: "category", id: cat.category })}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover({ type: "category", id: cat.category })}
              onBlur={() => setHover(null)}
              className="flex w-full items-center gap-2 text-left"
            >
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 truncate text-[12px] text-muted-foreground">{cat.label}</span>
              <span className="num text-[12px] font-medium">{formatWeightWithUnit(cat.weightOz, weightUnit)}</span>
              <span className="num w-9 text-right text-[11px] text-muted-foreground">{cat.percentage.toFixed(0)}%</span>
            </button>

            {/* Item-level mini-bar — always visible, compact */}
            <div className="ml-4 mt-1 flex h-1.5 w-[calc(100%-1rem)] overflow-hidden rounded-full bg-white/[0.03]">
              {cat.items.map((item) => {
                const pct = (item.weightOz / cat.weightOz) * 100;
                const isItemActive = hover?.type === "item" && hover.id === item.id;
                return (
                  <div
                    key={item.id}
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: cat.color,
                      opacity: isItemActive ? 1 : 0.5,
                      transform: isItemActive ? "scaleY(2)" : "scaleY(1)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={() => setHover({ type: "item", id: item.id })}
                    onMouseLeave={() => setHover({ type: "category", id: cat.category })}
                  />
                );
              })}
            </div>

            {/* Item labels — shown when category hovered */}
            {hoveredCategory === cat.category && (
              <ul className="ml-4 mt-0.5 flex flex-col">
                {cat.items.map((item) => (
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
