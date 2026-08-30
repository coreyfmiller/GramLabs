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

export const MAX_PACK_ITEMS = 500;
export const MAX_PACK_NAME = 200;

/**
 * Validate + normalize an untrusted SharePayload before persisting it (used by the
 * save-pack API). Clamps sizes and coerces field types. Returns null if unusable.
 */
export function sanitizeSharePayload(raw: unknown): SharePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const items = Array.isArray(p.i) ? p.i : null;
  if (!items || items.length > MAX_PACK_ITEMS) return null;
  const cleanItems: SharePayloadItem[] = items.slice(0, MAX_PACK_ITEMS).map((it) => {
    const o = (it || {}) as Record<string, unknown>;
    return {
      nm: String(o.nm ?? "").slice(0, 200),
      br: String(o.br ?? "").slice(0, 120),
      ca: String(o.ca ?? "accessories").slice(0, 60),
      wt: Number(o.wt) || 0,
      pr: Number(o.pr) || 0,
      st: String(o.st ?? "packed").slice(0, 20),
      qt: Math.max(1, Math.min(999, Number(o.qt) || 1)),
      sr: o.sr === 1 || o.sr === true ? 1 : 0,
      ur: o.ur ? String(o.ur).slice(0, 500) : "",
    };
  });
  const cats = Array.isArray(p.c)
    ? p.c.slice(0, 60).map((c) => {
        const o = (c || {}) as Record<string, unknown>;
        return {
          id: String(o.id ?? "").slice(0, 60),
          label: String(o.label ?? "").slice(0, 60),
          color: String(o.color ?? "#888").slice(0, 20),
        };
      })
    : undefined;
  return { n: String(p.n ?? "Untitled Pack").slice(0, MAX_PACK_NAME), i: cleanItems, c: cats };
}

/** Turn a persisted/loaded SharePayload directly into decoded pack items (no base64 step). */
export function payloadToItems(payload: SharePayload): { name: string; items: PackItem[]; categories: { id: string; label: string; color: string }[] } {
  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
  return decodeShareParam(encoded) ?? { name: payload.n || "Shared Pack", items: [], categories: payload.c || [] };
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
