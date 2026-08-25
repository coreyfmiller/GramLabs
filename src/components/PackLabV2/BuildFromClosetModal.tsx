"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { usePackStore, ItemStatus } from "@/store/pack-store";
import { GearItem, GearCategory } from "@/data/gear-database";
import { cn } from "@/lib/utils";

interface BuildFromClosetModalProps {
  open: boolean;
  onClose: () => void;
}

const TRIP_TYPES = [
  { value: "weekend-overnight", label: "Weekend overnight" },
  { value: "multi-day", label: "Multi-day (3-5 nights)" },
  { value: "thru-hike-section", label: "Thru-hike section" },
  { value: "day-hike", label: "Day hike" },
  { value: "fastpacking", label: "Fastpacking" },
  { value: "winter-camping", label: "Winter camping" },
];

const EXPECTED_LOWS = [
  { value: "Above 50°F (warm)", label: "Above 50°F (warm)" },
  { value: "35-50°F (mild)", label: "35-50°F (mild)" },
  { value: "20-35°F (cold)", label: "20-35°F (cold)" },
  { value: "Below 20°F (very cold)", label: "Below 20°F (very cold)" },
];

export function BuildFromClosetModal({ open, onClose }: BuildFromClosetModalProps) {
  const createLoadout = usePackStore((s) => s.createLoadout);
  const addItem = usePackStore((s) => s.addItem);

  const [tripType, setTripType] = useState("weekend-overnight");
  const [expectedLows, setExpectedLows] = useState("35-50°F (mild)");
  const [conditions, setConditions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ notes: string; gaps: string[] } | null>(null);

  if (!open) return null;

  async function handleBuild() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/build-from-closet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripType, expectedLows, conditions: conditions || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      if (!data.items || data.items.length === 0) {
        setError("AI couldn't build a pack from your closet. Try adding more gear.");
        setLoading(false);
        return;
      }

      // Create the loadout and add items
      createLoadout(data.loadoutName || "AI Pack");

      // Small delay to let the store update activeLoadoutId
      setTimeout(() => {
        data.items.forEach((item: { gearId: string; item: { id: string; name: string; brand: string; category: string; subcategory?: string; weightOz: number; priceUsd: number }; status: string; quantity: number }) => {
          const gearItem: GearItem = {
            id: item.gearId,
            name: item.item.name,
            brand: item.item.brand,
            category: item.item.category as GearCategory,
            subcategory: item.item.subcategory,
            tier: "mid",
            weightOz: item.item.weightOz,
            priceUsd: item.item.priceUsd,
            description: "",
          };
          addItem(gearItem, (item.status as ItemStatus) || "packed");
        });
      }, 50);

      setResult({ notes: data.notes, gaps: data.gaps || [] });
    } catch {
      setError("Failed to connect. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setResult(null);
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Build from your closet</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            AI picks the lightest complete kit from your gear
          </p>
        </div>

        {!result ? (
          <div className="space-y-4">
            {/* Trip type */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Trip type
              </label>
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              >
                {TRIP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Expected lows */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Expected overnight lows
              </label>
              <select
                value={expectedLows}
                onChange={(e) => setExpectedLows(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              >
                {EXPECTED_LOWS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Conditions */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Conditions <span className="normal-case tracking-normal text-muted-foreground/60">(optional)</span>
              </label>
              <input
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. exposed ridgeline, 3 days, possible rain"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleBuild}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Building your pack...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Build My Pack
                </>
              )}
            </button>
          </div>
        ) : (
          /* Success state */
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3">
              <p className="text-sm text-foreground font-medium mb-1">Pack created!</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{result.notes}</p>
            </div>

            {result.gaps.length > 0 && (
              <div className="rounded-lg bg-yellow-400/10 border border-yellow-400/20 px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="size-3.5 text-yellow-400" />
                  <p className="text-xs font-medium text-yellow-400">Gaps in your closet</p>
                </div>
                <ul className="space-y-1">
                  {result.gaps.map((gap, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {gap}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
