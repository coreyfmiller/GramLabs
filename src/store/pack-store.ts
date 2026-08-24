import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GearItem, GearCategory, CATEGORY_COLORS } from "@/data/gear-database";

export type ItemStatus = "packed" | "worn" | "consumable";

export type WeightUnit = "oz" | "g";

export interface PackItem {
  gearId: string;
  item: GearItem;
  status: ItemStatus;
  quantity: number;
  starred?: boolean;
  url?: string;
}

export interface CustomCategory {
  id: string;
  label: string;
  color: string;
}

export interface Loadout {
  id: string;
  name: string;
  items: PackItem[];
}

export interface PackStore {
  loadouts: Loadout[];
  activeLoadoutId: string;
  weightUnit: WeightUnit;
  customCategories: CustomCategory[];

  // Buy List
  buyList: GearItem[];
  addToBuyList: (item: GearItem) => void;
  removeFromBuyList: (id: string) => void;
  moveToPack: (id: string) => void;
  clearBuyList: () => void;
  getBuyListCost: () => number;

  // Custom categories
  addCustomCategory: (label: string, color: string) => void;
  removeCustomCategory: (id: string) => void;
  getAllCategoryLabels: () => Record<string, string>;
  getAllCategoryColors: () => Record<string, string>;

  // Loadout management
  createLoadout: (name: string) => void;
  deleteLoadout: (id: string) => void;
  switchLoadout: (id: string) => void;
  renameLoadout: (id: string, name: string) => void;
  setWeightUnit: (unit: WeightUnit) => void;

  // Item management (operates on active loadout)
  setPackName: (name: string) => void;
  addItem: (item: GearItem, status?: ItemStatus) => void;
  addQuickItem: (name: string, category: string, weightOz: number, priceUsd?: number, url?: string) => void;
  removeItem: (gearId: string) => void;
  updateItemStatus: (gearId: string, status: ItemStatus) => void;
  updateItemQuantity: (gearId: string, quantity: number) => void;
  updateItemUrl: (gearId: string, url: string) => void;
  updateItemDetails: (gearId: string, updates: { name?: string; brand?: string; weightOz?: number; priceUsd?: number; category?: string }) => void;
  reorderItem: (gearId: string, targetGearId: string) => void;
  toggleItemStar: (gearId: string) => void;
  clearPack: () => void;
  importFromLighterPack: (url: string) => Promise<{ success: boolean; count: number; error?: string }>;

  // Computed helpers
  getActiveLoadout: () => Loadout | undefined;
  getPackName: () => string;
  getItems: () => PackItem[];
  getBaseWeight: () => number;
  getTotalWeight: () => number;
  getWornWeight: () => number;
  getConsumableWeight: () => number;
  getCategoryBreakdown: () => { category: string; weightOz: number; percentage: number }[];
  getBig3Weight: () => number;
  getTotalCost: () => number;
  getItemCount: () => number;

  // Rehydration — refresh stored items from Supabase so specs stay current
  rehydrateItems: () => Promise<void>;

