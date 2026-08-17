"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, X, Loader2 } from "lucide-react";
import {
  GearCategory,
  GearItem,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SUBCATEGORIES,
} from "@/data/gear-database";
import { searchGear, getCategoryCounts, getSubcategoryCounts } from "@/lib/gear-api";
import { usePackStore } from "@/store/pack-store";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: GearCategory[] = [
  "shelter",
  "sleep",
  "pack",
  "kitchen",
  "electronics",
  "safety",
  "accessories",
];

export function GearSearch() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GearCategory | "all">("all");
  const [subFilter, setSubFilter] = useState<string | "all">("all");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [results, setResults] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [subCounts, setSubCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);

  const addItem = usePackStore((s) => s.addItem);
  const loadouts = usePackStore((s) => s.loadouts);
  const activeLoadoutId = usePackStore((s) => s.activeLoadoutId);
  const packItems = loadouts.find((l) => l.id === activeLoadoutId)?.items ?? [];
  const packIds = useMemo(() => packItems.map((i) => i.gearId), [packItems]);

  const activeSubcategories = filter !== "all" ? SUBCATEGORIES[filter] ?? [] : [];

  // Fetch category counts on mount
  useEffect(() => {
    getCategoryCounts().then((c) => {
      setCounts(c);
      setTotalCount(Object.values(c).reduce((s, n) => s + n, 0));
    });
  }, []);

  // Fetch subcategory counts when category changes
  useEffect(() => {
    if (filter !== "all") {
      getSubcategoryCounts(filter).then(setSubCounts);
    } else {
      setSubCounts({});
    }
  }, [filter]);

  // Search gear from Supabase
  const doSearch = useCallback(async () => {
    setLoading(true);
    const items = await searchGear({
      query: query.trim() || undefined,
      category: filter,
      subcategory: subFilter !== "all" ? subFilter : undefined,
      limit: 100,
    });
    setResults(items);
    setLoading(false);
  }, [query, filter, subFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(doSearch, 300);
    return () => clearTimeout(timer);
  }, [doSearch]);

  function handleCategoryClick(cat: GearCategory | "all") {
    setFilter(cat);
    setSubFilter("all");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Gear Library
          </h2>
          <span className="num text-xs text-muted-foreground">
            {results.length}/{totalCount}
          </span>
        </div>

        <div className="group relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand, item, tag…"
            aria-label="Search gear library"
            className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-white/20 focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <FilterChip
            active={filter === "all"}
            onClick={() => handleCategoryClick("all")}
            label="All systems"
            count={totalCount}
            full
          />
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORY_ORDER.map((id) => (
              <FilterChip
                key={id}
                active={filter === id}
                onClick={() => handleCategoryClick(id)}
                label={CATEGORY_LABELS[id]}
                color={CATEGORY_COLORS[id]}
                count={counts[id] ?? 0}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowCustomForm(!showCustomForm)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors",
              showCustomForm
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:bg-white/[0.05] hover:text-foreground"
            )}
          >
            <Plus className="size-3.5" />
            Custom Item
          </button>
        </div>

        {/* Subcategory pills */}
        {activeSubcategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <SubFilterChip
              active={subFilter === "all"}
              onClick={() => setSubFilter("all")}
              label="All"
              count={counts[filter as GearCategory] ?? 0}
            />
            {activeSubcategories.map((sub) => (
              <SubFilterChip
                key={sub.id}
                active={subFilter === sub.id}
                onClick={() => setSubFilter(sub.id)}
                label={sub.label}
                count={subCounts[sub.id] ?? 0}
              />
            ))}
          </div>
        )}
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
        {showCustomForm ? (
          <CustomItemForm
            onAdd={(item) => {
              addItem(item);
              setShowCustomForm(false);
            }}
            onCancel={() => setShowCustomForm(false)}
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            No gear matches that search.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((gear) => (
              <li key={gear.id}>
                <ResultCard
                  gear={gear}
                  inPack={packIds.includes(gear.id)}
                  onAdd={() => addItem(gear)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CustomItemForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: GearItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<GearCategory>("accessories");
  const [weightOz, setWeightOz] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !weightOz) return;

    const item: GearItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      brand: brand || "Custom",
      category,
      tier: "mid",
      weightOz: parseFloat(weightOz) || 0,
      priceUsd: parseFloat(priceUsd) || 0,
      description: description || `Custom item: ${name}`,
    };
    onAdd(item);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-1">
      <h3 className="text-sm font-semibold text-foreground">Add Custom Item</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Add clothing, shoes, or any gear not in the library.
      </p>

      <FormField label="Name *">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Patagonia Nano Puff" className="form-input" required />
      </FormField>

      <FormField label="Brand">
        <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Patagonia" className="form-input" />
      </FormField>

      <div className="grid grid-cols-2 gap-2">
        <FormField label="Weight (oz) *">
          <input type="number" step="0.1" min="0" value={weightOz} onChange={(e) => setWeightOz(e.target.value)} placeholder="12.5" className="form-input" required />
        </FormField>
        <FormField label="Price ($)">
          <input type="number" step="1" min="0" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} placeholder="150" className="form-input" />
        </FormField>
      </div>

      <FormField label="Category">
        <select value={category} onChange={(e) => setCategory(e.target.value as GearCategory)} className="form-input">
          {CATEGORY_ORDER.map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
          <option value="clothing">Clothing</option>
        </select>
      </FormField>

      <FormField label="Description">
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description (optional)" className="form-input" />
      </FormField>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={!name || !weightOz} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
          + Add to Pack
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground">
          Cancel
        </button>
      </div>
    </form>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SubFilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
      )}
    >
      {label}
      {count > 0 && <span className={cn("num ml-1 text-[10px]", active ? "text-primary/60" : "text-muted-foreground/50")}>{count}</span>}
    </button>
  );
}

