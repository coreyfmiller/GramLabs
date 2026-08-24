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
  PackagePlus,
  Upload,
} from "lucide-react";
import { usePackStore } from "@/store/pack-store";

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
  accessories: "text-primary bg-primary/10 border-primary/20",
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
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Gear Closet
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} items · {totalWeight.toFixed(1)} oz total
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/import"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Upload className="size-4" />
              Import
            </a>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
            >
              <Plus className="size-4" />
              Add Gear
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              filterCategory === "all"
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/30"
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
                  ? CATEGORY_COLORS[cat] || "bg-primary/10 text-primary border-primary/30"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/30"
              )}
            >
              {CATEGORY_ICONS[cat]}
              {cat} ({items.filter((i) => getItemCategory(i) === cat).length})
            </button>
          ))}
        </div>

        {/* Gear Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-16">Loading your gear...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            {items.length === 0 ? (
              <>
                <Package className="size-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Let&apos;s build your gear closet
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Your closet is where all your gear lives. Add items from our
                  database of 1,500+ products, or enter custom gear.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-foreground text-sm font-medium hover:brightness-110 transition-colors"
                  >
                    <Search className="size-4" />
                    Browse &amp; Add Gear
                  </button>
                  <a
                    href="/import"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Plus className="size-4" />
                    Import from LighterPack
                  </a>
                </div>
              </>
            ) : (
              <>
                <Package className="size-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">No items in this category</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative p-4 rounded-xl border border-border bg-card hover:border-border transition-colors"
              >
                {/* Category badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border mb-2",
                    CATEGORY_COLORS[getItemCategory(item)] ||
                      "text-muted-foreground bg-muted border-border"
                  )}
                >
                  {CATEGORY_ICONS[getItemCategory(item)]}
                  {getItemCategory(item)}
                </div>

                {/* Item info */}
                <h3 className="font-medium text-sm text-foreground leading-tight">
                  {getItemName(item)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getItemBrand(item)}
                </p>

                {/* Weight */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {getItemWeight(item).toFixed(1)} oz
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {item.condition}
                  </span>
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <AddToLoadoutButton gearItem={item.gearItem} customItem={!item.gearItem ? { name: item.customName || "Unknown", brand: item.customBrand || "", category: item.customCategory || "accessories", weightOz: item.customWeightOz || 0 } : undefined} />
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    aria-label="Remove from closet"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
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

// ===== Add to Loadout Button =====

function AddToLoadoutButton({ gearItem, customItem }: { gearItem?: GearItem; customItem?: { name: string; brand: string; category: string; weightOz: number } }) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const loadouts = usePackStore((s) => s.loadouts);
  const addItem = usePackStore((s) => s.addItem);
  const switchLoadout = usePackStore((s) => s.switchLoadout);
  const activeLoadoutId = usePackStore((s) => s.activeLoadoutId);

  if (!gearItem && !customItem) return null;

  const itemToAdd: GearItem = gearItem || {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name: customItem!.name,
    brand: customItem!.brand,
    category: customItem!.category as GearCategory,
    weightOz: customItem!.weightOz,
    priceUsd: 0,
    tier: "mid" as const,
    description: "",
  };

  const handleAdd = (loadoutId: string) => {
    const prev = activeLoadoutId;
    switchLoadout(loadoutId);
    addItem(itemToAdd);
    switchLoadout(prev);
    setAdded(loadoutId);
    setTimeout(() => { setAdded(null); setOpen(false); }, 600);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        aria-label="Add to loadout"
        title="Add to loadout"
      >
        <PackagePlus className="size-3.5" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-50 w-44 rounded-lg border border-border bg-card shadow-xl py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Add to loadout
          </p>
          {loadouts.map((l) => (
            <button
              key={l.id}
              onClick={() => handleAdd(l.id)}
              className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors flex items-center justify-between"
            >
              {l.name}
              {added === l.id && <span className="text-primary text-[10px]">Added</span>}
            </button>
          ))}
        </div>
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
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Add Gear to Closet</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("search")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "search"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Search Database
          </button>
          <button
            onClick={() => setTab("custom")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "custom"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search gear by name, brand..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
              </div>
              {searching && (
                <p className="text-xs text-muted-foreground">Searching...</p>
              )}
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onAddFromDB(item)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:brightness-110/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.brand}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.weightOz.toFixed(1)} oz
                    </span>
                  </div>
                </button>
              ))}
              {query.length >= 2 && !searching && results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
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
                className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
              <input
                type="text"
                placeholder="Brand (optional)"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
              <input
                type="number"
                placeholder="Weight (oz)"
                value={customWeight}
                onChange={(e) => setCustomWeight(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
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
                className="w-full py-2.5 rounded-lg bg-primary text-foreground text-sm font-medium hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
