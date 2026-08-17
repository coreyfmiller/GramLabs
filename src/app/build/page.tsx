"use client";

import { useState } from "react";
import { Mountain, Loader2, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type TripType = "3-season" | "winter" | "thru-hike" | "weekend";
type Climate = "desert" | "temperate" | "alpine" | "pnw-rain";
type SleepStyle = "tent" | "tarp" | "hammock";
type Priority = "lightest" | "value" | "comfort";

interface BuildInputs {
  budget: number;
  tripType: TripType;
  climate: Climate;
  sleepStyle: SleepStyle;
  priority: Priority;
}

interface GeneratedKit {
  summary: string;
  totalWeight: string;
  totalCost: string;
  baseWeight: string;
  items: { category: string; brand: string; name: string; weight: string; price: string; reason: string }[];
}

export default function BuildPage() {
  const [inputs, setInputs] = useState<BuildInputs>({
    budget: 1000,
    tripType: "3-season",
    climate: "temperate",
    sleepStyle: "tent",
    priority: "value",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedKit | null>(null);
  const [error, setError] = useState("");

  const handleBuild = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/build-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.kit);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Mountain className="size-5" />
            </span>
            <span className="text-base font-semibold tracking-tight">HikeMind</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pack-lab" className="text-xs font-medium tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">PACK LAB</Link>
            <Link href="/build" className="text-xs font-bold tracking-[0.15em] text-primary">BUILD MY KIT</Link>
            <Link href="/chat" className="text-xs font-medium tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">GEAR ADVISOR</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
        {!result ? (
          <>
            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Build My Kit</h1>
              <p className="text-base text-muted-foreground max-w-lg mx-auto">
                Tell us your budget and trip style. We&apos;ll build you an optimized pack from 250+ verified gear items.
              </p>
            </div>

            {/* Form */}
            <div className="grid gap-6 max-w-2xl mx-auto">
              {/* Budget */}
              <div className="glass rounded-xl border border-white/10 p-5">
                <label className="block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground mb-3">
                  Total Budget
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                  {[300, 500, 750, 1000, 1500, 2000].map((b) => (
                    <button
                      key={b}
                      onClick={() => setInputs({ ...inputs, budget: b })}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                        inputs.budget === b
                          ? "border-primary/50 bg-primary/15 text-primary"
                          : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
                      )}
                    >
                      ${b.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={150}
                  max={5000}
                  step={25}
                  value={inputs.budget}
                  onChange={(e) => setInputs({ ...inputs, budget: parseInt(e.target.value) })}
                  className="w-full accent-primary"
                />
                <p className="num text-center text-lg font-semibold text-primary mt-2">${inputs.budget.toLocaleString()}</p>
              </div>

              {/* Trip Type */}
              <div className="glass rounded-xl border border-white/10 p-5">
                <label className="block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground mb-3">
                  Trip Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {([
                    { value: "3-season", label: "3-Season", desc: "Spring–Fall" },
                    { value: "winter", label: "Winter", desc: "Snow & cold" },
                    { value: "thru-hike", label: "Thru-Hike", desc: "Long trail" },
                    { value: "weekend", label: "Weekend", desc: "1–3 nights" },
                  ] as const).map((opt) => (
                    <OptionButton
                      key={opt.value}
                      active={inputs.tripType === opt.value}
                      onClick={() => setInputs({ ...inputs, tripType: opt.value })}
                      label={opt.label}
                      desc={opt.desc}
                    />
                  ))}
                </div>
              </div>

              {/* Climate */}
              <div className="glass rounded-xl border border-white/10 p-5">
                <label className="block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground mb-3">
                  Climate / Region
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {([
                    { value: "desert", label: "Desert", desc: "Hot & dry" },
                    { value: "temperate", label: "Temperate", desc: "Mixed weather" },
                    { value: "alpine", label: "Alpine", desc: "High & cold" },
                    { value: "pnw-rain", label: "PNW / Rain", desc: "Wet & cool" },
                  ] as const).map((opt) => (
                    <OptionButton
                      key={opt.value}
                      active={inputs.climate === opt.value}
                      onClick={() => setInputs({ ...inputs, climate: opt.value })}
                      label={opt.label}
                      desc={opt.desc}
                    />
                  ))}
                </div>
              </div>

              {/* Sleep Style */}
              <div className="glass rounded-xl border border-white/10 p-5">
                <label className="block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground mb-3">
                  Sleep System
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "tent", label: "Tent", desc: "Ground + tent" },
                    { value: "tarp", label: "Tarp", desc: "Minimalist" },
                    { value: "hammock", label: "Hammock", desc: "Tree-hung" },
                  ] as const).map((opt) => (
                    <OptionButton
                      key={opt.value}
                      active={inputs.sleepStyle === opt.value}
                      onClick={() => setInputs({ ...inputs, sleepStyle: opt.value })}
                      label={opt.label}
                      desc={opt.desc}
                    />
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="glass rounded-xl border border-white/10 p-5">
                <label className="block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground mb-3">
                  Optimize For
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "lightest", label: "Lightest", desc: "Min weight" },
                    { value: "value", label: "Best Value", desc: "Weight/$ ratio" },
                    { value: "comfort", label: "Comfort", desc: "Livability" },
                  ] as const).map((opt) => (
                    <OptionButton
                      key={opt.value}
                      active={inputs.priority === opt.value}
                      onClick={() => setInputs({ ...inputs, priority: opt.value })}
                      label={opt.label}
                      desc={opt.desc}
                    />
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleBuild}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base tracking-wide transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Building your kit...
                  </>
                ) : (
                  <>
                    <Package className="size-5" />
                    Build My Kit
                  </>
                )}
              </button>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
          </>
        ) : (
          /* Results */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Your Optimized Kit</h2>
              <p className="text-base text-muted-foreground">{result.summary}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-xl border border-white/10 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Base Weight</p>
                <p className="num text-xl font-semibold text-primary mt-1">{result.baseWeight}</p>
              </div>
              <div className="glass rounded-xl border border-white/10 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total Cost</p>
                <p className="num text-xl font-semibold text-foreground mt-1">{result.totalCost}</p>
              </div>
              <div className="glass rounded-xl border border-white/10 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Items</p>
                <p className="num text-xl font-semibold text-foreground mt-1">{result.items.length}</p>
              </div>
            </div>

            {/* Item List */}
            <div className="glass rounded-xl border border-white/10 overflow-hidden">
              <div className="border-b border-white/10 p-4">
                <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Recommended Gear</h3>
              </div>
              <div className="divide-y divide-white/[0.07]">
                {result.items.map((item, i) => (
                  <div key={i} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.category}</p>
                        <p className="text-base font-medium mt-0.5">{item.brand} {item.name}</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">{item.reason}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="num text-sm font-medium text-primary">{item.weight}</p>
                        <p className="num text-xs text-muted-foreground">{item.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/pack-lab"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-primary/90"
              >
                Load into Pack Lab
                <ArrowRight className="size-4" />
              </Link>
              <button
                onClick={() => setResult(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-foreground font-semibold text-sm hover:bg-white/[0.06] transition-colors"
              >
                Build Another Kit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-3 text-left transition-colors",
        active
          ? "border-primary/50 bg-primary/15"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
      )}
    >
      <p className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </button>
  );
}
