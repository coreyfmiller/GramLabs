"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/hooks/use-auth";
import {
  getLoadoutWithItems,
  addItemToLoadout,
  removeItemFromLoadout,
  updateLoadout,
  Loadout,
  LoadoutItem,
} from "@/lib/loadout-api";
import { getClosetItemsWithGear, UserGearItem } from "@/lib/closet-api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  X,
  Globe,
  Lock,
  Weight,
} from "lucide-react";

export default function LoadoutBuilderPage() {
  const params = useParams();
  const loadoutId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [loadout, setLoadout] = useState<Loadout | null>(null);
  const [items, setItems] = useState<LoadoutItem[]>([]);
  const [closetItems, setClosetItems] = useState<UserGearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [loadoutData, closetData] = await Promise.all([
      getLoadoutWithItems(loadoutId),
      getClosetItemsWithGear(),
    ]);
    setLoadout(loadoutData.loadout);
    setItems(loadoutData.items);
    setClosetItems(closetData);
    setLoading(false);
  }, [loadoutId]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleAddItem = async (userGearId: string) => {
    const success = await addItemToLoadout({ loadoutId, userGearId });
    if (success) {
      await loadData(); // Refresh to get new item with ID
    }
    setShowPicker(false);
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItemFromLoadout(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleTogglePublic = async () => {
    if (!loadout) return;
    const success = await updateLoadout(loadout.id, { isPublic: !loadout.isPublic });
    if (success) {
      setLoadout((prev) => prev ? { ...prev, isPublic: !prev.isPublic } : null);
    }
  };

  // Map loadout items to their closet gear
  const getGearForLoadoutItem = (loadoutItem: LoadoutItem): UserGearItem | undefined =>
    closetItems.find((c) => c.id === loadoutItem.userGearId);

  const getItemName = (g: UserGearItem) =>
    g.nickname || g.gearItem?.name || g.customName || "Unknown";
  const getItemBrand = (g: UserGearItem) =>
    g.gearItem?.brand || g.customBrand || "";
  const getItemWeight = (g: UserGearItem) =>
    g.gearItem?.weightOz ?? g.customWeightOz ?? 0;
  const getItemCategory = (g: UserGearItem) =>
    g.gearItem?.category || g.customCategory || "accessories";

  // Weight calculations
  const packedItems = items.filter((i) => {
    const g = getGearForLoadoutItem(i);
    return g && i.status === "packed";
  });
  const wornItems = items.filter((i) => i.status === "worn");
  const consumableItems = items.filter((i) => i.status === "consumable");

  const baseWeight = packedItems.reduce((sum, item) => {
    const g = getGearForLoadoutItem(item);
    return sum + (g ? getItemWeight(g) * item.quantity : 0);
  }, 0);

  const wornWeight = wornItems.reduce((sum, item) => {
    const g = getGearForLoadoutItem(item);
    return sum + (g ? getItemWeight(g) * item.quantity : 0);
  }, 0);

  const consumableWeight = consumableItems.reduce((sum, item) => {
    const g = getGearForLoadoutItem(item);
    return sum + (g ? getItemWeight(g) * item.quantity : 0);
  }, 0);

  const totalWeight = baseWeight + wornWeight + consumableWeight;

  // Items already in this loadout (to filter out from picker)
  const usedGearIds = new Set(items.map((i) => i.userGearId));
  const availableClosetItems = closetItems.filter((c) => !usedGearIds.has(c.id));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!loadout) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-zinc-400">Loadout not found</p>
          <Link href="/loadouts" className="text-emerald-400 text-sm mt-2 inline-block">
            ← Back to loadouts
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Nav />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link
              href="/loadouts"
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="size-3" />
              All Loadouts
            </Link>
            <h1 className="text-2xl font-bold">{loadout.name}</h1>
            {loadout.description && (
              <p className="text-sm text-zinc-400 mt-1">{loadout.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePublic}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                loadout.isPublic
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
              )}
            >
              {loadout.isPublic ? <Globe className="size-3" /> : <Lock className="size-3" />}
              {loadout.isPublic ? "Public" : "Private"}
            </button>
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
            >
              <Plus className="size-4" />
              Add from Closet
            </button>
          </div>
        </div>

        {/* Weight Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Base Weight</p>
            <p className="text-lg font-bold text-white">
              {(baseWeight / 16).toFixed(2)} <span className="text-xs text-zinc-500">lb</span>
            </p>
            <p className="text-[10px] text-zinc-600">{baseWeight.toFixed(1)} oz</p>
          </div>
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Worn</p>
            <p className="text-lg font-bold text-zinc-400">
              {(wornWeight / 16).toFixed(2)} <span className="text-xs text-zinc-500">lb</span>
            </p>
          </div>
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Consumable</p>
            <p className="text-lg font-bold text-zinc-400">
              {(consumableWeight / 16).toFixed(2)} <span className="text-xs text-zinc-500">lb</span>
            </p>
          </div>
          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-1">Total</p>
            <p className="text-lg font-bold text-emerald-400">
              {(totalWeight / 16).toFixed(2)} <span className="text-xs text-emerald-400/70">lb</span>
            </p>
            <p className="text-[10px] text-emerald-400/50">{items.length} items</p>
          </div>
        </div>

        {/* Items List */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Weight className="size-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 mb-2">This loadout is empty</p>
            <p className="text-sm text-zinc-500">
              Add items from your gear closet to start building
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const gear = getGearForLoadoutItem(item);
              if (!gear) return null;
              return (
                <div
                  key={item.id}
                  className="group flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider",
                        item.status === "packed" && "bg-blue-400/10 text-blue-400",
                        item.status === "worn" && "bg-purple-400/10 text-purple-400",
                        item.status === "consumable" && "bg-orange-400/10 text-orange-400"
                      )}
                    >
                      {item.status}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {getItemName(gear)}
                      </p>
                      <p className="text-xs text-zinc-500">{getItemBrand(gear)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 tabular-nums">
                      {getItemWeight(gear).toFixed(1)} oz
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      aria-label="Remove from loadout"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Closet Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="font-semibold text-white">Add from Closet</h2>
              <button
                onClick={() => setShowPicker(false)}
                className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-5 max-h-[400px] overflow-y-auto space-y-2">
              {availableClosetItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="size-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    {closetItems.length === 0
                      ? "Your closet is empty — add gear first"
                      : "All closet items are already in this loadout"}
                  </p>
                  {closetItems.length === 0 && (
                    <Link
                      href="/closet"
                      className="text-emerald-400 text-xs mt-2 inline-block"
                    >
                      Go to Gear Closet →
                    </Link>
                  )}
                </div>
              ) : (
                availableClosetItems.map((gear) => (
                  <button
                    key={gear.id}
                    onClick={() => handleAddItem(gear.id)}
                    className="w-full text-left p-3 rounded-lg border border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {getItemName(gear)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {getItemBrand(gear)} · {getItemCategory(gear)}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {getItemWeight(gear).toFixed(1)} oz
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
