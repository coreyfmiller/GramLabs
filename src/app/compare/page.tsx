"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Plus, Trophy, Share2, PackagePlus } from "lucide-react";
import { GearItem, GearCategory, TIER_LABELS, TIER_COLORS } from "@/data/gear-database";
import { searchGear, getGearByIds } from "@/lib/gear-api";
import { usePackStore } from "@/store/pack-store";
import { cn } from "@/lib/utils";
import { Nav } from "@/components/Nav";

// === SPEC DEFINITIONS PER CATEGORY ===
interface SpecDef {
  key: keyof GearItem;
  label: string;
  unit?: string;
  format?: (v: unknown) => string;
  lowerIsBetter?: boolean; // for winner detection
}

const COMMON_SPECS: SpecDef[] = [
  { key: "weightOz", label: "Weight", unit: "oz", lowerIsBetter: true },
  { key: "priceUsd", label: "Price", unit: "$", lowerIsBetter: true },
];

const CATEGORY_SPECS: Record<string, SpecDef[]> = {
  shelter: [
    { key: "capacity", label: "Capacity", unit: "person" },
    { key: "seasons", label: "Seasons" },
    { key: "setupType", label: "Setup Type" },
    { key: "floorArea", label: "Floor Area", unit: "sq ft" },
    { key: "peakHeight", label: "Peak Height", unit: "in" },
    { key: "fabric", label: "Fabric" },
    { key: "fabricDenier", label: "Denier", unit: "D", lowerIsBetter: true },
    { key: "doors", label: "Doors" },
    { key: "vestibuleArea", label: "Vestibule", unit: "sq ft" },
    { key: "stakesNeeded", label: "Stakes Needed", lowerIsBetter: true },
    { key: "packedSize", label: "Packed Size" },
  ],
  sleep: [
    { key: "tempRating", label: "Temp Rating", unit: "°F", lowerIsBetter: true },
    { key: "rValue", label: "R-Value" },
    { key: "fillType", label: "Fill Type" },
    { key: "fillPower", label: "Fill Power", unit: "FP" },
    { key: "fillWeight", label: "Fill Weight", unit: "oz" },
    { key: "thickness", label: "Thickness", unit: "in" },
    { key: "padWidth", label: "Width", unit: "in" },
    { key: "padLength", label: "Length", unit: "in" },
    { key: "sleepStyle", label: "Style" },
  ],
  pack: [
    { key: "volume", label: "Volume", unit: "L" },
    { key: "frameType", label: "Frame" },
    { key: "hipBelt", label: "Hip Belt" },
  ],
  kitchen: [
    { key: "fuelType", label: "Fuel Type" },
  ],
  electronics: [
    { key: "lumens", label: "Lumens" },
    { key: "batteryType", label: "Battery" },
    { key: "runtime", label: "Runtime", unit: "hrs" },
  ],
  accessories: [
    { key: "poleMaterial", label: "Material" },
    { key: "waterproof", label: "Waterproof", format: (v) => v ? "Yes" : "No" },
  ],
};

function getSpecsForCategory(category: string): SpecDef[] {
  return [...COMMON_SPECS, ...(CATEGORY_SPECS[category] || [])];
}

// === WINNER LOGIC ===
function getWinner(items: GearItem[], spec: SpecDef): string | null {
  const values = items.map((item) => item[spec.key]);
  const numericValues = values.filter((v): v is number => typeof v === "number");
  if (numericValues.length < 2) return null;

  const best = spec.lowerIsBetter
    ? Math.min(...numericValues)
    : Math.max(...numericValues);

  // Only mark winner if there's a clear difference
  const winnerIdx = values.findIndex((v) => v === best);
  const allSame = numericValues.every((v) => v === best);
  if (allSame) return null;

  return items[winnerIdx]?.id || null;
}

