"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { searchGear } from "@/lib/gear-api";
import { GearItem, GearCategory, CATEGORY_ORDER, CATEGORY_LABELS, SUBCATEGORIES } from "@/data/gear-database";
import { formatWeightWithUnit } from "@/utils/format";
import { cn } from "@/lib/utils";
import Link from "next/link";

type SortOption = "lightest" | "heaviest" | "cheapest" | "expensive" | "name";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "lightest", label: "Lightest" },
  { value: "heaviest", label: "Heaviest" },
  { value: "cheapest", label: "Cheapest" },
  { value: "expensive", label: "Most Expensive" },
  { value: "name", label: "A–Z" },
];

const CATEGORY_ICONS: Record<string, string> = {
  shelter: "⛺",
  sleep: "🌙",
  pack: "🎒",
  kitchen: "🔥",
  clothing: "👕",
  electronics: "⚡",
  safety: "🛡️",
  accessories: "🧩",
};

const PAGE_SIZE = 48;

export default function ExplorePage() {
  const [items, setItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GearCategory | "all">("all");
  const [subcategory, setSubcategory] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("lightest");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchItems = useCallback(async (reset = false) => {
    setLoading(true);
    const offset = reset ? 0 : page * PAGE_SIZE;

    const results = await searchGear({
      query: query.trim() || undefined,
      category: category === "all" ? undefined : category,
      subcategory: subcategory === "all" ? undefined : subcategory,
      limit: PAGE_SIZE,
      offset,
    });

    // Client-side sort (Supabase orders by weight ascending by default)
    const sorted = sortItems(results, sort);

    if (reset) {
      setItems(sorted);
      setPage(0);
    } else {
      setItems((prev) => [...prev, ...sorted]);
    }
    setHasMore(results.length === PAGE_SIZE);
    setLoading(false);
  }, [query, category, subcategory, sort, page]);

  // Fetch on filter/sort change
  useEffect(() => {
    fetchItems(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, subcategory, sort]);

  function handleCategoryChange(cat: GearCategory | "all") {
    setCategory(cat);
    setSubcategory("all");
  }

  function handleLoadMore() {
    setPage((p) => p + 1);
  }

  // Load more when page increments (but not on initial)
  useEffect(() => {
    if (page > 0) fetchItems(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const subcategories = category !== "all" ? SUBCATEGORIES[category] || [] : [];

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gear Explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse 1,500+ items with full specs and video reviews
          </p>
        </div>

        {/* Search + Sort row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search gear by name, brand, or type..."
              className="w-full rounded-lg border border-border bg-input pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleCategoryChange("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              category === "all"
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/30"
            )}
          >
            All
          </button>
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5",
                category === cat
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/30"
              )}
            >
              <span aria-hidden="true">{CATEGORY_ICONS[cat]}</span>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Subcategory pills */}
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            <button
              onClick={() => setSubcategory("all")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
                subcategory === "all"
                  ? "bg-white/[0.08] text-foreground border-white/20"
                  : "bg-transparent text-muted-foreground border-border hover:border-white/20"
              )}
            >
              All {CATEGORY_LABELS[category as GearCategory]}
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSubcategory(sub.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
                  subcategory === sub.id
                    ? "bg-white/[0.08] text-foreground border-white/20"
                    : "bg-transparent text-muted-foreground border-border hover:border-white/20"
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="mb-4 text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""}{hasMore ? "+" : ""} found
          </p>
        )}

        {/* Gear grid */}
        {loading && items.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 text-sm">Loading gear...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">No gear found matching your filters.</p>
            <button
              onClick={() => { setSearchInput(""); setCategory("all"); setSubcategory("all"); }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => (
                <GearCard key={item.id} item={item} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function GearCard({ item }: { item: GearItem }) {
  return (
    <Link
      href={`/gear/${item.id}`}
      className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{item.brand}</p>
          <p className="mt-0.5 text-sm font-medium text-foreground leading-tight group-hover:text-primary transition-colors">
            {item.name}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="num text-sm font-semibold text-foreground">
          {formatWeightWithUnit(item.weightOz, "oz")}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="num text-sm text-muted-foreground">
          ${item.priceUsd}
        </span>
        {item.subcategory && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[11px] text-muted-foreground truncate">
              {item.subcategory.replace(/-/g, " ")}
            </span>
          </>
        )}
      </div>

      {item.description && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {item.description}
        </p>
      )}
    </Link>
  );
}

function sortItems(items: GearItem[], sort: SortOption): GearItem[] {
  const sorted = [...items];
  switch (sort) {
    case "lightest":
      return sorted.sort((a, b) => a.weightOz - b.weightOz);
    case "heaviest":
      return sorted.sort((a, b) => b.weightOz - a.weightOz);
    case "cheapest":
      return sorted.sort((a, b) => a.priceUsd - b.priceUsd);
    case "expensive":
      return sorted.sort((a, b) => b.priceUsd - a.priceUsd);
    case "name":
      return sorted.sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`));
    default:
      return sorted;
  }
}
