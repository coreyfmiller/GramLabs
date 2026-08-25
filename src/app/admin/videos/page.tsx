"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Check, X, ExternalLink, Play, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BRAND_WEBSITES } from "@/data/brand-websites";
import { CATEGORY_ORDER } from "@/data/gear-database";
import { cn } from "@/lib/utils";

interface GearItemRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  weight_oz: number;
  price_usd: number;
  url: string | null;
  youtube_video_ids: string[] | null;
}

interface VideoResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

type FilterMode = "all" | "no-videos" | "no-url" | "has-videos";

const PAGE_SIZE = 12;

export default function EnrichmentDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<GearItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<FilterMode>("no-videos");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Per-item state
  const [searchingItem, setSearchingItem] = useState<string | null>(null);
  const [videoResults, setVideoResults] = useState<Record<string, VideoResult[]>>({});
  const [approvedVideos, setApprovedVideos] = useState<Record<string, Set<string>>>({});
  const [rejectedVideos, setRejectedVideos] = useState<Record<string, Set<string>>>({});
  const [savingVideo, setSavingVideo] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("gear_items")
      .select("id, name, brand, category, weight_oz, price_usd, url, youtube_video_ids", { count: "exact" });

    if (filterCategory !== "all") {
      query = query.eq("category", filterCategory);
    }

    if (filterMode === "no-videos") {
      query = query.or("youtube_video_ids.is.null,youtube_video_ids.eq.{}");
    } else if (filterMode === "no-url") {
      query = query.is("url", null);
    } else if (filterMode === "has-videos") {
      query = query.not("youtube_video_ids", "is", null);
    }

    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery.trim()}%,brand.ilike.%${searchQuery.trim()}%`);
    }

    query = query
      .order("brand", { ascending: true })
      .order("name", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await query;
    setItems(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [filterCategory, filterMode, searchQuery, page]);

  useEffect(() => {
    if (user?.email === "coreyfmiller@gmail.com") fetchItems();
  }, [user, fetchItems]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [filterCategory, filterMode, searchQuery]);

  async function handleSearchYouTube(item: GearItemRow) {
    setSearchingItem(item.id);
    try {
      const res = await fetch(`/api/admin/enrich?brand=${encodeURIComponent(item.brand)}&name=${encodeURIComponent(item.name)}`);
      const data = await res.json();
      if (data.videos) {
        setVideoResults((prev) => ({ ...prev, [item.id]: data.videos }));
      }
    } catch {
      // ignore
    } finally {
      setSearchingItem(null);
    }
  }

  async function handleApprove(itemId: string, video: VideoResult) {
    setSavingVideo(`${itemId}-${video.videoId}`);
    try {
      const res = await fetch("/api/admin/enrich/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gearItemId: itemId,
          action: "approve_video",
          videoId: video.videoId,
          videoTitle: video.title,
          channelName: video.channel,
        }),
      });
      if (res.ok) {
        setApprovedVideos((prev) => {
          const set = new Set(prev[itemId] || []);
          set.add(video.videoId);
          return { ...prev, [itemId]: set };
        });
      }
    } catch {
      // ignore
    } finally {
      setSavingVideo(null);
    }
  }

  async function handleReject(itemId: string, video: VideoResult) {
    setSavingVideo(`${itemId}-${video.videoId}`);
    try {
      await fetch("/api/admin/enrich/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gearItemId: itemId,
          action: "reject_video",
          videoId: video.videoId,
        }),
      });
      setRejectedVideos((prev) => {
        const set = new Set(prev[itemId] || []);
        set.add(video.videoId);
        return { ...prev, [itemId]: set };
      });
    } catch {
      // ignore
    } finally {
      setSavingVideo(null);
    }
  }

  if (!user || user.email !== "coreyfmiller@gmail.com") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Admin only.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Gear Enrichment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find manufacturer links and approve YouTube reviews for each item.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand or product..."
              className="w-full rounded-lg border border-border bg-input pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
            />
          </div>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            className="rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground"
          >
            <option value="no-videos">Missing videos</option>
            <option value="no-url">Missing URL</option>
            <option value="has-videos">Has videos</option>
            <option value="all">All items</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground"
          >
            <option value="all">All categories</option>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-muted-foreground">
            {total} items · Page {page + 1} of {totalPages || 1}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="size-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="size-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Items */}
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-16">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-16">No items match your filters.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const brandUrl = BRAND_WEBSITES[item.brand];
              const videos = videoResults[item.id] || [];
              const approved = approvedVideos[item.id] || new Set<string>();
              const rejected = rejectedVideos[item.id] || new Set<string>();
              const hasExistingVideos = item.youtube_video_ids && item.youtube_video_ids.length > 0;

              return (
                <div key={item.id} className="rounded-xl border border-border bg-card p-5">
                  {/* Item header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.category}</span>
                        {hasExistingVideos && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {item.youtube_video_ids!.length} video{item.youtube_video_ids!.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {item.url && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-400/10 text-green-400 font-medium">
                            has URL
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold">{item.brand} {item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.weight_oz}oz · ${item.price_usd}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Product page link (manufacturer URL stored on item) */}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-xs text-primary hover:bg-primary/10 transition-colors"
                          title="Manufacturer product page"
                        >
                          <ExternalLink className="size-3" />
                          Product page
                        </a>
                      )}

                      {/* Manufacturer link */}
                      {brandUrl && (
                        <a
                          href={`${brandUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                          title={`Visit ${item.brand} website`}
                        >
                          <ExternalLink className="size-3" />
                          Brand site
                        </a>
                      )}

                      {/* Gear page link */}
                      <a
                        href={`/gear/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                      >
                        <ExternalLink className="size-3" />
                        Gear page
                      </a>

                      {/* Search YouTube button */}
                      <button
                        onClick={() => handleSearchYouTube(item)}
                        disabled={searchingItem === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        {searchingItem === item.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Play className="size-3" />
                        )}
                        Find videos
                      </button>
                    </div>
                  </div>

                  {/* Existing assigned videos — shown so admin can audit */}
                  {hasExistingVideos && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                        Currently assigned videos
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.youtube_video_ids!.map((videoId) => (
                          <div key={videoId} className="rounded-lg border border-border overflow-hidden">
                            <div className="aspect-video">
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={`${item.brand} ${item.name}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                className="w-full h-full"
                                loading="lazy"
                              />
                            </div>
                            <div className="px-2 py-1.5 flex items-center justify-between">
                              <a
                                href={`https://www.youtube.com/watch?v=${videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                {videoId}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video results */}
                  {videos.length > 0 && (
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
                        YouTube results for &ldquo;{item.brand} {item.name} review&rdquo;
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {videos.map((video) => {
                          const isApproved = approved.has(video.videoId);
                          const isRejected = rejected.has(video.videoId);
                          const isSaving = savingVideo === `${item.id}-${video.videoId}`;

                          return (
                            <div
                              key={video.videoId}
                              className={cn(
                                "flex gap-3 rounded-lg border p-3 transition-colors",
                                isApproved ? "border-primary/40 bg-primary/5" :
                                isRejected ? "border-destructive/30 bg-destructive/5 opacity-50" :
                                "border-border"
                              )}
                            >
                              {/* Thumbnail */}
                              <a
                                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0"
                              >
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="w-32 h-20 object-cover rounded border border-border"
                                />
                              </a>

                              {/* Info + actions */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <p className="text-xs font-medium leading-tight line-clamp-2">{video.title}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{video.channel}</p>
                                </div>

                                {!isApproved && !isRejected && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      onClick={() => handleApprove(item.id, video)}
                                      disabled={isSaving}
                                      className="flex items-center gap-1 px-2 py-1 rounded border border-primary/30 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                                    >
                                      <Check className="size-3" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReject(item.id, video)}
                                      disabled={isSaving}
                                      className="flex items-center gap-1 px-2 py-1 rounded border border-destructive/30 text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                    >
                                      <X className="size-3" />
                                      Wrong item
                                    </button>
                                  </div>
                                )}

                                {isApproved && (
                                  <p className="text-[10px] text-primary font-medium mt-2">✓ Approved — live on gear page</p>
                                )}
                                {isRejected && (
                                  <p className="text-[10px] text-destructive font-medium mt-2">✗ Rejected</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
