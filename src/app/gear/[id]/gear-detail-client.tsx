"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { ArrowLeft, ExternalLink, PackagePlus, GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePackStore } from "@/store/pack-store";
import type { GearDetailData, SimilarItem } from "./page";
import type { GearItem, GearCategory } from "@/data/gear-database";

// === TIER STYLING ===

const TIER_COLORS: Record<string, string> = {
  "ultra-budget": "text-cyan-400",
  budget: "text-green-400",
  mid: "text-yellow-400",
  premium: "text-purple-400",
};

const TIER_BG: Record<string, string> = {
  "ultra-budget": "bg-cyan-400/10 border-cyan-400/30 text-cyan-400",
  budget: "bg-green-400/10 border-green-400/30 text-green-400",
  mid: "bg-yellow-400/10 border-yellow-400/30 text-yellow-400",
  premium: "bg-purple-400/10 border-purple-400/30 text-purple-400",
};

// === SPECS BUILDER ===

interface Spec {
  label: string;
  value: string;
}

function buildSpecs(item: GearDetailData): Spec[] {
  const specs: Spec[] = [];

  // Sleep
  if (item.temp_rating != null) specs.push({ label: "Temp Rating", value: `${item.temp_rating}°F` });
  if (item.r_value != null) specs.push({ label: "R-Value", value: `${item.r_value}` });
  if (item.fill_power != null) specs.push({ label: "Fill Power", value: `${item.fill_power} FP` });
  if (item.fill_type) specs.push({ label: "Fill Type", value: item.fill_type });
  if (item.fill_weight != null) specs.push({ label: "Fill Weight", value: `${item.fill_weight} oz` });
  if (item.sleep_style) specs.push({ label: "Style", value: item.sleep_style });
  if (item.thickness != null) specs.push({ label: "Thickness", value: `${item.thickness}"` });
  if (item.pad_width != null) specs.push({ label: "Width", value: `${item.pad_width}"` });
  if (item.pad_length != null) specs.push({ label: "Length", value: `${item.pad_length}"` });

  // Shelter
  if (item.capacity != null) specs.push({ label: "Capacity", value: `${item.capacity}-person` });
  if (item.seasons) specs.push({ label: "Seasons", value: item.seasons });
  if (item.shelter_type) specs.push({ label: "Type", value: item.shelter_type.replace(/-/g, " ") });
  if (item.setup_type) specs.push({ label: "Setup", value: item.setup_type.replace(/-/g, " ") });
  if (item.floor_area != null) specs.push({ label: "Floor Area", value: `${item.floor_area} sq ft` });
  if (item.peak_height != null) specs.push({ label: "Peak Height", value: `${item.peak_height}"` });
  if (item.fabric) specs.push({ label: "Fabric", value: item.fabric });
  if (item.fabric_denier != null) specs.push({ label: "Denier", value: `${item.fabric_denier}D` });
  if (item.doors != null) specs.push({ label: "Doors", value: `${item.doors}` });
  if (item.vestibule_area != null) specs.push({ label: "Vestibule", value: `${item.vestibule_area} sq ft` });
  if (item.stakes_needed != null) specs.push({ label: "Stakes Needed", value: `${item.stakes_needed}` });
  if (item.packed_size) specs.push({ label: "Packed Size", value: item.packed_size });

  // Pack
  if (item.volume != null) specs.push({ label: "Volume", value: `${item.volume}L` });
  if (item.frame_type) specs.push({ label: "Frame", value: item.frame_type });
  if (item.hip_belt) specs.push({ label: "Hip Belt", value: item.hip_belt });
  if (item.max_carry_weight != null) specs.push({ label: "Max Carry", value: `${item.max_carry_weight} lbs` });

  // Kitchen
  if (item.fuel_type) specs.push({ label: "Fuel", value: item.fuel_type });
  if (item.boil_time != null) specs.push({ label: "Boil Time", value: `${item.boil_time} min` });

  // Electronics
  if (item.lumens != null) specs.push({ label: "Lumens", value: `${item.lumens}` });
  if (item.battery_type) specs.push({ label: "Battery", value: item.battery_type });
  if (item.runtime != null) specs.push({ label: "Runtime", value: `${item.runtime} hrs` });

  // Accessories
  if (item.pole_material) specs.push({ label: "Material", value: item.pole_material });
  if (item.waterproof != null) specs.push({ label: "Waterproof", value: item.waterproof ? "Yes" : "No" });
  if (item.hood_type) specs.push({ label: "Hood", value: item.hood_type });

  return specs;
}

