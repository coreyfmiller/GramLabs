"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PackBuilder } from "@/components/PackLabV2/PackBuilder";
import { usePackStore } from "@/store/pack-store";
import { GearItem, GearCategory } from "@/data/gear-database";
import { PackItem } from "@/store/pack-store";

function ShareHydrator() {
  const searchParams = useSearchParams();
  const hydrateFromShareData = usePackStore((s) => s.hydrateFromShareData);

  useEffect(() => {
    const shareParam = searchParams.get("share");
    if (!shareParam) return;

    try {
      const decoded = JSON.parse(decodeURIComponent(atob(shareParam)));
      const name = decoded.n || "Shared Pack";
      const items: PackItem[] = (decoded.i || []).map(
        (raw: { nm: string; br: string; ca: string; wt: number; pr: number; st: string; qt: number; sr?: number }) => {
          const item: GearItem = {
            id: `shared-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: raw.nm,
            brand: raw.br || "",
            category: (raw.ca || "accessories") as GearCategory,
            tier: "mid",
            weightOz: raw.wt || 0,
            priceUsd: raw.pr || 0,
            description: "",
          };
          return {
            gearId: item.id,
            item,
            status: (raw.st || "packed") as "packed" | "worn" | "consumable",
            quantity: raw.qt || 1,
            starred: raw.sr === 1,
          };
        }
      );
      hydrateFromShareData(items, name);
      // Clean URL
      window.history.replaceState({}, "", "/pack-lab");
    } catch {
      // Invalid share data, ignore
    }
  }, [searchParams, hydrateFromShareData]);

  return null;
}

export default function PackLabPage() {
  return (
    <>
      <Suspense fallback={null}>
        <ShareHydrator />
      </Suspense>
      <PackBuilder />
    </>
  );
}
