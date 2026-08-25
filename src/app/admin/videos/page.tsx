"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface GearWithVideo {
  id: string;
  name: string;
  brand: string;
  category: string;
  weight_oz: number;
  price_usd: number;
  youtube_video_ids: string[];
}

export default function VideoAuditPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<GearWithVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.email !== "coreyfmiller@gmail.com") return;

    async function fetchAll() {
      const supabase = createClient();
      let allItems: GearWithVideo[] = [];
      let offset = 0;
      const PAGE = 1000;

      while (true) {
        const { data } = await supabase
          .from("gear_items")
          .select("id, name, brand, category, weight_oz, price_usd, youtube_video_ids")
          .not("youtube_video_ids", "is", null)
          .range(offset, offset + PAGE - 1);

        if (!data || data.length === 0) break;
        allItems = [...allItems, ...data.filter((d) => d.youtube_video_ids && d.youtube_video_ids.length > 0)];
        if (data.length < PAGE) break;
        offset += PAGE;
      }

      setItems(allItems);
      setLoading(false);
    }

    fetchAll();
  }, [user]);

  if (!user || user.email !== "coreyfmiller@gmail.com") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Admin only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Video Audit</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading..." : `${items.length} items have videos assigned (${items.reduce((s, i) => s + i.youtube_video_ids.length, 0)} total videos)`}
          </p>
        </div>

        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">No items have video IDs assigned.</p>
        )}

        <div className="flex flex-col gap-6">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-5">
              {/* Item info */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.category}</p>
                  <p className="text-sm font-semibold text-foreground">{item.brand} {item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.weight_oz}oz · ${item.price_usd}
                  </p>
                </div>
                <a
                  href={`/gear/${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-primary hover:underline"
                >
                  View page →
                </a>
              </div>

              {/* Videos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.youtube_video_ids.map((videoId) => (
                  <div key={videoId} className="space-y-1.5">
                    <div className="aspect-video rounded-lg overflow-hidden border border-border">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={`${item.brand} ${item.name}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        className="w-full h-full"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        {videoId}
                      </a>
                      <span className="text-[10px] text-muted-foreground">
                        Does this match "{item.brand} {item.name}"?
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
