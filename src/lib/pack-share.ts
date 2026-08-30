import type { PackItem } from "@/store/pack-store";
import type { GearItem, GearCategory } from "@/data/gear-database";

/**
 * Shared codec for the `?share=` URL param used by /pack-lab, /list and /p (public view).
 * The pack store's `generateShareURL` encodes this exact shape. Historically the store
 * pointed the link at /pack/view (which never existed) — the real decoders live here.
 */
export interface SharePayloadItem {
  nm: string; br: string; ca: string; wt: number; pr: number;
  st: string; qt: number; sr?: number; ur?: string;
}
export interface SharePayload {
  n: string;
  i: SharePayloadItem[];
  // Optional category label/color definitions so free-text/custom categories
  // keep their human label + color when moved between surfaces.
  c?: { id: string; label: string; color: string }[];
}

/** Decode a base64 `?share=` param into { name, items, categories }. Returns null if invalid. */
export function decodeShareParam(param: string): { name: string; items: PackItem[]; categories: { id: string; label: string; color: string }[] } | null {
  try {
    const decoded = JSON.parse(decodeURIComponent(atob(param))) as SharePayload;
    const name = decoded.n || "Shared Pack";
    const items: PackItem[] = (decoded.i || []).map((raw) => {
      const id = `shared-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const item: GearItem = {
        id,
        name: raw.nm,
        brand: raw.br || "",
        category: (raw.ca || "accessories") as GearCategory,
        tier: "mid",
        weightOz: raw.wt || 0,
        priceUsd: raw.pr || 0,
        description: "",
        url: raw.ur || undefined,
      };
      return {
        gearId: id,
        item,
        status: (raw.st || "packed") as PackItem["status"],
        quantity: raw.qt || 1,
        starred: raw.sr === 1,
        url: raw.ur || undefined,
      };
    });
    return { name, items, categories: decoded.c || [] };
  } catch {
    return null;
  }
}
