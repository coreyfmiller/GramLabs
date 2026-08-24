"use client";

import { useState, useEffect, useCallback } from "react";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/hooks/use-auth";
import {
  getClosetItemsWithGear,
  addToCloset,
  removeFromCloset,
  UserGearItem,
} from "@/lib/closet-api";
import { searchGear } from "@/lib/gear-api";
import { GearItem, GearCategory } from "@/data/gear-database";
import { cn } from "@/lib/utils";
import {
  Package,
  Plus,
  Search,
  Trash2,
  X,
  Backpack,
  Tent,
  Flame,
  Moon,
  Zap,
  Shield,
  Puzzle,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  shelter: <Tent className="size-4" />,
  sleep: <Moon className="size-4" />,
  pack: <Backpack className="size-4" />,
  kitchen: <Flame className="size-4" />,
  electronics: <Zap className="size-4" />,
  safety: <Shield className="size-4" />,
  accessories: <Puzzle className="size-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  shelter: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  sleep: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  pack: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  kitchen: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  electronics: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  safety: "text-red-400 bg-red-400/10 border-red-400/20",
  accessories: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

export default function ClosetPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<UserGearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const loadItems = useCallback(async () => {
    setLoading(true);
    const data = await getClosetItemsWithGear();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) loadItems();
  }, [user, loadItems]);

  const handleRemove = async (id: string) => {
    await removeFromCloset(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAdd = async (gearItem: GearItem) => {
    const result = await addToCloset({ gearItemId: gearItem.id });
    if (result) {
      result.gearItem = gearItem;
      setItems((prev) => [result, ...prev]);
    }
    setShowAddModal(false);
  };

  const handleAddCustom = async (params: {
    name: string;
    brand: string;
    weightOz: number;
    category: string;
  }) => {
    const result = await addToCloset({
      customName: params.name,
      customBrand: params.brand,
      customWeightOz: params.weightOz,
      customCategory: params.category,
    });
    if (result) {
      setItems((prev) => [result, ...prev]);
    }
    setShowAddModal(false);
  };

  // Derive display helpers
  const getItemName = (item: UserGearItem) =>
    item.nickname || item.gearItem?.name || item.customName || "Unknown";
  const getItemBrand = (item: UserGearItem) =>
    item.gearItem?.brand || item.customBrand || "";
  const getItemWeight = (item: UserGearItem) =>
    item.gearItem?.weightOz ?? item.customWeightOz ?? 0;
  const getItemCategory = (item: UserGearItem) =>
    item.gearItem?.category || item.customCategory || "accessories";

  const filteredItems =
    filterCategory === "all"
      ? items
      : items.filter((i) => getItemCategory(i) === filterCategory);

  const totalWeight = items.reduce((sum, i) => sum + getItemWeight(i), 0);
  const categories = [...new Set(items.map(getItemCategory))];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Nav />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="size-6 text-emerald-400" />
              Gear Closet
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {items.length} items · {totalWeight.toFixed(1)} oz total
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
          >
            <Plus className="size-4" />
            Add Gear
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              filterCategory === "all"
                ? "bg-white/10 text-white border-white/20"
                : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600"
            )}
          >
            All ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5",
                filterCategory === cat
                  ? CATEGORY_COLORS[cat] || "bg-white/10 text-white border-white/20"
                  : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600"
              )}
            >
              {CATEGORY_ICONS[cat]}
              {cat} ({items.filter((i) => getItemCategory(i) === cat).length})
            </button>
          ))}
        </div>

        {/* Gear Grid */}
        {loading ? (
          <div className="text-center text-zinc-500 py-16">Loading your gear...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            {items.length === 0 ? (
              <>
                <Package className="size-12 text-zinc-700 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-white mb-2">
                  Let&apos;s build your gear closet
                </h2>
                <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
                  Your closet is where all your gear lives. Add items from our
                  database of 1,500+ products, or enter custom gear.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
                  >
                    <Search className="size-4" />
                    Browse &amp; Add Gear
                  </button>
                  <a
                    href="/import"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="size-4" />
                    Import from LighterPack
                  </a>
                </div>
              </>
            ) : (
              <>
                <Package className="size-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400 mb-2">No items in this category</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors"
              >
                {/* Category badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border mb-2",
                    CATEGORY_COLORS[getItemCategory(item)] ||
                      "text-zinc-400 bg-zinc-800 border-zinc-700"
                  )}
                >
                  {CATEGORY_ICONS[getItemCategory(item)]}
                  {getItemCategory(item)}
                </div>

                {/* Item info */}
                <h3 className="font-medium text-sm text-white leading-tight">
                  {getItemName(item)}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {getItemBrand(item)}
                </p>

                {/* Weight */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    {getItemWeight(item).toFixed(1)} oz
                  </span>
                  <span className="text-[10px] text-zinc-600 capitalize">
                    {item.condition}
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  aria-label="Remove from closet"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Gear Modal */}
      {showAddModal && (
        <AddGearModal
          onClose={() => setShowAddModal(false)}
          onAddFromDB={handleAdd}
          onAddCustom={handleAddCustom}
        />
      )}
    </div>
  );
}

// ===== Add Gear Modal =====

function AddGearModal({
  onClose,
  onAddFromDB,
  onAddCustom,
}: {
  onClose: () => void;
  onAddFromDB: (item: GearItem) => void;
  onAddCustom: (params: { name: string; brand: string; weightOz: number; category: string }) => void;
}) {
  const [tab, setTab] = useState<"search" | "custom">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GearItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Custom form
  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customWeight, setCustomWeight] = useState("");
  const [customCategory, setCustomCategory] = useState("accessories");

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const data = await searchGear({ query, limit: 20 });
      setResults(data);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-semibold text-white">Add Gear to Closet</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setTab("search")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "search"
                ? "text-emerald-400 border-b-2 border-emerald-400"
                : "text-zinc-400 hover:text-zinc-300"
            )}
          >
            Search Database
          </button>
          <button
            onClick={() => setTab("custom")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "custom"
                ? "text-emerald-400 border-b-2 border-emerald-400"
                : "text-zinc-400 hover:text-zinc-300"
            )}
          >
            Custom Item
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[400px] overflow-y-auto">
          {tab === "search" ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search gear by name, brand..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>
              {searching && (
                <p className="text-xs text-zinc-500">Searching...</p>
              )}
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onAddFromDB(item)}
                  className="w-full text-left p-3 rounded-lg border border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500">{item.brand}</p>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {item.weightOz.toFixed(1)} oz
                    </span>
                  </div>
                </button>
              ))}
              {query.length >= 2 && !searching && results.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4">
                  No results. Try a different search or add as a custom item.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Item name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <input
                type="text"
                placeholder="Brand (optional)"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <input
                type="number"
                placeholder="Weight (oz)"
                value={customWeight}
                onChange={(e) => setCustomWeight(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              >
                <option value="shelter">Shelter</option>
                <option value="sleep">Sleep</option>
                <option value="pack">Pack</option>
                <option value="kitchen">Kitchen</option>
                <option value="electronics">Electronics</option>
                <option value="safety">Safety</option>
                <option value="accessories">Accessories</option>
              </select>
              <button
                onClick={() => {
                  if (!customName.trim()) return;
                  onAddCustom({
                    name: customName,
                    brand: customBrand,
                    weightOz: parseFloat(customWeight) || 0,
                    category: customCategory,
                  });
                }}
                disabled={!customName.trim()}
                className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Closet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
