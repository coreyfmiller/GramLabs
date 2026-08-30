"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { usePackStore } from "@/store/pack-store";
import { formatWeightWithUnit, formatPrice } from "@/utils/format";
import { payloadToItems, type SharePayload } from "@/lib/pack-share";
import { ListChart, CHART_OPTIONS, type ListChartType, type Slice } from "@/components/list/ListCharts";
import { LayoutGrid, Copy, Check } from "lucide-react";

const PALETTE = ["#f97316", "#ec4899", "#14b8a6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ef4444", "#10b981", "#6366f1", "#d946ef", "#3b82f6", "#84cc16"];

/**
 * Read-only public view of a saved pack at /p/<id>.
 * Renders the same charts as /list but with no editing. An "Open in Pack Lab"
 * button clones the pack into the shared store so a visitor can keep working on it.
 */
export function PackViewClient({ id, name, payload }: { id: string; name: string; payload: SharePayload }) {
  const [chart, setChart] = useState<ListChartType>("donut");
  const [unit, setUnit] = useState<"oz" | "g">("oz");
  const [copied, setCopied] = useState(false);
  const hydrate = usePackStore((s) => s.hydrateFromShareData);

  // Decode the persisted payload into full pack items once.
  const { items, categories } = useMemo(() => payloadToItems(payload), [payload]);

  const labels = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => { m[c.id] = c.label; });
    return m;
  }, [categories]);
  const colors = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => { m[c.id] = c.color; });
    return m;
  }, [categories]);

  const colorFor = (cat: string, idx: number) => colors[cat] || PALETTE[idx % PALETTE.length];

  const weight = (statuses: string[]) =>
    items.filter((i) => statuses.includes(i.status)).reduce((a, i) => a + i.item.weightOz * i.quantity, 0);
  const base = weight(["packed"]);
  const worn = weight(["worn"]);
  const consumable = weight(["consumable"]);
  const total = base + worn + consumable;
  const cost = items.reduce((a, i) => a + i.item.priceUsd * i.quantity, 0);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const it of items) {
      const c = it.item.category;
      if (!m.has(c)) m.set(c, []);
      m.get(c)!.push(it);
    }
    return [...m.entries()];
  }, [items]);

  const slices: Slice[] = useMemo(() => {
    const m = new Map<string, number>();
    items.filter((i) => i.status === "packed").forEach((i) => {
      m.set(i.item.category, (m.get(i.item.category) || 0) + i.item.weightOz * i.quantity);
    });
    return [...m.entries()].map(([cat, value], idx) => ({ label: labels[cat] || cat, value, color: colorFor(cat, idx) }));
  }, [items, labels, colors]);

  const splitSlices: Slice[] = [
    { label: "Base", value: base, color: "#3b82f6" },
    { label: "Worn", value: worn, color: "#10b981" },
    { label: "Consumable", value: consumable, color: "#f59e0b" },
  ].filter((s) => s.value > 0);

  const points = items.map((i, idx) => ({
    label: `${i.item.brand} ${i.item.name}`.trim(),
    weightOz: i.item.weightOz * i.quantity,
    priceUsd: i.item.priceUsd * i.quantity,
    color: colorFor(i.item.category, idx),
  }));

  function openInPackLab() {
    hydrate(items, name);
    window.location.href = "/list";
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  }

  // formatWeightWithUnit converts oz -> the requested unit internally.
  const displayWeight = (oz: number) => formatWeightWithUnit(oz, unit);
  void id;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Shared gear list</div>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setUnit(unit === "oz" ? "g" : "oz")}
              className="rounded-lg border border-foreground/15 px-2.5 py-1.5 text-xs font-medium">{unit === "oz" ? "oz/lb" : "g/kg"}</button>
            <button onClick={copyLink} className="inline-flex items-center gap-1 rounded-lg border border-foreground/15 px-2.5 py-1.5 text-xs font-medium">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy link"}
            </button>
            <button onClick={openInPackLab} className="inline-flex items-center gap-1 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background">
              <LayoutGrid size={14} /> Open &amp; edit
            </button>
          </div>
        </div>

        {/* Totals strip */}
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { k: "Base", v: base },
            { k: "Worn", v: worn },
            { k: "Consumable", v: consumable },
            { k: "Total", v: total },
          ].map((t) => (
            <div key={t.k} className="rounded-lg border border-foreground/10 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.k}</div>
              <div className="num text-sm font-semibold">{displayWeight(t.v)}</div>
            </div>
          ))}
          <div className="rounded-lg border border-foreground/10 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost</div>
            <div className="num text-sm font-semibold">{formatPrice(Math.round(cost))}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Read-only list */}
          <div>
            {grouped.map(([cat, catItems], gi) => {
              const subtotal = catItems.reduce((a, i) => a + i.item.weightOz * i.quantity, 0);
              return (
                <div key={cat} className="mb-5">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: colorFor(cat, gi) }} />
                    <h3 className="text-sm font-semibold">{labels[cat] || cat}</h3>
                    <span className="num ml-auto text-xs text-muted-foreground">{displayWeight(subtotal)}</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-foreground/10">
                    {catItems.map((it) => (
                      <div key={it.gearId} className="flex items-center gap-2 border-b border-foreground/5 px-3 py-1.5 text-sm last:border-b-0">
                        <span className="min-w-0 flex-1 truncate">
                          {it.item.name}
                          {it.item.brand && <span className="ml-1.5 text-xs text-muted-foreground">{it.item.brand}</span>}
                          {it.status !== "packed" && <span className="ml-1.5 rounded bg-foreground/10 px-1 text-[10px] uppercase">{it.status}</span>}
                        </span>
                        {it.quantity > 1 && <span className="num text-xs text-muted-foreground">x{it.quantity}</span>}
                        <span className="num w-16 text-right text-xs">{displayWeight(it.item.weightOz * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="lg:sticky lg:top-4 self-start rounded-xl border border-foreground/10 p-4">
            <div className="mb-3 flex flex-wrap gap-1">
              {CHART_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => setChart(o.value)}
                  className={`rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${chart === o.value ? "bg-foreground text-background" : "border border-foreground/15 text-muted-foreground"}`}>
                  {o.label}
                </button>
              ))}
            </div>
            <ListChart type={chart} slices={chart === "split" ? splitSlices : slices} points={points} unit={unit} />
          </div>
        </div>

        <div className="mt-8 border-t border-foreground/10 pt-4 text-center text-xs text-muted-foreground">
          Made with{" "}
          <Link href="/list" className="font-medium text-foreground underline">HikeMind gear lists</Link>
          {" "}— build and share your own pack for free.
        </div>
      </div>
    </div>
  );
}
