"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowLeft, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GearDetail {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  tier: string;
  weight_oz: number;
  price_usd: number;
  description: string;
  youtube_video_ids: string[] | null;
  temp_rating: number | null;
  r_value: number | null;
  fill_power: number | null;
  fill_type: string | null;
  volume: number | null;
  capacity: number | null;
  seasons: string | null;
  shelter_type: string | null;
  lumens: number | null;
  pole_material: string | null;
  waterproof: boolean | null;
  fuel_type: string | null;
}

export default function GearDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<GearDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("gear_items")
        .select("*")
        .eq("id", id)
        .single();
      setItem(data);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-dvh bg-background">
        <Nav />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Item not found.</p>
          <Link href="/brands" className="text-primary text-sm mt-4 inline-block">← Back to Brands</Link>
        </div>
      </div>
    );
  }

  const specs = [
    item.temp_rating != null && { label: "Temp Rating", value: `${item.temp_rating}°F` },
    item.r_value != null && { label: "R-Value", value: `${item.r_value}` },
    item.fill_power != null && { label: "Fill Power", value: `${item.fill_power} FP` },
    item.fill_type && { label: "Fill Type", value: item.fill_type },
    item.volume != null && { label: "Volume", value: `${item.volume}L` },
    item.capacity != null && { label: "Capacity", value: `${item.capacity}-person` },
    item.seasons && { label: "Seasons", value: item.seasons },
    item.shelter_type && { label: "Type", value: item.shelter_type },
    item.lumens != null && { label: "Lumens", value: `${item.lumens}` },
    item.pole_material && { label: "Material", value: item.pole_material },
    item.waterproof != null && { label: "Waterproof", value: item.waterproof ? "Yes" : "No" },
    item.fuel_type && { label: "Fuel", value: item.fuel_type },
  ].filter(Boolean);

  const tierColors: Record<string, string> = {
    "ultra-budget": "text-cyan-400",
    budget: "text-green-400",
    mid: "text-yellow-400",
    premium: "text-purple-400",
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <Link href="/brands" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="size-3" /> Back to Brands
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.brand}</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">{item.name}</h1>
          <div className="flex items-center gap-4 mt-3">
            <span className="num text-xl font-semibold text-primary">{item.weight_oz}oz</span>
            <span className="num text-lg text-muted-foreground">${item.price_usd}</span>
            <span className={cn("text-xs font-semibold uppercase", tierColors[item.tier] || "text-muted-foreground")}>
              {item.tier}
            </span>
            <span className="text-xs text-muted-foreground">{item.category}{item.subcategory ? ` / ${item.subcategory}` : ""}</span>
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{item.description}</p>
          )}
        </div>

        {/* Specs */}
        {specs.length > 0 && (
          <div className="glass rounded-xl border border-white/10 p-5 mb-8">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {specs.map((spec) => spec && (
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
          <div className="glass rounded-xl border border-white/10 p-5">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Video Reviews ({item.youtube_video_ids.length})
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {item.youtube_video_ids.map((videoId) => (
                <div key={videoId} className="aspect-video rounded-lg overflow-hidden border border-white/10">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video review"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No videos */}
        {(!item.youtube_video_ids || item.youtube_video_ids.length === 0) && (
          <div className="glass rounded-xl border border-white/10 p-5 text-center">
            <p className="text-sm text-muted-foreground">No video reviews loaded yet for this item.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Run `npm run fetch-videos` to populate.</p>
          </div>
        )}
      </div>
    </div>
  );
}