  // Share
  hydrateFromShareData: (items: PackItem[], name: string) => void;
  generateShareURL: () => string;
  exportCSV: () => string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const DEFAULT_LOADOUT_ID = "default";

const DEFAULT_CUSTOM_COLORS = [
  "#f97316", "#ec4899", "#14b8a6", "#8b5cf6", "#f59e0b",
  "#06b6d4", "#ef4444", "#10b981", "#6366f1", "#d946ef",
];

export const usePackStore = create<PackStore>()(
  persist(
    (set, get) => ({
      loadouts: [{ id: DEFAULT_LOADOUT_ID, name: "My Pack", items: [] }],
      activeLoadoutId: DEFAULT_LOADOUT_ID,
      weightUnit: "oz" as WeightUnit,
      buyList: [],
      customCategories: [],

      // Buy List
      addToBuyList: (item) => {
        const state = get();
        if (state.buyList.some((i) => i.id === item.id)) return;
        set({ buyList: [...state.buyList, item] });
      },

      removeFromBuyList: (id) => {
        set((state) => ({ buyList: state.buyList.filter((i) => i.id !== id) }));
      },

      moveToPack: (id) => {
        const state = get();
        const item = state.buyList.find((i) => i.id === id);
        if (!item) return;
        // Remove from buy list
        const newBuyList = state.buyList.filter((i) => i.id !== id);
        // Add to active loadout
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout) return;
        const existing = loadout.items.find((i) => i.gearId === item.id);
        if (existing) {
          set({ buyList: newBuyList });
          return;
        }
        set({
          buyList: newBuyList,
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId
              ? { ...l, items: [...l.items, { gearId: item.id, item, status: "packed" as ItemStatus, quantity: 1 }] }
              : l
          ),
        });
      },

      clearBuyList: () => set({ buyList: [] }),

      getBuyListCost: () => {
        return get().buyList.reduce((sum, item) => sum + item.priceUsd, 0);
      },

      // Custom categories
      addCustomCategory: (label, color) => {
        const state = get();
        const id = `custom-${generateId()}`;
        const finalColor = color || DEFAULT_CUSTOM_COLORS[state.customCategories.length % DEFAULT_CUSTOM_COLORS.length];
        set({ customCategories: [...state.customCategories, { id, label, color: finalColor }] });
      },

      removeCustomCategory: (id) => {
        set((state) => ({ customCategories: state.customCategories.filter((c) => c.id !== id) }));
      },

      getAllCategoryLabels: () => {
        const state = get();
        const labels: Record<string, string> = {
          shelter: "Shelter",
          sleep: "Sleep",
          pack: "Pack",
          kitchen: "Kitchen",
          electronics: "Electronics",
          clothing: "Clothing",
          safety: "Safety",
          accessories: "Accessories",
        };
        state.customCategories.forEach((c) => {
          labels[c.id] = c.label;
        });
        return labels;
      },

      getAllCategoryColors: () => {
        const state = get();
        const colors: Record<string, string> = { ...CATEGORY_COLORS };
        state.customCategories.forEach((c) => {
          colors[c.id] = c.color;
        });
        return colors;
      },

      setWeightUnit: (unit) => set({ weightUnit: unit }),

      createLoadout: (name) => {
        const id = generateId();
        set((state) => ({
          loadouts: [...state.loadouts, { id, name, items: [] }],
          activeLoadoutId: id,
        }));
      },

      deleteLoadout: (id) => {
        const state = get();
        if (state.loadouts.length <= 1) return;
        const remaining = state.loadouts.filter((l) => l.id !== id);
        set({
          loadouts: remaining,
          activeLoadoutId:
            state.activeLoadoutId === id ? remaining[0].id : state.activeLoadoutId,
        });
      },

      switchLoadout: (id) => set({ activeLoadoutId: id }),

      renameLoadout: (id, name) =>
        set((state) => ({
          loadouts: state.loadouts.map((l) =>
            l.id === id ? { ...l, name } : l
          ),
        })),

      getActiveLoadout: () => {
        const state = get();
        return state.loadouts.find((l) => l.id === state.activeLoadoutId);
      },

      getPackName: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        return loadout?.name ?? "My Pack";
      },

      getItems: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        return loadout?.items ?? [];
      },

