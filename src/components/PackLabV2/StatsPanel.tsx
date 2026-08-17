"use client";

import { Sparkles, TrendingDown } from "lucide-react";
import { usePackStore } from "@/store/pack-store";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/data/gear-database";
import { formatWeight } from "@/utils/format";
import { WeightDonut } from "./WeightDonut";
import { cn } from "@/lib/utils";

const UL_THRESHOLD_OZ = 160; // 10 lb

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

  const items = loadouts.find((l) => l.id === activeLoadoutId)?.items ?? [];
  const baseWeight = getBaseWeight();
  const totalWeight = getTotalWeight();
  const wornWeight = getWornWeight();
  const consumableWeight = getConsumableWeight();
  const big3Weight = getBig3Weight();
  const totalCost = getTotalCost();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const breakdown = getCategoryBreakdown();

  const pct = Math.min(baseWeight / UL_THRESHOLD_OZ, 1.4);
  const underTarget = baseWeight <= UL_THRESHOLD_OZ;

  // Compute Big 3 items for display
  const big3Categories = ["shelter", "sleep", "pack"];
  const big3Items = items
    .filter((i) => i.status === "packed" && big3Categories.includes(i.item.category))
    .sort((a, b) => b.item.weightOz * b.quantity - a.item.weightOz * a.quantity)
    .slice(0, 3);

  return (
    <div className="scroll-thin h-full min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        {/* Donut */}
        <section className="glass rounded-xl border border-white/10 p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Distribution
            </h2>
            <span className="num text-xs text-muted-foreground">
              {itemCount} items
            </span>
          </div>
          <WeightDonut breakdown={breakdown} baseWeight={baseWeight} />

          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                Ultralight target
              </span>
              <span
                className={cn(
                  "num shrink-0 whitespace-nowrap text-xs font-medium",
                  underTarget ? "text-primary" : "text-destructive"
                )}
              >
                {`${(Math.abs(UL_THRESHOLD_OZ - baseWeight) / 16).toFixed(1)} lb ${underTarget ? "under" : "over"}`}
              </span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-700 ease-out",
                  underTarget ? "bg-primary" : "bg-destructive"
                )}
                style={{ width: `${Math.min(pct, 1) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              10 lb base weight threshold
            </p>
          </div>
        </section>

        {/* Big 3 */}
        <section className="glass rounded-xl border border-white/10 p-4">
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
                      CATEGORY_COLORS[packItem.item.category],
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">
                    {CATEGORY_LABELS[packItem.item.category]}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {packItem.item.brand} {packItem.item.name}
                  </p>
                </div>
                <span className="num shrink-0 text-sm font-medium">
                  {(packItem.item.weightOz * packItem.quantity).toFixed(1)}
                  <span className="ml-0.5 text-[10px] text-muted-foreground">
                    oz
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Weight + cost summary */}
        <section className="grid grid-cols-2 gap-3">
          <SummaryTile
            label="Worn"
            value={`${wornWeight.toFixed(1)} oz`}
          />
          <SummaryTile
            label="Consumables"
            value={`${consumableWeight.toFixed(1)} oz`}
          />
          <SummaryTile
            label="Skin-out total"
            value={formatWeight(totalWeight)}
          />
          <SummaryTile
            label="Kit cost"
            value={`$${totalCost.toLocaleString("en-US")}`}
            accent
          />
        </section>

        {/* Suggestions placeholder */}
        <section className="glass rounded-xl border border-white/10">
          <div className="flex items-center gap-2 border-b border-white/10 p-4">
            <Sparkles
              className="size-3.5 text-primary"
              aria-hidden="true"
            />
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              HikeMind Suggestions
            </h2>
          </div>

          <p className="p-4 text-sm leading-relaxed text-muted-foreground">
            Your kit is dialed in. No high-impact swaps left to recommend.
          </p>
        </section>
      </div>
    </div>
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
    <div className="glass rounded-xl border border-white/10 p-3 transition-colors hover:border-white/20">
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
