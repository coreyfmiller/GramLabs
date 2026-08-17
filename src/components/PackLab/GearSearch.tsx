"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { gearDatabase, GearItem, CATEGORY_LABELS, GearCategory } from "@/data/gear-database";
import { usePackStore } from "@/store/pack-store";

export default function GearSearch() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GearCategory | "all">("all");
  const { addItem, items } = usePackStore();

  const filteredGear = gearDatabase.filter((item) => {
    const matchesQuery =
      query === "" ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.brand.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  const isInPack = (id: string) => items.some((i) => i.gearId === id);

  const categories = Object.entries(CATEGORY_LABELS) as [GearCategory, string][];

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
      <h3 className="text-[13px] font-bold tracking-[0.2em] text-white/60 uppercase mb-4">
        Gear Database
      </h3>

      {/* Search input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search gear..."
          className="w-full bg-white/[0.05] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-lime-400/50 transition-colors"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide uppercase transition-colors ${
            selectedCategory === "all"
              ? "bg-lime-400/20 text-lime-400"
              : "bg-white/[0.05] text-white/50 hover:text-white/80"
          }`}
        >
          All
        </button>
        {categories.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide uppercase transition-colors ${
              selectedCategory === key
                ? "bg-lime-400/20 text-lime-400"
                : "bg-white/[0.05] text-white/50 hover:text-white/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
        {filteredGear.slice(0, 20).map((item) => (
          <GearResultItem
            key={item.id}
            item={item}
            inPack={isInPack(item.id)}
            onAdd={() => addItem(item)}
          />
        ))}
        {filteredGear.length === 0 && (
          <p className="text-[13px] text-white/30 text-center py-4">
            No gear found matching your search.
          </p>
        )}
      </div>
    </div>
  );
}

function GearResultItem({
  item,
  inPack,
  onAdd,
}: {
  item: GearItem;
  inPack: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-white truncate">
            {item.brand} {item.name}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] font-[family-name:var(--font-jetbrains-mono)] text-white/50">
            {item.weightOz} oz
          </span>
          <span className="text-[11px] text-white/30">
            ${item.priceUsd}
          </span>
          <span className="text-[10px] text-white/20 uppercase tracking-wide">
            {CATEGORY_LABELS[item.category]}
          </span>
        </div>
      </div>
      <button
        onClick={onAdd}
        disabled={inPack}
        className={`p-1.5 rounded-md transition-colors ${
          inPack
            ? "text-lime-400/50 cursor-default"
            : "text-white/30 hover:text-lime-400 hover:bg-lime-400/10"
        }`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
