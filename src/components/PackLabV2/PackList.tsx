"use client";

import { useState, useRef, useEffect } from "react";
import {
  GripVertical,
  Minus,
  Plus,
  Shirt,
  Trash2,
  Star,
  Droplets,
  PlusCircle,
  Share2,
  Download,
  Check,
  ExternalLink,
  Pencil,
  Import,
  X,
  ChevronDown,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  GearItem,
} from "@/data/gear-database";
import { usePackStore, PackItem, ItemStatus } from "@/store/pack-store";
import { formatWeightWithUnit } from "@/utils/format";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: string[] = [
  "shelter",
  "sleep",
  "pack",
  "kitchen",
  "electronics",
  "clothing",
  "safety",
  "accessories",
];

export function PackList() {
  const loadouts = usePackStore((s) => s.loadouts);
  const activeLoadoutId = usePackStore((s) => s.activeLoadoutId);
  const getPackName = usePackStore((s) => s.getPackName);
  const setPackName = usePackStore((s) => s.setPackName);
  const getBaseWeight = usePackStore((s) => s.getBaseWeight);
  const createLoadout = usePackStore((s) => s.createLoadout);
  const switchLoadout = usePackStore((s) => s.switchLoadout);
  const deleteLoadout = usePackStore((s) => s.deleteLoadout);
  const removeItem = usePackStore((s) => s.removeItem);
  const updateItemStatus = usePackStore((s) => s.updateItemStatus);
  const updateItemQuantity = usePackStore((s) => s.updateItemQuantity);
  const updateItemUrl = usePackStore((s) => s.updateItemUrl);
  const updateItemDetails = usePackStore((s) => s.updateItemDetails);
  const reorderItem = usePackStore((s) => s.reorderItem);
  const toggleItemStar = usePackStore((s) => s.toggleItemStar);
  const weightUnit = usePackStore((s) => s.weightUnit);
  const setWeightUnit = usePackStore((s) => s.setWeightUnit);
  const customCategories = usePackStore((s) => s.customCategories);
  const generateShareURL = usePackStore((s) => s.generateShareURL);
  const exportCSV = usePackStore((s) => s.exportCSV);
  const addQuickItem = usePackStore((s) => s.addQuickItem);
  const addCustomCategory = usePackStore((s) => s.addCustomCategory);
  const importFromLighterPack = usePackStore((s) => s.importFromLighterPack);
  const rehydrateItems = usePackStore((s) => s.rehydrateItems);

  // Refresh stored items with latest specs from Supabase on mount
  useEffect(() => { rehydrateItems(); }, [rehydrateItems]);

  const items = loadouts.find((l) => l.id === activeLoadoutId)?.items ?? [];
  const packName = getPackName();
  const baseWeight = getBaseWeight();

  const [showLoadoutMenu, setShowLoadoutMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCategoryAdd, setShowCategoryAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(packName);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Build full category order including custom categories
  const allCategoryOrder = [...CATEGORY_ORDER, ...customCategories.map((c) => c.id)];
  const allCategoryLabels: Record<string, string> = { ...CATEGORY_LABELS };
  const allCategoryColors: Record<string, string> = { ...CATEGORY_COLORS };
  customCategories.forEach((c) => {
    allCategoryLabels[c.id] = c.label;
    allCategoryColors[c.id] = c.color;
  });

  const groups = allCategoryOrder
    .map((id) => ({
      category: id,
      items: items.filter((i) => i.item.category === id),
    }))
    .filter((g) => g.items.length > 0);

  function handleShare() {
    const url = generateShareURL();
    navigator.clipboard.writeText(url);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  }

  function handleExport() {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${packName.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleNameSubmit() {
    if (nameValue.trim()) setPackName(nameValue.trim());
    setEditingName(false);
  }

  function handleDrop(targetId: string) {
    if (draggingId && draggingId !== targetId) {
      reorderItem(draggingId, targetId);
    }
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-col border-b border-border p-4 md:px-6">
        {/* Loadout tabs */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto scroll-thin">
          {loadouts.map((l) => (
            <button
              key={l.id}
              onClick={() => switchLoadout(l.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                l.id === activeLoadoutId
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
              )}
            >
              {l.name}
            </button>
          ))}
          <button
            onClick={() => {
              const name = prompt("Loadout name:");
              if (name?.trim()) createLoadout(name.trim());
            }}
            className="px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="New loadout"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {editingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => { if (e.key === "Enter") handleNameSubmit(); if (e.key === "Escape") setEditingName(false); }}
              className="bg-transparent border-b border-primary text-lg font-semibold tracking-tight outline-none w-48"
              autoFocus
            />
          ) : (
            <button
              onClick={() => { setNameValue(packName); setEditingName(true); }}
              className="text-lg font-semibold tracking-tight hover:text-primary transition-colors group flex items-center gap-2"
            >
              {packName}
              <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Unit toggle */}
          <button
            type="button"
            onClick={() => setWeightUnit(weightUnit === "oz" ? "g" : "oz")}
            className="rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            {weightUnit === "oz" ? "oz → g" : "g → oz"}
          </button>

          {/* Import */}
          <a
            href="/import"
            title="Import gear (LighterPack, CSV, or text)"
            className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Import className="size-3.5" />
          </a>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            title="Copy share link"
            className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {shareSuccess ? <Check className="size-3.5 text-primary" /> : <Share2 className="size-3.5" />}
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExport}
            title="Export CSV"
            className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Download className="size-3.5" />
          </button>

          <span aria-hidden="true" className="hidden h-7 w-px bg-white/10 sm:block" />

          <Metric label="Items" value={String(items.reduce((s, i) => s + i.quantity, 0))} />
          <div className="hidden sm:block">
            <Metric label="Base weight" value={formatWeightWithUnit(baseWeight, weightUnit)} accent />
          </div>
        </div>
        </div>
      </header>

      {/* LighterPack import bar */}
      {showImport && (
        <LighterPackImport
          onImport={importFromLighterPack}
          onClose={() => setShowImport(false)}
        />
      )}

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4 md:px-6">
        {items.length === 0 && !showQuickAdd ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-10 text-center">
            <p className="text-sm font-medium">Your pack is empty</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add gear from the library, quick-add below, or import from LighterPack.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 pb-4">
            {groups.map(({ category, items: groupItems }) => {
              const groupWeight = groupItems.reduce((s, i) => s + i.item.weightOz * i.quantity, 0);
              const share = baseWeight > 0 ? groupWeight / baseWeight : 0;

              return (
                <section key={category}>
                  <div className="mb-2 flex items-center gap-3">
                    <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: allCategoryColors[category] || "#888" }} />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.16em]">
                      {allCategoryLabels[category] || category}
                    </h3>
                    <span className="num text-xs text-muted-foreground">
                      {groupItems.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                    <span aria-hidden="true" className="h-px flex-1 bg-white/[0.07]" />
                    <span className="num text-xs text-muted-foreground">{(share * 100).toFixed(0)}%</span>
                    <span className="num text-base font-medium">{formatWeightWithUnit(groupWeight, weightUnit)}</span>
                  </div>

                  <ul className="flex flex-col gap-1.5">
                    {groupItems.map((packItem) => (
                      <li
                        key={packItem.gearId}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDraggingId(packItem.gearId); }}
                        onDragEnd={() => { setDraggingId(null); setOverId(null); }}
                        onDragOver={(e) => { e.preventDefault(); setOverId(packItem.gearId); }}
                        onDrop={(e) => { e.preventDefault(); handleDrop(packItem.gearId); }}
                      >
                        <PackRow
                          packItem={packItem}
                          color={allCategoryColors[category] || "#888"}
                          weightUnit={weightUnit}
                          categories={allCategoryLabels}
                          isDragging={draggingId === packItem.gearId}
                          isDropTarget={overId === packItem.gearId && draggingId !== packItem.gearId}
                          onRemove={() => removeItem(packItem.gearId)}
                          onQty={(delta) => updateItemQuantity(packItem.gearId, Math.max(1, packItem.quantity + delta))}
                          onStatusChange={(status) => updateItemStatus(packItem.gearId, status)}
                          onToggleStar={() => toggleItemStar(packItem.gearId)}
                          onUpdateUrl={(url) => updateItemUrl(packItem.gearId, url)}
                          onUpdateDetails={(updates) => updateItemDetails(packItem.gearId, updates)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-white/10 p-3 md:px-6">
        {showQuickAdd ? (
          <QuickAddForm
            categories={allCategoryLabels}
            onAdd={(name, cat, weight, price, url) => { addQuickItem(name, cat, weight, price, url); setShowQuickAdd(false); }}
            onCancel={() => setShowQuickAdd(false)}
          />
        ) : showCategoryAdd ? (
          <AddCategoryForm
            onAdd={(label, color) => { addCustomCategory(label, color); setShowCategoryAdd(false); }}
            onCancel={() => setShowCategoryAdd(false)}
          />
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowQuickAdd(true)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary">
              <PlusCircle className="size-3.5" />
              Add Item
            </button>
            <button type="button" onClick={() => setShowCategoryAdd(true)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-white/[0.05] hover:text-foreground">
              <Plus className="size-3.5" />
              Add Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== LighterPack Import ========== */
function LighterPackImport({ onImport, onClose }: { onImport: (url: string) => Promise<{ success: boolean; count: number; error?: string }>; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await onImport(url.trim());
    setResult(res);
    setLoading(false);
    if (res.success) setTimeout(onClose, 1500);
  }

  return (
    <div className="border-b border-white/10 px-4 py-3 md:px-6 bg-white/[0.02]">
      <form onSubmit={handleImport} className="flex items-center gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste LighterPack URL (lighterpack.com/r/...)"
          className="form-input flex-1"
          autoFocus
        />
        <button type="submit" disabled={!url.trim() || loading} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">
          {loading ? "Importing..." : "Import"}
        </button>
        <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </form>
      {result && (
        <p className={cn("text-xs mt-2", result.success ? "text-primary" : "text-destructive")}>
          {result.success ? `Imported ${result.count} items!` : result.error}
        </p>
      )}
    </div>
  );
}

/* ========== Quick Add Form ========== */
function QuickAddForm({ categories, onAdd, onCancel }: { categories: Record<string, string>; onAdd: (name: string, category: string, weightOz: number, priceUsd?: number, url?: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("accessories");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !weight) return;
    onAdd(name.trim(), category, parseFloat(weight) || 0, parseFloat(price) || undefined, url.trim() || undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className="form-input flex-1" autoFocus />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input w-28">
          {Object.entries(categories).map(([id, label]) => (<option key={id} value={id}>{label}</option>))}
        </select>
      </div>
      <div className="flex gap-2">
        <input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight (oz)" className="form-input flex-1" />
        <input type="number" step="1" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price ($)" className="form-input flex-1" />
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link (optional)" className="form-input flex-1" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={!name.trim() || !weight} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40">Add</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </form>
  );
}

/* ========== Add Category Form ========== */
function AddCategoryForm({ onAdd, onCancel }: { onAdd: (label: string, color: string) => void; onCancel: () => void }) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#f97316");
  const presetColors = ["#f97316", "#ec4899", "#14b8a6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ef4444", "#10b981", "#6366f1", "#d946ef"];

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (!label.trim()) return; onAdd(label.trim(), color); }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Category name" className="form-input flex-1" autoFocus />
        <button type="submit" disabled={!label.trim()} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">Add</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Color:</span>
        {presetColors.map((c) => (
          <button key={c} type="button" onClick={() => setColor(c)} className={cn("size-5 rounded-full transition-transform", color === c && "ring-2 ring-white ring-offset-1 ring-offset-background scale-110")} style={{ backgroundColor: c }} />
        ))}
      </div>
    </form>
  );
}

/* ========== Metrics ========== */
function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={cn("num text-base font-semibold leading-tight", accent ? "text-primary" : "text-foreground")}>{value}</p>
    </div>
  );
}

/* ========== Pack Row (with inline editing) ========== */
// ─── Spec Display Helper ────────────────────────────────────────────────────

interface SpecDisplay {
  label: string;
  value: string;
}

function getItemSpecs(item: GearItem): SpecDisplay[] {
  const specs: SpecDisplay[] = [];
  const cat = item.category;
  const sub = item.subcategory;

  // Price always shown
  if (item.priceUsd) specs.push({ label: "Price", value: `$${item.priceUsd}` });

  // Shelter
  if (cat === "shelter") {
    if (item.capacity) specs.push({ label: "Capacity", value: `${item.capacity}P` });
    if (item.seasons) specs.push({ label: "Seasons", value: item.seasons });
    if (item.setupType) specs.push({ label: "Setup", value: item.setupType });
    if (item.floorArea) specs.push({ label: "Floor", value: `${item.floorArea} sq ft` });
    if (item.peakHeight) specs.push({ label: "Height", value: `${item.peakHeight}"` });
    if (item.fabric) specs.push({ label: "Fabric", value: item.fabric });
    if (item.doors) specs.push({ label: "Doors", value: String(item.doors) });
    if (item.vestibuleArea) specs.push({ label: "Vestibule", value: `${item.vestibuleArea} sq ft` });
  }

  // Sleep - quilts/bags
  if (cat === "sleep" && (sub === "quilt" || sub === "sleeping-bag" || sub === "underquilt")) {
    if (item.tempRating !== undefined) specs.push({ label: "Temp", value: `${item.tempRating}°F` });
    if (item.fillType) specs.push({ label: "Fill", value: item.fillType });
    if (item.fillPower) specs.push({ label: "Fill Power", value: `${item.fillPower} FP` });
    if (item.fillWeight) specs.push({ label: "Fill Weight", value: `${item.fillWeight} oz` });
    if (item.sleepStyle) specs.push({ label: "Style", value: item.sleepStyle });
  }

  // Sleep - pads
  if (cat === "sleep" && (sub === "pad-inflatable" || sub === "pad-foam")) {
    if (item.rValue) specs.push({ label: "R-Value", value: String(item.rValue) });
    if (item.thickness) specs.push({ label: "Thickness", value: `${item.thickness}"` });
    if (item.padWidth) specs.push({ label: "Width", value: `${item.padWidth}"` });
    if (item.padLength) specs.push({ label: "Length", value: `${item.padLength}"` });
  }

  // Pack
  if (cat === "pack") {
    if (item.volume) specs.push({ label: "Volume", value: `${item.volume}L` });
    if (item.frameType) specs.push({ label: "Frame", value: item.frameType });
    if (item.hipBelt) specs.push({ label: "Hip Belt", value: item.hipBelt });
  }

  // Kitchen - stoves
  if (sub === "stove") {
    if (item.fuelType) specs.push({ label: "Fuel", value: item.fuelType });
    if (item.boilTime) specs.push({ label: "Boil Time", value: `${item.boilTime} min` });
    if (item.igniter !== undefined) specs.push({ label: "Igniter", value: item.igniter ? "Yes" : "No" });
    if (item.simmerControl !== undefined) specs.push({ label: "Simmer", value: item.simmerControl ? "Yes" : "No" });
    if (item.potIncluded !== undefined) specs.push({ label: "Pot Included", value: item.potIncluded ? "Yes" : "No" });
    if (item.communityRating) specs.push({ label: "Rating", value: `${item.communityRating}/10` });
  }

  // Electronics - headlamps
  if (sub === "headlamp") {
    if (item.lumens) specs.push({ label: "Lumens", value: String(item.lumens) });
    if (item.runtime) specs.push({ label: "Runtime", value: `${item.runtime} hrs` });
  }

  // Accessories - trekking poles
  if (sub === "trekking-poles") {
    if (item.poleMaterial) specs.push({ label: "Material", value: item.poleMaterial });
  }

  // Accessories - insulation
  if (sub === "insulation") {
    if (item.fillType) specs.push({ label: "Fill", value: item.fillType });
    if (item.fillPower) specs.push({ label: "Fill Power", value: `${item.fillPower} FP` });
  }

  // Fallback — show description for items without category-specific specs
  if (specs.length <= 1 && item.description) {
    specs.push({ label: "Info", value: item.description });
  }

  return specs;
}

// ─── PackRow Component ──────────────────────────────────────────────────────

function PackRow({ packItem, color, weightUnit, categories, isDragging, isDropTarget, onRemove, onQty, onStatusChange, onToggleStar, onUpdateUrl, onUpdateDetails }: {
  packItem: PackItem; color: string; weightUnit: "oz" | "g"; categories: Record<string, string>;
  isDragging: boolean; isDropTarget: boolean;
  onRemove: () => void; onQty: (delta: number) => void; onStatusChange: (status: ItemStatus) => void;
  onToggleStar: () => void; onUpdateUrl: (url: string) => void;
  onUpdateDetails: (updates: { name?: string; brand?: string; weightOz?: number; category?: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [editName, setEditName] = useState(packItem.item.name);
  const [editWeight, setEditWeight] = useState(String(packItem.item.weightOz));
  const [editUrl, setEditUrl] = useState(packItem.url || packItem.item.url || "");

  const isWorn = packItem.status === "worn";
  const isConsumable = packItem.status === "consumable";
  const itemUrl = packItem.url || packItem.item.url;

  function handleSaveEdit() {
    const newName = editName.trim();
    const newWeight = parseFloat(editWeight) || packItem.item.weightOz;
    if (newName && (newName !== packItem.item.name || newWeight !== packItem.item.weightOz)) {
      onUpdateDetails({ name: newName, weightOz: newWeight });
    }
    if (editUrl.trim() !== (packItem.url || packItem.item.url || "")) {
      onUpdateUrl(editUrl.trim());
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-primary/40 bg-primary/[0.05] px-3 py-3 space-y-2">
        <div className="flex gap-2">
          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="form-input flex-1 text-sm" placeholder="Name" autoFocus />
          <input type="number" step="0.1" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className="form-input w-20 text-sm" placeholder="oz" />
        </div>
        <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="form-input text-sm" placeholder="Link URL (optional)" />
        <div className="flex gap-2">
          <button onClick={handleSaveEdit} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Save</button>
          <button onClick={() => setEditing(false)} className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-muted-foreground">Cancel</button>
        </div>
      </div>
    );
  }

  const specs = getItemSpecs(packItem.item);
  const hasSpecs = specs.length > 1; // more than just price

  return (
    <div className="space-y-0">
      <div className={cn(
        "group relative flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2 py-2.5 transition-all duration-200 sm:gap-3 sm:px-3",
        "hover:border-primary/30 hover:bg-white/[0.05]",
        isDragging && "opacity-40",
        isDropTarget && "border-primary/60 bg-primary/[0.06]",
        expanded && "rounded-b-none border-b-0"
      )}>
        <span aria-hidden="true" className="hidden cursor-grab text-muted-foreground/40 transition-colors group-hover:text-muted-foreground active:cursor-grabbing sm:block">
          <GripVertical className="size-4" />
        </span>

        <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />

        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => hasSpecs && setExpanded(!expanded)}>
          <div className="flex items-center gap-2">
            <p className="text-pretty text-base font-medium leading-tight">{packItem.item.name}</p>
            {isWorn && <span className="shrink-0 rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-primary">Worn</span>}
            {isConsumable && <span className="shrink-0 rounded border border-blue-400/30 bg-blue-400/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-blue-400">Consumable</span>}
            {packItem.starred && <Star className="size-3 shrink-0 fill-yellow-400 text-yellow-400" />}
            {itemUrl && (
              <a href={itemUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          {packItem.item.brand && <p className="truncate text-xs uppercase tracking-wider text-muted-foreground">{packItem.item.brand}</p>}
        </div>

        {/* Quantity */}
        <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:focus-within:opacity-100 sm:group-hover:opacity-100">
          <IconBtn label="Decrease" onClick={() => onQty(-1)} icon={<Minus className="size-3.5" />} />
          <span className="num w-4 text-center text-xs text-muted-foreground">{packItem.quantity}</span>
          <IconBtn label="Increase" onClick={() => onQty(1)} icon={<Plus className="size-3.5" />} />
        </div>

        {/* Weight */}
        <div className="shrink-0 text-right">
          <span className="num text-base font-medium">{formatWeightWithUnit(packItem.item.weightOz * packItem.quantity, weightUnit)}</span>
        </div>

        {/* Expand toggle */}
        {hasSpecs && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Collapse specs" : "Expand specs"}
            className="flex size-5 items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <ChevronDown className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")} />
          </button>
        )}

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn label="Edit" onClick={() => { setEditName(packItem.item.name); setEditWeight(String(packItem.item.weightOz)); setEditUrl(packItem.url || packItem.item.url || ""); setEditing(true); }} icon={<Pencil className="size-3.5" />} />
          <IconBtn label="Star" onClick={onToggleStar} active={packItem.starred} icon={<Star className={cn("size-3.5", packItem.starred && "fill-current")} />} />
          <IconBtn label="Worn" onClick={() => onStatusChange(isWorn ? "packed" : "worn")} active={isWorn} icon={<Shirt className="size-3.5" />} />
          <IconBtn label="Consumable" onClick={() => onStatusChange(isConsumable ? "packed" : "consumable")} active={isConsumable} activeColor="text-blue-400" icon={<Droplets className="size-3.5" />} />
          <IconBtn label="Remove" onClick={onRemove} danger icon={<Trash2 className="size-3.5" />} />
        </div>
      </div>

      {/* Expanded specs panel */}
      {expanded && hasSpecs && (
        <div className="rounded-b-lg border border-t-0 border-white/[0.07] bg-white/[0.01] px-4 py-3 animate-in slide-in-from-top-1 duration-200">
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {specs.map((spec) => (
              <div key={spec.label} className="flex items-baseline gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{spec.label}</span>
                <span className="num text-xs font-medium text-foreground">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, icon, active, activeColor, danger }: { label: string; onClick: () => void; icon: React.ReactNode; active?: boolean; activeColor?: string; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cn(
      "flex size-7 items-center justify-center rounded-md transition-colors active:scale-95",
      active ? `bg-primary/15 ${activeColor || "text-primary"}` : danger ? "text-muted-foreground hover:bg-destructive/15 hover:text-destructive" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
    )}>
      {icon}
    </button>
  );
}
