"use client";

import { Zap } from "lucide-react";
import { usePackStore, PackItem } from "@/store/pack-store";
import { gearDatabase } from "@/data/gear-database";

interface Suggestion {
  type: "swap" | "remove" | "warning";
  title: string;
  description: string;
  savingsOz?: number;
}

function generateSuggestions(items: PackItem[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (items.length === 0) return suggestions;

  // Check for heavier items that have lighter alternatives in the database
  items.forEach((packItem) => {
    const alternatives = gearDatabase.filter(
      (g) =>
        g.category === packItem.item.category &&
        g.id !== packItem.item.id &&
        g.weightOz < packItem.item.weightOz &&
        !items.some((i) => i.gearId === g.id)
    );

    if (alternatives.length > 0) {
      const lightest = alternatives.sort((a, b) => a.weightOz - b.weightOz)[0];
      const savings = packItem.item.weightOz - lightest.weightOz;
      if (savings >= 2) {
        suggestions.push({
          type: "swap",
          title: `Swap ${packItem.item.name}`,
          description: `Replace with ${lightest.brand} ${lightest.name} (${lightest.weightOz} oz) — save ${savings.toFixed(1)} oz`,
          savingsOz: savings,
        });
      }
    }
  });

  // Check for missing essentials
  const hasWater = items.some((i) => i.item.category === "water");
  const hasShelter = items.some((i) => i.item.category === "shelter");
  const hasSleep = items.some((i) => i.item.category === "sleep-system");
  const hasSafety = items.some((i) => i.item.category === "safety");

  if (!hasWater && items.length > 3) {
    suggestions.push({
      type: "warning",
      title: "No water treatment",
      description: "You're missing a water filter or treatment system. This is essential for backcountry hiking.",
    });
  }

  if (!hasSafety && items.length > 5) {
    suggestions.push({
      type: "warning",
      title: "No first aid",
      description: "Consider adding a basic first aid kit. Minimum: tape, pain relief, antihistamine.",
    });
  }

  // Sort: warnings first, then by savings
  return suggestions
    .sort((a, b) => {
      if (a.type === "warning" && b.type !== "warning") return -1;
      if (b.type === "warning" && a.type !== "warning") return 1;
      return (b.savingsOz || 0) - (a.savingsOz || 0);
    })
    .slice(0, 5);
}

export default function AiSuggestions() {
  const { items } = usePackStore();
  const suggestions = generateSuggestions(items);

  if (items.length < 3) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-lime-400" />
          <h3 className="text-[13px] font-bold tracking-[0.2em] text-white/60 uppercase">
            AI Suggestions
          </h3>
        </div>
        <p className="text-[13px] text-white/25">
          Add more gear to get intelligent optimization suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-lime-400" />
        <h3 className="text-[13px] font-bold tracking-[0.2em] text-white/60 uppercase">
          AI Suggestions
        </h3>
      </div>

      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border ${
              s.type === "warning"
                ? "border-yellow-400/20 bg-yellow-400/[0.03]"
                : "border-lime-400/20 bg-lime-400/[0.03]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-white">
                {s.title}
              </span>
              {s.savingsOz && (
                <span className="text-[10px] font-[family-name:var(--font-jetbrains-mono)] text-lime-400">
                  −{s.savingsOz.toFixed(1)} oz
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              {s.description}
            </p>
          </div>
        ))}

        {suggestions.length === 0 && (
          <p className="text-[13px] text-lime-400/60 text-center py-2">
            Your pack looks optimized. Nice work.
          </p>
        )}
      </div>
    </div>
  );
}
