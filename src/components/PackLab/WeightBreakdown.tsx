"use client";

import { usePackStore } from "@/store/pack-store";
import { CATEGORY_LABELS, CATEGORY_COLORS, GearCategory } from "@/data/gear-database";

export default function WeightBreakdown() {
  const { getBaseWeight, getCategoryBreakdown, items } = usePackStore();

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
          <span className="text-[36px] font-bold font-[family-name:var(--font-jetbrains-mono)] text-white">
            {baseWeightLb.toFixed(2)}
          </span>
          <span className="text-[14px] text-white/40">lb</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-2 h-2 rounded-full ${weightClass.bg}`} />
          <span className={`text-[11px] font-bold tracking-[0.15em] ${weightClass.color}`}>
            {weightClass.label}
          </span>
        </div>
      </div>

      {/* Visual bar breakdown */}
      <div>
        <div className="flex rounded-full h-3 overflow-hidden bg-white/5">
          {breakdown.map(({ category, percentage }) => (
            <div
              key={category}
              className="h-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: CATEGORY_COLORS[category],
              }}
            />
          ))}
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-2">
        {breakdown.map(({ category, weightOz, percentage }) => (
          <div key={category} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS[category] }}
              />
              <span className="text-[12px] text-white/70">
                {CATEGORY_LABELS[category]}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-[family-name:var(--font-jetbrains-mono)] text-white/50">
                {(weightOz / 16).toFixed(2)} lb
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
              ? `${((10 - baseWeightLb) * 16).toFixed(1)} oz under`
              : `${((baseWeightLb - 10) * 16).toFixed(1)} oz over`}
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
