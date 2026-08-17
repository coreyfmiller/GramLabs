import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GearItem, GearCategory } from "@/data/gear-database";

export type ItemStatus = "packed" | "worn" | "consumable";

export interface PackItem {
  gearId: string;
  item: GearItem;
  status: ItemStatus;
  quantity: number;
}

export interface PackStore {
  packName: string;
  items: PackItem[];
  setPackName: (name: string) => void;
  addItem: (item: GearItem, status?: ItemStatus) => void;
  removeItem: (gearId: string) => void;
  updateItemStatus: (gearId: string, status: ItemStatus) => void;
  updateItemQuantity: (gearId: string, quantity: number) => void;
  clearPack: () => void;
  getBaseWeight: () => number;
  getTotalWeight: () => number;
  getWornWeight: () => number;
  getConsumableWeight: () => number;
  getCategoryBreakdown: () => { category: GearCategory; weightOz: number; percentage: number }[];
}

export const usePackStore = create<PackStore>()(
  persist(
    (set, get) => ({
      packName: "My Pack",
      items: [],

      setPackName: (name) => set({ packName: name }),

      addItem: (item, status = "packed") => {
        const existing = get().items.find((i) => i.gearId === item.id);
        if (existing) return;
        set((state) => ({
          items: [...state.items, { gearId: item.id, item, status, quantity: 1 }],
        }));
      },

      removeItem: (gearId) =>
        set((state) => ({
          items: state.items.filter((i) => i.gearId !== gearId),
        })),

      updateItemStatus: (gearId, status) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.gearId === gearId ? { ...i, status } : i
          ),
        })),

      updateItemQuantity: (gearId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.gearId === gearId ? { ...i, quantity } : i
          ),
        })),

      clearPack: () => set({ items: [] }),

      getBaseWeight: () => {
        return get()
          .items.filter((i) => i.status === "packed")
          .reduce((sum, i) => sum + i.item.weightOz * i.quantity, 0);
      },

      getTotalWeight: () => {
        return get().items.reduce(
          (sum, i) => sum + i.item.weightOz * i.quantity,
          0
        );
      },

      getWornWeight: () => {
        return get()
          .items.filter((i) => i.status === "worn")
          .reduce((sum, i) => sum + i.item.weightOz * i.quantity, 0);
      },

      getConsumableWeight: () => {
        return get()
          .items.filter((i) => i.status === "consumable")
          .reduce((sum, i) => sum + i.item.weightOz * i.quantity, 0);
      },

      getCategoryBreakdown: () => {
        const items = get().items.filter((i) => i.status === "packed");
        const baseWeight = items.reduce(
          (sum, i) => sum + i.item.weightOz * i.quantity,
          0
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
    }),
    {
      name: "gramlab-pack",
    }
  )
);