// === SEARCH COMPONENT ===
function ItemSearch({
  onSelect,
  excludeIds,
  lockedCategory,
}: {
  onSelect: (item: GearItem) => void;
  excludeIds: string[];
  lockedCategory?: GearCategory;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GearItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async () => {
    if (!query.trim() && !lockedCategory) {
      setResults([]);
      return;
    }
    setLoading(true);
    const items = await searchGear({
      query: query.trim() || undefined,
      category: lockedCategory || "all",
      limit: 20,
    });
    setResults(items.filter((i) => !excludeIds.includes(i.id)));
    setLoading(false);
  }, [query, lockedCategory, excludeIds]);

  useEffect(() => {
    const timer = setTimeout(doSearch, 250);
    return () => clearTimeout(timer);
  }, [doSearch]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-4 py-3">
        <Search className="size-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={lockedCategory ? `Search ${lockedCategory} gear...` : "Search gear to compare..."}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
        />
        {loading && <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-xl">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item);
                setQuery("");
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/[0.05] transition-colors border-b border-white/5 last:border-b-0"
            >
              <div>
                <span className="text-sm font-medium text-foreground">{item.brand} {item.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{item.category}</span>
              </div>
              <span className="num text-xs text-muted-foreground">{item.weightOz}oz · ${item.priceUsd}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-background/95 backdrop-blur-md p-4 text-center text-sm text-muted-foreground">
          No results found
        </div>
      )}
    </div>
  );
}