// === MAIN CLIENT COMPONENT ===

export function GearDetailClient({
  item,
  similarItems,
}: {
  item: GearDetailData;
  similarItems: SimilarItem[];
}) {
  const addItem = usePackStore((s) => s.addItem);

  const specs = buildSpecs(item);

  const handleAddToPack = () => {
    const gearItem: GearItem = {
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: item.category as GearCategory,
      subcategory: item.subcategory || undefined,
      tier: item.tier as GearItem["tier"],
      weightOz: item.weight_oz,
      priceUsd: item.price_usd,
      description: item.description || "",
    };
    addItem(gearItem);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Back link */}
        <Link
          href="/explore"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="size-3" /> Back to Gear Explorer
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.brand}</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">{item.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="num text-xl font-semibold text-primary">{item.weight_oz}oz</span>
            <span className="num text-lg text-muted-foreground">${item.price_usd}</span>
            <span
              className={cn(
                "inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border",
                TIER_BG[item.tier] || "bg-white/5 border-white/10 text-muted-foreground"
              )}
            >
              {item.tier}
            </span>
            <span className="text-xs text-muted-foreground">
              {item.category}{item.subcategory ? ` / ${item.subcategory}` : ""}
            </span>
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">{item.description}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleAddToPack}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <PackagePlus className="size-3.5" />
              Add to Pack
            </button>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/[0.03] px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="size-3.5" />
                Buy
              </a>
            )}
          </div>
        </div>

        {/* Specs grid */}
        {specs.length > 0 && (
          <div className="glass rounded-xl border border-white/10 p-5 mb-8">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {specs.map((spec) => (
                <div key={spec.label}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{spec.label}</p>
                  <p className="num text-sm font-medium mt-0.5">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* YouTube Reviews */}
        {item.youtube_video_ids && item.youtube_video_ids.length > 0 && (
          <YouTubeSection videoIds={item.youtube_video_ids} itemName={`${item.brand} ${item.name}`} />
        )}

        {/* No videos state */}
        {(!item.youtube_video_ids || item.youtube_video_ids.length === 0) && (
          <div className="glass rounded-xl border border-white/10 p-5 mb-8 text-center">
            <p className="text-sm text-muted-foreground">No video reviews available yet for this item.</p>
          </div>
        )}

        {/* Compare with Similar — SEO internal linking */}
        {similarItems.length > 0 && (
          <div className="glass rounded-xl border border-white/10 p-5">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Compare with Similar {item.subcategory || item.category} Gear
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {similarItems.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/gear/${similar.id}`}
                  className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{similar.brand}</p>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {similar.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="num text-xs font-semibold text-primary">{similar.weight_oz}oz</p>
                    <p className="num text-[10px] text-muted-foreground">${similar.price_usd}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Compare CTA */}
            <div className="mt-4 pt-4 border-t border-white/[0.07] text-center">
              <Link
                href={`/explore?category=${item.category}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <GitCompareArrows className="size-3.5" />
                Explore similar gear
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * YouTubeSection — renders only embeddable videos.
 * Uses YouTube's oEmbed endpoint to check if a video allows embedding.
 * Videos that are blocked, private, or unavailable are silently hidden.
 * If no videos are embeddable, the entire section is hidden.
 */
function YouTubeSection({ videoIds, itemName }: { videoIds: string[]; itemName: string }) {
  const [validIds, setValidIds] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkEmbeddability() {
      const results = await Promise.all(
        videoIds.map(async (id) => {
          try {
            // YouTube oEmbed returns 401/403/404 for non-embeddable or unavailable videos
            const res = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
              { mode: "cors" }
            );
            return res.ok ? id : null;
          } catch {
            return null;
          }
        })
      );

      if (!cancelled) {
        setValidIds(results.filter((id): id is string => id !== null));
        setChecked(true);
      }
    }

    checkEmbeddability();
    return () => { cancelled = true; };
  }, [videoIds]);

  // Don't show anything while checking or if no valid videos
  if (!checked || validIds.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-8">
      <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
        Video Reviews ({validIds.length})
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {validIds.map((videoId) => (
          <div key={videoId} className="aspect-video rounded-lg overflow-hidden border border-border">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={`${itemName} review`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
