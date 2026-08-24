"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { usePackStore } from "@/store/pack-store";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/data/gear-database";
import { formatWeightWithUnit } from "@/utils/format";
import { WeightDonut } from "./WeightDonut";
import { TwoRingDonut } from "./TwoRingDonut";
import { HorizontalStackedBar } from "./HorizontalStackedBar";
import { ChartToggle, useChartType } from "./ChartToggle";
import { cn } from "@/lib/utils";

interface PackAnalysis {
  score: number;
  classification: string;
  summary: string;
  redFlags?: string[];
  redundancies?: string[];
  missingEssentials?: string[];
  weightOpportunities?: { item: string; currentOz: number; suggestion: string; savingsOz: number; estimatedCost: string }[];
  systemNotes?: string[];
}

const DEFAULT_TARGET_OZ = 160; // 10 lb

export function StatsPanel() {
  const getBaseWeight = usePackStore((s) => s.getBaseWeight);
  const getTotalWeight = usePackStore((s) => s.getTotalWeight);
  const getWornWeight = usePackStore((s) => s.getWornWeight);
  const getConsumableWeight = usePackStore((s) => s.getConsumableWeight);
  const getBig3Weight = usePackStore((s) => s.getBig3Weight);
  const getTotalCost = usePackStore((s) => s.getTotalCost);
  const getCategoryBreakdown = usePackStore((s) => s.getCategoryBreakdown);
  const loadouts = usePackStore((s) => s.loadouts);
  const activeLoadoutId = usePackStore((s) => s.activeLoadoutId);
  const weightUnit = usePackStore((s) => s.weightUnit);
  const customCategories = usePackStore((s) => s.customCategories);

  const [targetOz, setTargetOz] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hikemind-weight-goal");
      return saved ? parseFloat(saved) : DEFAULT_TARGET_OZ;
    }
    return DEFAULT_TARGET_OZ;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [chartType, setChartType] = useChartType();

  const items = loadouts.find((l) => l.id === activeLoadoutId)?.items ?? [];
  const baseWeight = getBaseWeight();
  const totalWeight = getTotalWeight();
  const wornWeight = getWornWeight();
  const consumableWeight = getConsumableWeight();
  const big3Weight = getBig3Weight();
  const totalCost = getTotalCost();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const breakdown = getCategoryBreakdown();

  const pct = Math.min(baseWeight / targetOz, 1.4);
  const underTarget = baseWeight <= targetOz;

  function saveGoal(lbs: number) {
    const oz = lbs * 16;
    setTargetOz(oz);
    localStorage.setItem("hikemind-weight-goal", String(oz));
    setEditingGoal(false);
  }

  // Build color map including custom categories
  const allColors: Record<string, string> = { ...CATEGORY_COLORS };
  const allLabels: Record<string, string> = { ...CATEGORY_LABELS };
  customCategories.forEach((c) => {
    allColors[c.id] = c.color;
    allLabels[c.id] = c.label;
  });

  // Compute Big 3 items for display
  const big3Categories = ["shelter", "sleep", "pack"];
  const big3Items = items
    .filter((i) => i.status === "packed" && big3Categories.includes(i.item.category))
    .sort((a, b) => b.item.weightOz * b.quantity - a.item.weightOz * a.quantity)
    .slice(0, 3);

  return (
    <div className="scroll-thin h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        {/* Distribution chart */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Distribution
            </h2>
            <ChartToggle value={chartType} onChange={setChartType} />
          </div>

          {chartType === "donut" && (
            <WeightDonut breakdown={breakdown} baseWeight={baseWeight} categoryColors={allColors} categoryLabels={allLabels} weightUnit={weightUnit} />
          )}
          {chartType === "two-ring" && (
            <TwoRingDonut
              items={items.filter((i) => i.status === "packed").map((i) => ({
                id: i.gearId,
                name: i.item.name,
                brand: i.item.brand,
                category: i.item.category,
                weightOz: i.item.weightOz * i.quantity,
              }))}
              baseWeight={baseWeight}
              categoryColors={allColors}
              categoryLabels={allLabels}
              weightUnit={weightUnit}
            />
          )}
          {chartType === "bar" && (
            <HorizontalStackedBar
              items={items.filter((i) => i.status === "packed").map((i) => ({
                id: i.gearId,
                name: i.item.name,
                brand: i.item.brand,
                category: i.item.category,
                weightOz: i.item.weightOz * i.quantity,
              }))}
              baseWeight={baseWeight}
              categoryColors={allColors}
              categoryLabels={allLabels}
              weightUnit={weightUnit}
            />
          )}

          <div className="mt-4 border-t border-border pt-3">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                Base weight goal
              </span>
              <span
                className={cn(
                  "num shrink-0 whitespace-nowrap text-xs font-medium",
                  underTarget ? "text-primary" : "text-destructive"
                )}
              >
                {`${(Math.abs(targetOz - baseWeight) / 16).toFixed(1)} lb ${underTarget ? "under" : "over"}`}
              </span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-700 ease-out",
                  underTarget ? "bg-primary" : "bg-destructive"
                )}
                style={{ width: `${Math.min(pct, 1) * 100}%` }}
              />
            </div>
            {editingGoal ? (
              <form
                className="mt-2 flex items-center gap-2"
                onSubmit={(e) => { e.preventDefault(); const v = parseFloat(goalInput); if (v > 0) saveGoal(v); }}
              >
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-16 rounded border border-border bg-input px-2 py-1 text-xs num text-foreground focus:outline-none focus:border-primary/50"
                  autoFocus
                />
                <span className="text-[10px] text-muted-foreground">lb</span>
                <button type="submit" className="text-[10px] text-primary hover:underline">Save</button>
                <button type="button" onClick={() => setEditingGoal(false)} className="text-[10px] text-muted-foreground hover:underline">Cancel</button>
              </form>
            ) : (
              <button
                onClick={() => { setGoalInput(String(targetOz / 16)); setEditingGoal(true); }}
                className="mt-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors"
              >
                {(targetOz / 16).toFixed(1)} lb target · click to change
              </button>
            )}
          </div>
        </section>

        {/* Big 3 */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              The Big 3
            </h2>
            <span className="num text-xs text-muted-foreground">
              {baseWeight > 0
                ? `${((big3Weight / baseWeight) * 100).toFixed(0)}% of base`
                : "—"}
            </span>
          </div>

          <p className="num text-[36px] font-semibold leading-none tracking-tight text-primary">
            {(big3Weight / 16).toFixed(2)}
            <span className="ml-1.5 text-base font-normal text-muted-foreground">
              lb
            </span>
          </p>

          <ul className="mt-3 flex flex-col divide-y divide-white/[0.07]">
            {big3Items.map((packItem) => (
              <li
                key={packItem.gearId}
                className="flex items-center gap-2.5 py-2"
              >
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      allColors[packItem.item.category] || "#888",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">
                    {allLabels[packItem.item.category] || packItem.item.category}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {packItem.item.brand} {packItem.item.name}
                  </p>
                </div>
                <span className="num shrink-0 text-sm font-medium">
                  {formatWeightWithUnit(packItem.item.weightOz * packItem.quantity, weightUnit)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Weight + cost summary */}
        <section className="grid grid-cols-2 gap-3">
          <SummaryTile
            label="Worn"
            value={formatWeightWithUnit(wornWeight, weightUnit)}
          />
          <SummaryTile
            label="Consumables"
            value={formatWeightWithUnit(consumableWeight, weightUnit)}
          />
          <SummaryTile
            label="Skin-out total"
            value={formatWeightWithUnit(totalWeight, weightUnit)}
          />
          <SummaryTile
            label="Kit cost"
            value={`$${totalCost.toLocaleString("en-US")}`}
            accent
          />
        </section>

        {/* Pack Analyzer */}
        <PackAnalyzer />
      </div>
    </div>
  );
}

function PackAnalyzer() {
  const loadouts = usePackStore((s) => s.loadouts);
  const activeLoadoutId = usePackStore((s) => s.activeLoadoutId);
  const items = loadouts.find((l) => l.id === activeLoadoutId)?.items ?? [];

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PackAnalysis | null>(null);
  const [error, setError] = useState("");
  const [tripContext, setTripContext] = useState("3-season");

  async function handleAnalyze() {
    if (items.length === 0) return;
    setLoading(true);
    setError("");
    setAnalysis(null);

    const packItems = items.map((pi) => ({
      name: pi.item.name,
      brand: pi.item.brand,
      category: pi.item.category,
      subcategory: pi.item.subcategory,
      weightOz: pi.item.weightOz,
      priceUsd: pi.item.priceUsd,
      status: pi.status,
      quantity: pi.quantity,
      tempRating: pi.item.tempRating,
      rValue: pi.item.rValue,
      fillType: pi.item.fillType,
      waterproof: pi.item.waterproof,
      volume: pi.item.volume,
      shelterType: pi.item.shelterType,
      capacity: pi.item.capacity,
      seasons: pi.item.seasons,
    }));

    try {
      const res = await fetch("/api/analyze-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: packItems, tripContext }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setAnalysis(data.analysis);
    } catch {
      setError("Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Pack Analyzer
        </h2>
        <span className="ml-auto rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
          Pro
        </span>
      </div>

      {!analysis ? (
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Get expert-level system analysis of your pack. Identifies warmth gaps, redundancies, weight opportunities, and missing essentials.
          </p>
          <select
            value={tripContext}
            onChange={(e) => setTripContext(e.target.value)}
            className="w-full form-input text-xs"
          >
            <option value="3-season">3-Season (25-40°F lows)</option>
            <option value="Summer (lows above 45°F)">Summer (lows above 45°F)</option>
            <option value="Shoulder season (15-30°F lows, possible snow)">Shoulder Season (15-30°F lows)</option>
            <option value="Winter (below 15°F, snow)">Winter (below 15°F)</option>
            <option value="PCT thru-hike (desert through Sierra)">PCT Thru-Hike</option>
            <option value="AT thru-hike (humid east coast, rocky terrain)">AT Thru-Hike</option>
            <option value="Weekend trip, mild conditions">Weekend (mild)</option>
          </select>
          <button
            onClick={handleAnalyze}
            disabled={loading || items.length === 0}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                Analyze My Pack
              </>
            )}
          </button>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground/60 text-center">Add items to your pack first</p>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Score */}
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                "num text-3xl font-bold",
                analysis.score >= 8 ? "text-primary" : analysis.score >= 5 ? "text-yellow-400" : "text-destructive"
              )}>
                {analysis.score}<span className="text-sm text-muted-foreground">/10</span>
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{analysis.classification}</p>
            </div>
            <button
              onClick={() => setAnalysis(null)}
              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1"
            >
              Re-analyze
            </button>
          </div>

          {/* Summary */}
          <p className="text-xs leading-relaxed text-foreground/80">{analysis.summary}</p>

          {/* Red Flags */}
          {analysis.redFlags && analysis.redFlags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-destructive font-semibold">Red Flags</p>
              {analysis.redFlags.map((flag: string, i: number) => (
                <p key={i} className="text-xs text-destructive/90 bg-destructive/10 rounded px-2.5 py-1.5 border border-destructive/20">{flag}</p>
              ))}
            </div>
          )}

          {/* Missing Essentials */}
          {analysis.missingEssentials && analysis.missingEssentials.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-yellow-400 font-semibold">Missing Essentials</p>
              {analysis.missingEssentials.map((item: string, i: number) => (
                <p key={i} className="text-xs text-yellow-400/90 bg-yellow-400/10 rounded px-2.5 py-1.5 border border-yellow-400/20">{item}</p>
              ))}
            </div>
          )}

          {/* Redundancies */}
          {analysis.redundancies && analysis.redundancies.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold">Redundancies</p>
              {analysis.redundancies.map((item: string, i: number) => (
                <p key={i} className="text-xs text-muted-foreground bg-blue-400/5 rounded px-2.5 py-1.5 border border-blue-400/20">{item}</p>
              ))}
            </div>
          )}

          {/* Weight Opportunities */}
          {analysis.weightOpportunities && analysis.weightOpportunities.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Weight Savings</p>
              {analysis.weightOpportunities.map((opp: { item: string; currentOz: number; suggestion: string; savingsOz: number; estimatedCost: string }, i: number) => (
                <div key={i} className="text-xs bg-primary/5 rounded px-2.5 py-2 border border-primary/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{opp.item}</span>
                    <span className="num text-primary font-semibold">-{opp.savingsOz}oz</span>
                  </div>
                  <p className="text-muted-foreground">{opp.suggestion}</p>
                  <p className="text-muted-foreground/60 mt-0.5">{opp.estimatedCost}</p>
                </div>
              ))}
            </div>
          )}

          {/* System Notes */}
          {analysis.systemNotes && analysis.systemNotes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">System Notes</p>
              {analysis.systemNotes.map((note: string, i: number) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">• {note}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SummaryTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 transition-colors hover:border-white/20">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "num mt-1 text-base font-semibold tracking-tight",
          accent ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