      setPackName: (name) => {
        const state = get();
        set({
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId ? { ...l, name } : l
          ),
        });
      },

      addItem: (item, status = "packed") => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout) return;
        const existing = loadout.items.find((i) => i.gearId === item.id);
        if (existing) return;
        set({
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId
              ? {
                  ...l,
                  items: [
                    ...l.items,
                    { gearId: item.id, item, status, quantity: 1, starred: false },
                  ],
                }
              : l
          ),
        });
      },

      addQuickItem: (name, category, weightOz, priceUsd = 0, url) => {
        const item: GearItem = {
          id: `quick-${Date.now()}-${generateId()}`,
          name,
          brand: "",
          category: category as GearCategory,
          tier: "mid",
          weightOz,
          priceUsd,
          description: "",
          url: url || undefined,
        };
        get().addItem(item);
      },

      removeItem: (gearId) => {
        const state = get();
        set({
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId
              ? { ...l, items: l.items.filter((i) => i.gearId !== gearId) }
              : l
          ),
        });
      },

      updateItemStatus: (gearId, status) => {
        const state = get();
        set({
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.gearId === gearId ? { ...i, status } : i
                  ),
                }
              : l
          ),
        });
      },

      updateItemQuantity: (gearId, quantity) => {
        const state = get();
        set({
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.gearId === gearId ? { ...i, quantity } : i
                  ),
                }
              : l
          ),
        });
      },

      toggleItemStar: (gearId) => {
        const state = get();
        set({
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.gearId === gearId ? { ...i, starred: !i.starred } : i
                  ),
                }
              : l
          ),
        });
      },

      updateItemUrl: (gearId, url) => {
        const state = get();
        set({
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId
              ? {
                  ...l,
                  items: l.items.map((i) =>
                    i.gearId === gearId ? { ...i, url } : i
                  ),
                }
              : l
          ),
        });
      },

      updateItemDetails: (gearId, updates) => {
        const state = get();
        set({
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId
              ? {
                  ...l,
                  items: l.items.map((i) => {
                    if (i.gearId !== gearId) return i;
                    const newItem = { ...i.item };
                    if (updates.name !== undefined) newItem.name = updates.name;
                    if (updates.brand !== undefined) newItem.brand = updates.brand;
                    if (updates.weightOz !== undefined) newItem.weightOz = updates.weightOz;
                    if (updates.priceUsd !== undefined) newItem.priceUsd = updates.priceUsd;
                    if (updates.category !== undefined) newItem.category = updates.category as GearCategory;
                    return { ...i, item: newItem };
                  }),
                }
              : l
          ),
        });
      },

      reorderItem: (gearId, targetGearId) => {
        if (gearId === targetGearId) return;
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout) return;

        const items = [...loadout.items];
        const fromIndex = items.findIndex((i) => i.gearId === gearId);
        const toIndex = items.findIndex((i) => i.gearId === targetGearId);
        if (fromIndex === -1 || toIndex === -1) return;

        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);

        set({
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId ? { ...l, items } : l
          ),
        });
      },

      importFromLighterPack: async (url) => {
        try {
          // Extract the share ID from lighterpack URL
          const match = url.match(/lighterpack\.com\/r\/([a-z0-9]+)/i);
          if (!match) return { success: false, count: 0, error: "Invalid LighterPack URL" };

          const shareId = match[1];
          const res = await fetch(`https://lighterpack.com/r/${shareId}.json`);
          if (!res.ok) return { success: false, count: 0, error: "Could not fetch pack data" };

          const data = await res.json();
          const { mapCategory } = await import("@/utils/import-parser");

          const items: PackItem[] = (data.items || []).map((raw: { name?: string; description?: string; category?: string; weight?: number; unit?: string; price?: number; url?: string; worn?: boolean; consumable?: boolean; qty?: number; star?: number }) => {
            // Convert weight to oz
            let weightOz = raw.weight || 0;
            const unit = (raw.unit || "oz").toLowerCase();
            if (unit === "g" || unit === "grams") weightOz = weightOz / 28.3495;
            if (unit === "kg") weightOz = (weightOz * 1000) / 28.3495;
            if (unit === "lb" || unit === "lbs") weightOz = weightOz * 16;

            const category = raw.category ? mapCategory(raw.category) : "accessories";

            const item: GearItem = {
              id: `lp-${Date.now()}-${generateId()}`,
              name: raw.name || "Unknown Item",
              brand: "",
              category,
              tier: "mid",
              weightOz: Math.round(weightOz * 100) / 100,
              priceUsd: raw.price || 0,
              description: raw.description || "",
              url: raw.url || undefined,
            };

            let status: ItemStatus = "packed";
            if (raw.worn) status = "worn";
            if (raw.consumable) status = "consumable";

            return {
              gearId: item.id,
              item,
              status,
              quantity: raw.qty || 1,
              starred: (raw.star || 0) > 0,
              url: raw.url || undefined,
            };
          });

          if (items.length === 0) return { success: false, count: 0, error: "No items found" };

          // Create a new loadout with the imported data
          const newId = generateId();
          const state = get();
          set({
            loadouts: [
              ...state.loadouts,
              { id: newId, name: data.name || "LighterPack Import", items },
            ],
            activeLoadoutId: newId,
          });

          return { success: true, count: items.length };
        } catch (e) {
          return { success: false, count: 0, error: "Failed to import" };
        }
      },

      clearPack: () => {
        const state = get();
        set({
          loadouts: state.loadouts.map((l) =>
            l.id === state.activeLoadoutId ? { ...l, items: [] } : l
          ),
        });
      },

      getBaseWeight: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout || loadout.items.length === 0) return 0;
        return loadout.items
          .filter((i) => i.status === "packed")
          .reduce((sum, i) => sum + (i.item?.weightOz ?? 0) * i.quantity, 0);
      },

      getTotalWeight: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout || loadout.items.length === 0) return 0;
        return loadout.items.reduce(
          (sum, i) => sum + (i.item?.weightOz ?? 0) * i.quantity, 0
        );
      },

      getWornWeight: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout || loadout.items.length === 0) return 0;
        return loadout.items
          .filter((i) => i.status === "worn")
          .reduce((sum, i) => sum + (i.item?.weightOz ?? 0) * i.quantity, 0);
      },

      getConsumableWeight: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout || loadout.items.length === 0) return 0;
        return loadout.items
          .filter((i) => i.status === "consumable")
          .reduce((sum, i) => sum + (i.item?.weightOz ?? 0) * i.quantity, 0);
      },

      getCategoryBreakdown: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout) return [];
        const items = loadout.items.filter((i) => i.status === "packed");
        const baseWeight = items.reduce(
          (sum, i) => sum + i.item.weightOz * i.quantity, 0
        );
        const map = new Map<string, number>();
        items.forEach((i) => {
          const cat = i.item.category;
          const current = map.get(cat) || 0;
          map.set(cat, current + i.item.weightOz * i.quantity);
        });
        return Array.from(map.entries())
          .map(([category, weightOz]) => ({
            category,
            weightOz,
            percentage: baseWeight > 0 ? (weightOz / baseWeight) * 100 : 0,
          }))
          .sort((a, b) => b.weightOz - a.weightOz);
      },

      getBig3Weight: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout) return 0;
        const big3Categories = ["shelter", "sleep", "pack"];
        return loadout.items
          .filter((i) => i.status === "packed" && big3Categories.includes(i.item.category))
          .reduce((sum, i) => sum + i.item.weightOz * i.quantity, 0);
      },

      getTotalCost: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout) return 0;
        return loadout.items.reduce(
          (sum, i) => sum + i.item.priceUsd * i.quantity, 0
        );
      },

      getItemCount: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout) return 0;
        return loadout.items.reduce((sum, i) => sum + i.quantity, 0);
      },

      rehydrateItems: async () => {
        const { getGearByIds } = await import("@/lib/gear-api");
        const state = get();
        // Collect all non-quick item IDs across all loadouts
        const allIds = new Set<string>();
        state.loadouts.forEach((l) =>
          l.items.forEach((pi) => {
            if (!pi.gearId.startsWith("quick-")) allIds.add(pi.gearId);
          })
        );
        if (allIds.size === 0) return;
        const freshItems = await getGearByIds(Array.from(allIds));
        if (freshItems.length === 0) return;
        const freshMap = new Map(freshItems.map((g) => [g.id, g]));
        set({
          loadouts: state.loadouts.map((l) => ({
            ...l,
            items: l.items.map((pi) => {
              const fresh = freshMap.get(pi.gearId);
              if (fresh) return { ...pi, item: { ...pi.item, ...fresh } };
              return pi;
            }),
          })),
        });
      },

      hydrateFromShareData: (items, name) => {
        const state = get();
        const newId = generateId();
        set({
          loadouts: [
            ...state.loadouts,
            { id: newId, name: `${name} (shared)`, items },
          ],
          activeLoadoutId: newId,
        });
      },

      generateShareURL: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout) return "";
        const shareData = {
          n: loadout.name,
          i: loadout.items.map((pi) => ({
            nm: pi.item.name,
            br: pi.item.brand,
            ca: pi.item.category,
            wt: pi.item.weightOz,
            pr: pi.item.priceUsd,
            st: pi.status,
            qt: pi.quantity,
            sr: pi.starred ? 1 : 0,
            ur: pi.url || pi.item.url || "",
          })),
        };
        const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
        return `${typeof window !== "undefined" ? window.location.origin : ""}/pack-lab?share=${encoded}`;
      },

      exportCSV: () => {
        const state = get();
        const loadout = state.loadouts.find((l) => l.id === state.activeLoadoutId);
        if (!loadout) return "";
        const labels = get().getAllCategoryLabels();
        const header = "Name,Brand,Category,Weight (oz),Price ($),Status,Quantity,Starred";
        const rows = loadout.items.map((pi) =>
          [
            `"${pi.item.name}"`,
            `"${pi.item.brand}"`,
            `"${labels[pi.item.category] || pi.item.category}"`,
            pi.item.weightOz.toFixed(1),
            pi.item.priceUsd.toFixed(2),
            pi.status,
            pi.quantity,
            pi.starred ? "yes" : "no",
          ].join(",")
        );
        return [header, ...rows].join("\n");
      },
    }),
    {
      name: "hikemind-pack-v2",
    }
  )
);

// Re-export formatting utilities
export {
  formatWeight as formatWeightLbOz,
  formatWeightWithUnit as formatWeight,
  ozToGrams,
} from "@/utils/format";
