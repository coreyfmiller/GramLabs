"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { Mountain, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SharedItem {
  n: string; // name
  b: string; // brand
  c: string; // category
  w: number; // weightOz
  s: string; // status: packed | worn | consumable
  q: number; // quantity
}

interface SharedPack {
  n: string; // pack name
  i: SharedItem[];
}

const CATEGORY_LABELS: Record<string, string> = {
  shelter: "Shelter",
  sleep: "Sleep System",
  pack: "Pack",
  kitchen: "Kitchen",
  electronics: "Electronics",
  safety: "Safety",
  accessories: "Accessories",
};

const CATEGORY_COLORS: Record<string, string> = {
  shelter: "#60a5fa",
  sleep: "#a78bfa",
  pack: "#fbbf24",
  kitchen: "#fb923c",
  electronics: "#facc15",
  safety: "#f87171",
  accessories: "#4ade80",
};

function PackViewContent() {
  const searchParams = useSearchParams();
  const shareParam = searchParams.get("share");

  const pack = useMemo<SharedPack | null>(() => {
    if (!shareParam) return null;
    try {
      return JSON.parse(decodeURIComponent(atob(shareParam)));
    } catch {
      return null;
    }
  }, [shareParam]);

  if (!pack) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Invalid or expired pack link.</p>
          <Link href="/" className="text-primary text-sm mt-2 inline-block hover:underline">
            Go to HikeMind
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats
  const items = pack.i || [];
  const baseItems = items.filter((i) => i.s === "packed");
  const wornItems = items.filter((i) => i.s === "worn");
  const consumableItems = items.filter((i) => i.s === "consumable");

  const baseWeight = baseItems.reduce((s, i) => s + i.w * i.q, 0);
  const wornWeight = wornItems.reduce((s, i) => s + i.w * i.q, 0);
  const consumableWeight = consumableItems.reduce((s, i) => s + i.w * i.q, 0);
  const totalWeight = baseWeight + wornWeight + consumableWeight;

  // Group by category
  const groups = Object.entries(
    items.reduce<Record<string, SharedItem[]>>((acc, item) => {
      const cat = item.c || "accessories";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {})
  ).sort(([a], [b]) => {
    const order = ["shelter", "sleep", "pack", "kitchen", "electronics", "safety", "accessories"];
    return order.indexOf(a) - order.indexOf(b);
  });

  // Donut data
  const categoryWeights = groups.map(([cat, catItems]) => ({
    category: cat,
    weight: catItems.reduce((s, i) => s + i.w * i.q, 0),
  }));

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Mountain className="size-[18px]" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">HikeMind</span>
          </Link>
          <Link
            href="/pack-lab"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
          >
            Build yours free
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Pack title + stats */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{pack.n || "Shared Pack"}</h1>
          <div className="mt-3 flex flex-wrap gap-4">
            <Stat label="Base Weight" value={`${(baseWeight / 16).toFixed(2)} lb`} accent />
            <Stat label="Worn" value={`${(wornWeight / 16).toFixed(2)} lb`} />
            <Stat label="Consumables" value={`${(consumableWeight / 16).toFixed(2)} lb`} />
            <Stat label="Total" value={`${(totalWeight / 16).toFixed(2)} lb`} />
            <Stat label="Items" value={String(items.reduce((s, i) => s + i.q, 0))} />
          </div>
        </div>

        {/* Donut chart */}
        <div className="mb-8 flex justify-center">
          <MiniDonut segments={categoryWeights} total={baseWeight} />
        </div>

        {/* Gear list by category */}
        <div className="space-y-6">
          {groups.map(([category, catItems]) => {
            const catWeight = catItems.reduce((s, i) => s + i.w * i.q, 0);
            return (
              <section key={category}>
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {CATEGORY_LABELS[category] || category}
                  </h2>
                  <span className="num text-xs text-muted-foreground">
                    {(catWeight / 16).toFixed(2)} lb
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  {catItems.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between px-4 py-3",
                        i < catItems.length - 1 && "border-b border-border"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.b && <span className="text-muted-foreground">{item.b} </span>}
                          {item.n}
                        </p>
                        {item.s !== "packed" && (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {item.s}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {item.q > 1 && (
                          <span className="text-[10px] text-muted-foreground">x{item.q}</span>
                        )}
                        <span className="num text-sm font-medium">
                          {item.w.toFixed(1)} oz
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <h3 className="text-lg font-semibold">Build your own pack</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            HikeMind helps you track, optimize, and compare your hiking gear. Free forever.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => {
                // Import this pack as a new loadout
                const { usePackStore } = require("@/store/pack-store");
                const store = usePackStore.getState();
                store.createLoadout(pack.n || "Copied Pack");
                items.forEach((item) => {
                  store.addItem({
                    id: `copy-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                    name: item.n,
                    brand: item.b || "",
                    category: item.c || "accessories",
                    weightOz: item.w,
                    priceUsd: 0,
                    tier: "mid",
                    description: "",
                  });
                });
                window.location.href = "/pack-lab";
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card font-medium text-sm text-foreground hover:bg-muted transition-colors"
            >
              Copy this pack to mine
            </button>
            <Link
              href="/pack-lab"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all"
            >
              Start from scratch
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={cn("num text-lg font-semibold", accent ? "text-primary" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function MiniDonut({ segments, total }: { segments: { category: string; weight: number }[]; total: number }) {
  if (total === 0) return null;

  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {segments.map((seg) => {
        const pct = seg.weight / total;
        const dashLength = pct * circumference;
        const currentOffset = offset;
        offset += dashLength;

        return (
          <circle
            key={seg.category}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={CATEGORY_COLORS[seg.category] || "#666"}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export default function PackViewPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading pack...</p></div>}>
      <PackViewContent />
    </Suspense>
  );
}
