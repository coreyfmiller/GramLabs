import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GearItem, GearCategory } from "@/data/gear-database";

export type ItemStatus = "packed" | "worn" | "consumable";

export type WeightUnit = "oz" | "g";

export interface PackItem {
  gearId: string;
  item: GearItem;
  status: ItemStatus;
  quantity: number;
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

  // Buy List
  buyList: GearItem[];
  addToBuyList: (item: GearItem) => void;
  removeFromBuyList: (id: string) => void;
  moveToPack: (id: string) => void;
  clearBuyList: () => void;
  getBuyListCost: () => number;

  // Loadout management
  createLoadout: (name: string) => void;
  deleteLoadout: (id: string) => void;
  switchLoadout: (id: string) => void;
  renameLoadout: (id: string, name: string) => void;
  setWeightUnit: (unit: WeightUnit) => void;

  // Item management (operates on active loadout)
  setPackName: (name: string) => void;
  addItem: (item: GearItem, status?: ItemStatus) => void;
  removeItem: (gearId: string) => void;
  updateItemStatus: (gearId: string, status: ItemStatus) => void;
  updateItemQuantity: (gearId: string, quantity: number) => void;
  clearPack: () => void;

  // Computed helpers
  getActiveLoadout: () => Loadout | undefined;
  getPackName: () => string;
  getItems: () => PackItem[];
  getBaseWeight: () => number;
  getTotalWeight: () => number;
  getWornWeight: () => number;
  getConsumableWeight: () => number;
  getCategoryBreakdown: () => { category: GearCategory; weightOz: number; percentage: number }[];
  getBig3Weight: () => number;
  getTotalCost: () => number;
  getItemCount: () => number;

  // Share
  hydrateFromShareData: (items: PackItem[], name: string) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const DEFAULT_LOADOUT_ID = "default";

export const usePackStore = create<PackStore>()(
  persist(
    (set, get) => ({
      loadouts: [{ id: DEFAULT_LOADOUT_ID, name: "My Pack", items: [] }],
      activeLoadoutId: DEFAULT_LOADOUT_ID,
      weightUnit: "oz" as WeightUnit,
      buyList: [],

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
                    { gearId: item.id, item, status, quantity: 1 },
                  ],
                }
              : l
          ),
        });
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
        const map = new Map<GearCategory, number>();
        items.forEach((i) => {
          const current = map.get(i.item.category) || 0;
          map.set(i.item.category, current + i.item.weightOz * i.quantity);
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
