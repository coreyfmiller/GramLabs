"use client";

import Link from "next/link";
import { usePackStore } from "@/store/pack-store";

export default function PackHeader() {
  const { packName, setPackName, getBaseWeight, getTotalWeight, getWornWeight } =
    usePackStore();

  const baseWeightOz = getBaseWeight();
  const totalWeightOz = getTotalWeight();
  const wornWeightOz = getWornWeight();

  const formatWeight = (oz: number) => {
    if (oz >= 16) {
      return `${(oz / 16).toFixed(2)} lb`;
    }
    return `${oz.toFixed(1)} oz`;
  };

  const baseWeightClass =
    baseWeightOz / 16 < 10
      ? "text-lime-400"
      : baseWeightOz / 16 < 15
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Left: Logo + nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-[16px] md:text-[18px] font-bold tracking-[0.2em] text-white hover:text-white/80 transition-colors"
          >
            GRAMLAB.AI
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/pack-lab"
              className="text-[12px] font-bold tracking-[0.15em] text-lime-400"
            >
              PACK LAB
            </Link>
            <Link
              href="/trip-engine"
              className="text-[12px] font-medium tracking-[0.15em] text-white/60 hover:text-white transition-colors"
            >
              TRIP ENGINE
            </Link>
            <Link
              href="/gear-intel"
              className="text-[12px] font-medium tracking-[0.15em] text-white/60 hover:text-white transition-colors"
            >
              GEAR INTEL
            </Link>
          </nav>
        </div>

        {/* Right: Weight stats */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-[11px] tracking-wide font-[family-name:var(--font-jetbrains-mono)]">
            <div className="flex flex-col items-end">
              <span className="text-white/40 uppercase">Base</span>
              <span className={baseWeightClass}>{formatWeight(baseWeightOz)}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-white/40 uppercase">Total</span>
              <span className="text-white">{formatWeight(totalWeightOz)}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-white/40 uppercase">Worn</span>
              <span className="text-white/70">{formatWeight(wornWeightOz)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pack name (editable) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-4">
        <input
          type="text"
          value={packName}
          onChange={(e) => setPackName(e.target.value)}
          className="bg-transparent text-[24px] md:text-[32px] font-bold text-white border-none outline-none placeholder:text-white/30 w-full"
          placeholder="Name your pack..."
        />
      </div>
    </header>
  );
}
