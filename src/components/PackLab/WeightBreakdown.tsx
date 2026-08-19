"use client";

import { usePackStore, formatWeight } from "@/store/pack-store";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/data/gear-database";

export default function WeightBreakdown() {
  const { getBaseWeight, getCategoryBreakdown, getItems, weightUnit } =
    usePackStore();
  const items = getItems();

  const baseWeightOz = getBaseWeight();
  const baseWeightLb = baseWeightOz / 16;
  const breakdown = getCategoryBreakdown();

  const weightClass =
    baseWeightLb < 10
      ? { label: "ULTRALIGHT", color: "text-lime-400", bg: "bg-lime-400" }
      : baseWeightLb < 15
      ? { label: "LIGHTWEIGHT", color: "text-yellow-400", bg: "bg-yellow-400" }
      : baseWeightLb < 20
      ? { label: "TRADITIONAL", color: "text-orange-400", bg: "bg-orange-400" }
      : { label: "HEAVY", color: "text-red-400", bg: "bg-red-400" };

  if (items.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
        <h3 className="text-[13px] font-bold tracking-[0.2em] text-white/60 uppercase mb-4">
          Weight Breakdown
        </h3>
        <p className="text-[13px] text-white/25 text-center">
          Add gear to see breakdown
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-5">
      {/* Base weight display */}
      <div>
        <h3 className="text-[13px] font-bold tracking-[0.2em] text-white/60 uppercase mb-3">
          Base Weight
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-bold font-[family-name:var(--font-jetbrains-mono)] text-white">
            {formatWeight(baseWeightOz, weightUnit)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-2 h-2 rounded-full ${weightClass.bg}`} />
          <span
            className={`text-[11px] font-bold tracking-[0.15em] ${weightClass.color}`}
          >
            {weightClass.label}
          </span>
        </div>
      </div>

      {/* Donut Chart */}
      <DonutChart
        breakdown={breakdown}
        centerLabel={formatWeight(baseWeightOz, weightUnit)}
      />

      {/* Category list */}
      <div className="space-y-2">
        {breakdown.map(({ category, weightOz, percentage }) => (
          <div key={category} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: (CATEGORY_COLORS as Record<string, string>)[category] || "#888" }}
              />
              <span className="text-[12px] text-white/70">
                {(CATEGORY_LABELS as Record<string, string>)[category] || category}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-[family-name:var(--font-jetbrains-mono)] text-white/50">
                {formatWeight(weightOz, weightUnit)}
              </span>
              <span className="text-[10px] font-[family-name:var(--font-jetbrains-mono)] text-white/30 w-8 text-right">
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Target indicator */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-white/40 uppercase tracking-wide">
            Target: &lt;10 lb
          </span>
          <span className="text-[11px] font-[family-name:var(--font-jetbrains-mono)] text-white/40">
            {baseWeightLb <= 10
              ? `${formatWeight((10 - baseWeightLb) * 16, weightUnit)} under`
              : `${formatWeight((baseWeightLb - 10) * 16, weightUnit)} over`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              baseWeightLb <= 10 ? "bg-lime-400" : "bg-red-400"
            }`}
            style={{ width: `${Math.min((baseWeightLb / 10) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function DonutChart({
  breakdown,
  centerLabel,
}: {
  breakdown: { category: string; weightOz: number; percentage: number }[];
  centerLabel: string;
}) {
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let cumulativePercentage = 0;

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Category segments */}
        {breakdown.map(({ category, percentage }) => {
          const offset = circumference * (1 - cumulativePercentage / 100);
          const segmentLength = (percentage / 100) * circumference;
          cumulativePercentage += percentage;

          return (
            <circle
              key={category}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={(CATEGORY_COLORS as Record<string, string>)[category] || "#888"}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-500"
            />
          );
        })}
        {/* Center text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-white text-[13px] font-bold"
          style={{ fontFamily: "var(--font-jetbrains-mono)" }}
        >
          {centerLabel}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-white/40 text-[9px] uppercase tracking-widest"
        >
          base weight
        </text>
      </svg>
    </div>
  );
}