function FilterChip({ active, onClick, label, color, count, full }: { active: boolean; onClick: () => void; label: string; color?: string; count: number; full?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors",
        full && "justify-center",
        active ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:bg-white/[0.05] hover:text-foreground"
      )}
    >
      {color && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
      <span className={cn("truncate", !full && "flex-1")}>{label}</span>
      <span className={cn("num shrink-0 text-[10px] tabular-nums", active ? "text-primary/70" : "text-muted-foreground/60")}>{count}</span>
    </button>
  );
}

function ResultCard({ gear, inPack, onAdd }: { gear: GearItem; inPack: boolean; onAdd: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const color = CATEGORY_COLORS[gear.category];

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="glass group relative flex items-start gap-3 rounded-xl border border-white/10 p-3 transition-all duration-200 hover:border-primary/30 hover:bg-white/[0.06] cursor-pointer"
    >
      <span aria-hidden="true" className="absolute inset-y-3 left-0 w-px opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: color }} />
      <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full ring-2 ring-inset ring-black/40" style={{ backgroundColor: color }} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs uppercase tracking-wider text-muted-foreground">{gear.brand}</p>
        <p className="truncate text-base font-medium leading-tight text-foreground">{gear.name}</p>
        <p className={cn("mt-1 text-xs text-muted-foreground/70 leading-relaxed", expanded ? "" : "line-clamp-1")}>{gear.description}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="num text-base font-medium text-primary">{gear.weightOz.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">oz</span>
          <span aria-hidden="true" className="h-3 w-px bg-white/10" />
          <span className="num text-xs text-muted-foreground">${gear.priceUsd}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        aria-label={`Add ${gear.brand} ${gear.name} to pack`}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95",
          inPack
            ? "border-primary/40 bg-primary/15 text-primary"
            : "border-white/10 bg-white/[0.04] text-muted-foreground hover:border-primary/50 hover:bg-primary hover:text-primary-foreground"
        )}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
