"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PackBuilder } from "@/components/PackLabV2/PackBuilder";
import { usePackStore } from "@/store/pack-store";
import { decodeShareParam } from "@/lib/pack-share";

function ShareHydrator() {
  const searchParams = useSearchParams();
  const hydrateFromShareData = usePackStore((s) => s.hydrateFromShareData);

  useEffect(() => {
    const shareParam = searchParams.get("share");
    if (!shareParam) return;
    // Shared codec (also used by /list and /p) — round-trips url + custom categories.
    const decoded = decodeShareParam(shareParam);
    if (decoded) {
      hydrateFromShareData(decoded.items, decoded.name);
      window.history.replaceState({}, "", "/pack-lab");
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