// === MAIN PAGE ===
export default function ComparePage() {
  const [items, setItems] = useState<GearItem[]>([]);
  const [copied, setCopied] = useState(false);
  const addItem = usePackStore((s) => s.addItem);

  // Load items from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ids = params.get("items")?.split(",").filter(Boolean);
    if (ids && ids.length > 0) {
      getGearByIds(ids).then((loaded) => {
        if (loaded.length > 0) setItems(loaded);
      });
    }
  }, []);

  // Update URL when items change
  useEffect(() => {
    if (items.length > 0) {
      const url = new URL(window.location.href);
      url.searchParams.set("items", items.map((i) => i.id).join(","));
      window.history.replaceState({}, "", url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("items");
      window.history.replaceState({}, "", url.toString());
    }
  }, [items]);

  const handleSelect = (item: GearItem) => {
    if (items.length >= 3) return;
    setItems((prev) => [...prev, item]);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lockedCategory = items.length > 0 ? items[0].category : undefined;
  const specs = lockedCategory ? getSpecsForCategory(lockedCategory) : [];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gear Compare</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select 2-3 items to compare side by side.{lockedCategory && <span className="text-primary"> Locked to {lockedCategory}.</span>}
          </p>
        </div>

        {/* Search + Selected Pills */}
        <div className="mb-8 space-y-4">
          {items.length < 3 && (
            <ItemSearch
              onSelect={handleSelect}
              excludeIds={items.map((i) => i.id)}
              lockedCategory={lockedCategory}
            />
          )}

          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-white/[0.03] px-3 py-1.5"
                >
                  <span className="text-sm font-medium">{item.brand} {item.name}</span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}

              {items.length >= 2 && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-white/[0.03] px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Share2 className="size-3.5" />
                  {copied ? "Copied!" : "Share"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20">
            <Plus className="size-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm">Search for gear above to start comparing</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Compare up to 3 items from the same category</p>
          </div>
        )}

        {/* Comparison Table */}
        {items.length >= 2 && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
            <table className="w-full">
              {/* Header row with item names */}
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-36">
                    Spec
                  </th>
                  {items.map((item) => (
                    <th key={item.id} className="p-4 text-center min-w-[180px]">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">{item.brand}</div>
                        <div className="text-sm font-semibold text-foreground">{item.name}</div>
                        <span
                          className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded"
                          style={{
                            backgroundColor: TIER_COLORS[item.tier] + "20",
                            color: TIER_COLORS[item.tier],
                            border: `1px solid ${TIER_COLORS[item.tier]}30`,
                          }}
                        >
                          {TIER_LABELS[item.tier]}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Spec rows */}
              <tbody>
                {specs.map((spec) => {
                  const values = items.map((item) => item[spec.key]);
                  const hasAnyValue = values.some((v) => v !== undefined && v !== null);
                  if (!hasAnyValue) return null;

                  const winnerId = getWinner(items, spec);

                  return (
                    <tr key={spec.key} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-xs font-medium text-muted-foreground">
                        {spec.label}
                      </td>
                      {items.map((item) => {
                        const val = item[spec.key];
                        const isWinner = winnerId === item.id;
                        let display: string;

                        if (val === undefined || val === null) {
                          display = "—";
                        } else if (spec.format) {
                          display = spec.format(val);
                        } else if (spec.key === "priceUsd") {
                          display = `$${val}`;
                        } else if (spec.unit) {
                          display = `${val} ${spec.unit}`;
                        } else {
                          display = String(val);
                        }

                        return (
                          <td
                            key={item.id}
                            className={cn(
                              "p-4 text-center num text-sm",
                              isWinner
                                ? "text-primary font-bold bg-primary/5"
                                : val === undefined || val === null
                                ? "text-muted-foreground/40"
                                : "text-foreground"
                            )}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              {display}
                              {isWinner && <Trophy className="size-3 text-primary" />}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Diffs row */}
                {items.length === 2 && (
                  <tr className="border-t border-white/10 bg-white/[0.02]">
                    <td className="p-4 text-xs font-medium text-primary">Difference</td>
                    <td colSpan={2} className="p-4 text-center">
                      <div className="flex justify-center gap-6">
                        <DiffBadge
                          label="Weight"
                          diff={items[0].weightOz - items[1].weightOz}
                          unit="oz"
                          lowerIsBetter
                          names={[items[0].name, items[1].name]}
                        />
                        <DiffBadge
                          label="Price"
                          diff={items[0].priceUsd - items[1].priceUsd}
                          unit="$"
                          lowerIsBetter
                          names={[items[0].name, items[1].name]}
                        />
                        {items[0].priceUsd !== items[1].priceUsd && items[0].weightOz !== items[1].weightOz && (
                          <ValuePerOz items={items} />
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Add to Pack row */}
                <tr className="border-t border-white/10">
                  <td className="p-4"></td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 text-center">
                      <button
                        onClick={() => addItem(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <PackagePlus className="size-3.5" />
                        Add to Pack
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Single item state */}
        {items.length === 1 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16">
            <p className="text-muted-foreground text-sm">Add one more item to compare</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Searching within {items[0].category} category</p>
          </div>
        )}
      </main>
    </div>
  );
}

// === DIFF COMPONENTS ===
function DiffBadge({
  label,
  diff,
  unit,
  lowerIsBetter,
  names,
}: {
  label: string;
  diff: number;
  unit: string;
  lowerIsBetter: boolean;
  names: [string, string];
}) {
  if (diff === 0) return null;
  const absDiff = Math.abs(diff);
  const winner = lowerIsBetter ? (diff > 0 ? names[1] : names[0]) : (diff > 0 ? names[0] : names[1]);
  const formatted = unit === "$" ? `$${absDiff.toFixed(0)}` : `${absDiff.toFixed(1)} ${unit}`;

  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="num text-sm font-bold text-primary">{formatted}</div>
      <div className="text-[10px] text-muted-foreground">{winner} wins</div>
    </div>
  );
}

function ValuePerOz({ items }: { items: GearItem[] }) {
  const weightDiff = Math.abs(items[0].weightOz - items[1].weightOz);
  const priceDiff = Math.abs(items[0].priceUsd - items[1].priceUsd);
  if (weightDiff === 0) return null;

  const costPerOz = priceDiff / weightDiff;

  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost per oz saved</div>
      <div className="num text-sm font-bold text-primary">${costPerOz.toFixed(2)}/oz</div>
      <div className="text-[10px] text-muted-foreground">weight tradeoff</div>
    </div>
  );
}
