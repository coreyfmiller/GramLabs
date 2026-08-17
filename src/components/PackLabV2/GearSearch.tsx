"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import {
  gearDatabase,
  GearCategory,
  GearItem,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/data/gear-database";
import { usePackStore } from "@/store/pack-store";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: GearCategory[] = [
  "shelter",
  "insulation",
  "sleeping-pad",
  "pack",
  "clothing",
  "cooking",
  "water",
  "electronics",
  "hygiene",
  "navigation",
  "safety",
  "accessories",
];

export function GearSearch() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GearCategory | "all">("all");

  const addItem = usePackStore((s) => s.addItem);
  const loadouts = usePackStore((s) => s.loadouts);
  const activeLoadoutId = usePackStore((s) => s.activeLoadoutId);
  const packItems = loadouts.find((l) => l.id === activeLoadoutId)?.items ?? [];
  const packIds = useMemo(
    () => packItems.map((i) => i.gearId),
    [packItems]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gearDatabase
      .filter((g) => {
        if (filter !== "all" && g.category !== filter) return false;
        if (!q) return true;
        return (
          g.name.toLowerCase().includes(q) ||
          g.brand.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const catDiff =
          CATEGORY_ORDER.indexOf(a.category) -
          CATEGORY_ORDER.indexOf(b.category);
        return catDiff !== 0 ? catDiff : a.weightOz - b.weightOz;
      });
  }, [query, filter]);

  const counts = useMemo(() => {
    return gearDatabase.reduce<Partial<Record<GearCategory, number>>>(
      (acc, g) => {
        acc[g.category] = (acc[g.category] ?? 0) + 1;
        return acc;
      },
      {}
    );
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Gear Library
          </h2>
          <span className="num text-xs text-muted-foreground">
            {results.length}/{gearDatabase.length}
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
            onClick={() => setFilter("all")}
            label="All systems"
            count={gearDatabase.length}
            full
          />
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORY_ORDER.map((id) => (
              <FilterChip
                key={id}
                active={filter === id}
                onClick={() => setFilter(id)}
                label={CATEGORY_LABELS[id]}
                color={CATEGORY_COLORS[id]}
                count={counts[id] ?? 0}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
        {results.length === 0 ? (
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

function FilterChip({
  active,
  onClick,
  label,
  color,
  count,
  full,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
  count: number;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors",
        full && "justify-center",
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:bg-white/[0.05] hover:text-foreground"
      )}
    >
      {color && (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span className={cn("truncate", !full && "flex-1")}>{label}</span>
      <span
        className={cn(
          "num shrink-0 text-[10px] tabular-nums",
          active ? "text-primary/70" : "text-muted-foreground/60"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ResultCard({
  gear,
  inPack,
  onAdd,
}: {
  gear: GearItem;
  inPack: boolean;
  onAdd: () => void;
}) {
  const color = CATEGORY_COLORS[gear.category];

  return (
    <div className="glass group relative flex items-center gap-3 rounded-xl border border-white/10 p-3 transition-all duration-200 hover:border-primary/30 hover:bg-white/[0.06]">
      <span
        aria-hidden="true"
        className="absolute inset-y-3 left-0 w-px opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: color }}
      />
      <span
        aria-hidden="true"
        className="mt-0.5 size-2 shrink-0 self-start rounded-full ring-2 ring-inset ring-black/40"
        style={{ backgroundColor: color }}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs uppercase tracking-wider text-muted-foreground">
          {gear.brand}
        </p>
        <p className="truncate text-base font-medium leading-tight text-foreground">
          {gear.name}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
          {gear.description}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="num text-base font-medium text-primary">
            {gear.weightOz.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">oz</span>
          <span aria-hidden="true" className="h-3 w-px bg-white/10" />
          <span className="num text-xs text-muted-foreground">
            ${gear.priceUsd}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onAdd}
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
