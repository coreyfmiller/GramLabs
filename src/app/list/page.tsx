"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { usePackStore } from "@/store/pack-store";
import type { ItemStatus } from "@/store/pack-store";
import { formatWeightWithUnit } from "@/utils/format";
import { decodeShareParam } from "@/lib/pack-share";
import { PackSaveMenu } from "@/components/PackSaveMenu";
import { ListChart, CHART_OPTIONS, type ListChartType, type Slice } from "@/components/list/ListCharts";
import { Plus, Trash2, Share2, Download, Upload, LayoutGrid, X } from "lucide-react";

// Reuse a fixed palette for auto-coloring free-text categories.
const PALETTE = ["#f97316", "#ec4899", "#14b8a6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ef4444", "#10b981", "#6366f1", "#d946ef", "#3b82f6", "#84cc16"];

function ShareHydrator() {
  const params = useSearchParams();
  const hydrate = usePackStore((s) => s.hydrateFromShareData);
  useEffect(() => {
    const p = params.get("share");
    if (!p) return;
    const decoded = decodeShareParam(p);
    if (decoded) {
      hydrate(decoded.items, decoded.name);
      window.history.replaceState({}, "", "/list");
    }
  }, [params, hydrate]);
  return null;
}

function ListInner() {
  const items = usePackStore((s) => s.getItems());
  const packName = usePackStore((s) => s.getPackName());
  const weightUnit = usePackStore((s) => s.weightUnit);
  const setWeightUnit = usePackStore((s) => s.setWeightUnit);
  const setPackName = usePackStore((s) => s.setPackName);
  const addQuickItem = usePackStore((s) => s.addQuickItem);
  const removeItem = usePackStore((s) => s.removeItem);
  const updateItemStatus = usePackStore((s) => s.updateItemStatus);
  const updateItemQuantity = usePackStore((s) => s.updateItemQuantity);
  const updateItemDetails = usePackStore((s) => s.updateItemDetails);
  const generateShareURL = usePackStore((s) => s.generateShareURL);
  const exportCSV = usePackStore((s) => s.exportCSV);
  const importFromLighterPack = usePackStore((s) => s.importFromLighterPack);
  const getBaseWeight = usePackStore((s) => s.getBaseWeight);
  const getTotalWeight = usePackStore((s) => s.getTotalWeight);
  const getWornWeight = usePackStore((s) => s.getWornWeight);
  const getConsumableWeight = usePackStore((s) => s.getConsumableWeight);
  const getTotalCost = usePackStore((s) => s.getTotalCost);
  const getAllCategoryLabels = usePackStore((s) => s.getAllCategoryLabels);
  const getAllCategoryColors = usePackStore((s) => s.getAllCategoryColors);

  const [chart, setChart] = useState<ListChartType>("donut");
  const [showImport, setShowImport] = useState(false);
  const [lpUrl, setLpUrl] = useState("");
  const [csv, setCsv] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const labels = getAllCategoryLabels();
  const colors = getAllCategoryColors();

  // Group items by category (preserve free-text categories as raw keys).
  const grouped = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const it of items) {
      const c = it.item.category;
      if (!m.has(c)) m.set(c, []);
      m.get(c)!.push(it);
    }
    return [...m.entries()];
  }, [items]);

  const colorFor = (cat: string, idx: number) => colors[cat] || PALETTE[idx % PALETTE.length];

  // Category slices for charts (packed items = base weight, LighterPack's default view).
  const slices: Slice[] = useMemo(() => {
    const m = new Map<string, number>();
    items.filter((i) => i.status === "packed").forEach((i) => {
      m.set(i.item.category, (m.get(i.item.category) || 0) + i.item.weightOz * i.quantity);
    });
    return [...m.entries()].map(([cat, value], idx) => ({
      label: labels[cat] || cat,
      value,
      color: colorFor(cat, idx),
    }));
  }, [items, labels, colors]);

  const splitSlices: Slice[] = [
    { label: "Base", value: getBaseWeight(), color: "#3b82f6" },
    { label: "Worn", value: getWornWeight(), color: "#10b981" },
    { label: "Consumable", value: getConsumableWeight(), color: "#f59e0b" },
  ].filter((s) => s.value > 0);

  const points = items.map((i, idx) => ({
    label: `${i.item.brand} ${i.item.name}`.trim(),
    weightOz: i.item.weightOz * i.quantity,
    priceUsd: i.item.priceUsd * i.quantity,
    color: colorFor(i.item.category, idx),
  }));

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  async function doShare() {
    const url = generateShareURL(); // now emits a working /list?share= link
    try { await navigator.clipboard.writeText(url); flash("Share link copied to clipboard"); }
    catch { flash("Couldn't copy — link: " + url); }
  }

  function doExportCSV() {
    const blob = new Blob([exportCSV()], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${packName || "gear-list"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function doImportLP() {
    if (!lpUrl.trim()) return;
    setImportMsg("Importing…");
    const res = await importFromLighterPack(lpUrl.trim());
    setImportMsg(res.success ? `Imported ${res.count} items` : (res.error || "Import failed"));
    if (res.success) { setLpUrl(""); setTimeout(() => setShowImport(false), 1200); }
  }

  function doImportCSV() {
    // Expect: Name,Brand,Category,Weight (oz),Price,Status,Quantity[,Starred]
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) { setImportMsg("Paste CSV with a header row + items"); return; }
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 4) continue;
      const [name, brand, category, weightOz, price, status, qty] = cols;
      const w = parseFloat(weightOz);
      if (!name || Number.isNaN(w)) continue;
      addQuickItem(name, category || "accessories", w, price ? parseFloat(price) || 0 : 0);
      count++;
      // apply status/qty/brand after add — items keyed by quick- id are appended last
      const st = (status || "packed").toLowerCase();
      const list = usePackStore.getState().getItems();
      const added = list[list.length - 1];
      if (added) {
        if (["worn", "consumable", "packed"].includes(st)) updateItemStatus(added.gearId, st as ItemStatus);
        if (qty && parseInt(qty) > 1) updateItemQuantity(added.gearId, parseInt(qty));
        if (brand) updateItemDetails(added.gearId, { brand });
      }
    }
    setImportMsg(`Imported ${count} items`);
    if (count) { setCsv(""); setTimeout(() => setShowImport(false), 1200); }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            value={packName}
            onChange={(e) => setPackName(e.target.value)}
            className="min-w-0 flex-1 border-b border-transparent bg-transparent text-2xl font-bold tracking-tight focus:border-foreground/30 focus:outline-none"
            aria-label="List name"
          />
          <div className="flex items-center gap-1.5">
            <button onClick={() => setWeightUnit(weightUnit === "oz" ? "g" : "oz")}
              className="rounded-lg border border-foreground/15 px-2.5 py-1.5 text-xs font-medium">{weightUnit === "oz" ? "oz/lb" : "g/kg"}</button>
            <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-1 rounded-lg border border-foreground/15 px-2.5 py-1.5 text-xs font-medium"><Upload size={14} /> Import</button>
            <button onClick={doExportCSV} className="inline-flex items-center gap-1 rounded-lg border border-foreground/15 px-2.5 py-1.5 text-xs font-medium"><Download size={14} /> CSV</button>
            <button onClick={doShare} className="inline-flex items-center gap-1 rounded-lg border border-foreground/15 px-2.5 py-1.5 text-xs font-medium"><Share2 size={14} /> Share</button>
            <PackSaveMenu variant="list" redirectTo="/list" />
            <Link href="/pack-lab" className="inline-flex items-center gap-1 rounded-lg border border-foreground/15 px-2.5 py-1.5 text-xs font-medium"><LayoutGrid size={14} /> Pack Lab</Link>
          </div>
        </div>

        {/* Totals strip */}
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { k: "Base", v: getBaseWeight() },
            { k: "Worn", v: getWornWeight() },
            { k: "Consumable", v: getConsumableWeight() },
            { k: "Total", v: getTotalWeight() },
          ].map((t) => (
            <div key={t.k} className="rounded-lg border border-foreground/10 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.k}</div>
              <div className="num text-sm font-semibold">{formatWeightWithUnit(t.v, weightUnit)}</div>
            </div>
          ))}
          <div className="rounded-lg border border-foreground/10 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost</div>
            <div className="num text-sm font-semibold">${getTotalCost().toFixed(0)}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* The list */}
          <div>
            {grouped.length === 0 && (
              <p className="rounded-lg border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-muted-foreground">
                Your list is empty. Add an item below, or Import a LighterPack list / CSV.
              </p>
            )}
            {grouped.map(([cat, catItems], gi) => {
              const subtotal = catItems.reduce((a, i) => a + i.item.weightOz * i.quantity, 0);
              return (
                <div key={cat} className="mb-5">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: colorFor(cat, gi) }} />
                    <h3 className="text-sm font-semibold">{labels[cat] || cat}</h3>
                    <span className="num ml-auto text-xs text-muted-foreground">{formatWeightWithUnit(subtotal, weightUnit)}</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-foreground/10">
                    {catItems.map((it) => (
                      <div key={it.gearId} className="flex items-center gap-2 border-b border-foreground/5 px-2 py-1.5 last:border-b-0">
                        <input value={it.item.name} onChange={(e) => updateItemDetails(it.gearId, { name: e.target.value })}
                          className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none" placeholder="Item name" />
                        <input value={it.item.brand} onChange={(e) => updateItemDetails(it.gearId, { brand: e.target.value })}
                          className="hidden w-24 bg-transparent text-xs text-muted-foreground focus:outline-none sm:block" placeholder="Brand" />
                        <select value={it.status} onChange={(e) => updateItemStatus(it.gearId, e.target.value as ItemStatus)}
                          className="rounded border border-foreground/10 bg-transparent px-1 py-0.5 text-[11px]">
                          <option value="packed">Pack</option>
                          <option value="worn">Worn</option>
                          <option value="consumable">Consum.</option>
                        </select>
                        <input type="number" min={1} value={it.quantity} onChange={(e) => updateItemQuantity(it.gearId, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 rounded border border-foreground/10 bg-transparent px-1 py-0.5 text-center text-xs" />
                        <input type="number" step="0.01" value={Number.isFinite(it.item.weightOz) ? it.item.weightOz : 0}
                          onChange={(e) => updateItemDetails(it.gearId, { weightOz: parseFloat(e.target.value) || 0 })}
                          className="w-16 rounded border border-foreground/10 bg-transparent px-1 py-0.5 text-right text-xs" title="weight (oz)" />
                        <input type="number" step="0.01" value={it.item.priceUsd}
                          onChange={(e) => updateItemDetails(it.gearId, { priceUsd: parseFloat(e.target.value) || 0 })}
                          className="hidden w-16 rounded border border-foreground/10 bg-transparent px-1 py-0.5 text-right text-xs sm:block" title="price ($)" />
                        <button onClick={() => removeItem(it.gearId)} className="text-muted-foreground hover:text-red-500" aria-label="Remove"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <AddRow onAdd={(name, category, w, p) => addQuickItem(name, category, w, p)} labels={labels} />
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
            <ListChart type={chart} slices={chart === "split" ? splitSlices : slices} points={points} unit={weightUnit} />
          </div>
        </div>
      </div>

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowImport(false)}>
          <div className="w-full max-w-md rounded-2xl bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold">Import</h2>
              <button onClick={() => setShowImport(false)} aria-label="Close"><X size={18} /></button></div>
            <label className="mb-1 block text-xs font-medium opacity-70">From a LighterPack URL</label>
            <div className="mb-4 flex gap-2">
              <input value={lpUrl} onChange={(e) => setLpUrl(e.target.value)} placeholder="https://lighterpack.com/r/…"
                className="flex-1 rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm" />
              <button onClick={doImportLP} className="rounded-lg bg-foreground px-3 py-2 text-sm text-background">Go</button>
            </div>
            <label className="mb-1 block text-xs font-medium opacity-70">Or paste CSV (Name,Brand,Category,Weight (oz),Price,Status,Quantity)</label>
            <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={4}
              className="mb-2 w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 font-mono text-xs" placeholder="Name,Brand,Category,Weight (oz),Price,Status,Quantity" />
            <button onClick={doImportCSV} className="w-full rounded-lg border border-foreground/15 px-3 py-2 text-sm font-medium">Import CSV</button>
            {importMsg && <p className="mt-2 text-sm text-muted-foreground">{importMsg}</p>}
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">{toast}</div>}
    </div>
  );
}

function AddRow({ onAdd, labels }: { onAdd: (name: string, category: string, weightOz: number, price: number) => void; labels: Record<string, string> }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("accessories");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const cats = Object.keys(labels);

  function add() {
    const w = parseFloat(weight);
    if (!name.trim() || Number.isNaN(w)) return;
    onAdd(name.trim(), category, w, price ? parseFloat(price) || 0 : 0);
    setName(""); setWeight(""); setPrice("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-foreground/20 px-2 py-2">
      <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder="Add item…" className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-foreground/10 bg-transparent px-1 py-1 text-xs">
        {cats.map((c) => <option key={c} value={c}>{labels[c]}</option>)}
      </select>
      <input value={weight} onChange={(e) => setWeight(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
        type="number" step="0.01" placeholder="oz" className="w-16 rounded border border-foreground/10 bg-transparent px-1 py-1 text-right text-xs" />
      <input value={price} onChange={(e) => setPrice(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
        type="number" step="0.01" placeholder="$" className="w-16 rounded border border-foreground/10 bg-transparent px-1 py-1 text-right text-xs" />
      <button onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background"><Plus size={14} /> Add</button>
    </div>
  );
}

// minimal CSV line parser (handles quoted fields)
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export default function ListPage() {
  return (
    <>
      <Suspense fallback={null}><ShareHydrator /></Suspense>
      <ListInner />
    </>
  );
}
