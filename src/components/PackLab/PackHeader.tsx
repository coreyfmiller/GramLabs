"use client";

import Link from "next/link";
import { useState } from "react";
import { Share2, Plus, Trash2, ChevronDown, Check, Scale } from "lucide-react";
import { usePackStore, formatWeight } from "@/store/pack-store";

export default function PackHeader() {
  const {
    packName,
    setPackName,
    getBaseWeight,
    getTotalWeight,
    getWornWeight,
    items,
    loadouts,
    activeLoadoutId,
    createLoadout,
    deleteLoadout,
    switchLoadout,
    weightUnit,
    setWeightUnit,
  } = usePackStore();

  const [showLoadoutMenu, setShowLoadoutMenu] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const baseWeightOz = getBaseWeight();
  const totalWeightOz = getTotalWeight();
  const wornWeightOz = getWornWeight();

  const baseWeightClass =
    baseWeightOz / 16 < 10
      ? "text-lime-400"
      : baseWeightOz / 16 < 15
      ? "text-yellow-400"
      : "text-red-400";

  const handleShare = () => {
    const shareData = {
      name: packName,
      items: items.map((i) => ({
        gearId: i.gearId,
        item: i.item,
        status: i.status,
        quantity: i.quantity,
      })),
    };
    const encoded = btoa(JSON.stringify(shareData));
    const url = `${window.location.origin}/pack-lab?p=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareMessage("Copied!");
      setTimeout(() => setShareMessage(""), 2000);
    });
  };

  const handleNewLoadout = () => {
    const name = prompt("New loadout name:");
    if (name && name.trim()) {
      createLoadout(name.trim());
    }
    setShowLoadoutMenu(false);
  };

  const handleDeleteLoadout = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadouts.length <= 1) return;
    if (confirm("Delete this loadout?")) {
      deleteLoadout(id);
    }
  };

  return (
    <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Left: Logo + nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-[16px] md:text-[18px] font-bold tracking-[0.2em] text-white hover:text-white/80 transition-colors"
          >
            HIKEMIND
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

        {/* Right: Unit toggle + Weight stats + Share */}
        <div className="flex items-center gap-4">
          {/* Unit Toggle */}
          <button
            onClick={() => setWeightUnit(weightUnit === "oz" ? "g" : "oz")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:border-white/20 transition-colors"
            title="Toggle weight unit"
          >
            <Scale className="w-3.5 h-3.5 text-white/50" />
            <span className="text-[10px] font-bold tracking-wider text-white/70 uppercase">
              {weightUnit === "oz" ? "oz" : "g"}
            </span>
          </button>

          <div className="hidden md:flex items-center gap-4 text-[11px] tracking-wide font-[family-name:var(--font-jetbrains-mono)]">
            <div className="flex flex-col items-end">
              <span className="text-white/40 uppercase">Base</span>
              <span className={baseWeightClass}>
                {formatWeight(baseWeightOz, weightUnit)}
              </span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-white/40 uppercase">Total</span>
              <span className="text-white">
                {formatWeight(totalWeightOz, weightUnit)}
              </span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-white/40 uppercase">Worn</span>
              <span className="text-white/70">
                {formatWeight(wornWeightOz, weightUnit)}
              </span>
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:border-lime-400/30 hover:text-lime-400 transition-colors text-white/60"
          >
            {shareMessage ? (
              <>
                <Check className="w-3.5 h-3.5 text-lime-400" />
                <span className="text-[11px] text-lime-400">{shareMessage}</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loadout selector + Pack name */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-4 flex items-center gap-4">
        {/* Loadout dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLoadoutMenu(!showLoadoutMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:border-white/20 transition-colors"
          >
            <span className="text-[11px] text-white/60 tracking-wide">
              {loadouts.find((l) => l.id === activeLoadoutId)?.name ?? "My Pack"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-white/40" />
          </button>

          {showLoadoutMenu && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              {loadouts.map((loadout) => (
                <div
                  key={loadout.id}
                  onClick={() => {
                    switchLoadout(loadout.id);
                    setShowLoadoutMenu(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.05] transition-colors ${
                    loadout.id === activeLoadoutId ? "bg-white/[0.05]" : ""
                  }`}
                >
                  <span className="text-[12px] text-white/80 truncate">
                    {loadout.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {loadout.id === activeLoadoutId && (
                      <Check className="w-3 h-3 text-lime-400" />
                    )}
                    {loadouts.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteLoadout(loadout.id, e)}
                        className="p-0.5 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="border-t border-white/10">
                <button
                  onClick={handleNewLoadout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-lime-400 hover:bg-white/[0.05] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Loadout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pack name input */}
        <input
          type="text"
          value={packName}
          onChange={(e) => setPackName(e.target.value)}
          className="bg-transparent text-[24px] md:text-[32px] font-bold text-white border-none outline-none placeholder:text-white/30 flex-1"
          placeholder="Name your pack..."
        />
      </div>
    </header>
  );
}
