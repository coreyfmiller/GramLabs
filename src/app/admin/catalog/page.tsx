"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Check, X, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORY_ORDER } from "@/data/gear-database";
import { cn } from "@/lib/utils";

interface Candidate {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  tier: string;
  weight_oz: number;
  price_usd: number;
  description: string;
  source_url: string | null;
  url: string | null;
  duplicate_of: string | null;
  match_notes: string | null;
  status: string;
  created_at: string;
  // Specs (show relevant ones per category)
  shelter_type: string | null;
  capacity: number | null;
  seasons: string | null;
  temp_rating: number | null;
  fill_type: string | null;
  fill_power: number | null;
  r_value: number | null;
  volume: number | null;
  fuel_type: string | null;
  lumens: number | null;
  fabric: string | null;
}

interface DuplicateItem {
  id: string;
  name: string;
  brand: string;
  weight_oz: number;
  price_usd: number;
  category: string;
}

type StatusFilter = "pending" | "approved" | "rejected";

const PAGE_SIZE = 12;

export default function CatalogPage() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [duplicateItems, setDuplicateItems] = useState<Record<string, DuplicateItem>>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status: statusFilter,
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (brandFilter.trim()) params.set("brand", brandFilter.trim());
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    const res = await fetch(`/api/admin/catalog?${params}`);
    const data = await res.json();

    if (res.ok) {
      setCandidates(data.candidates || []);
      setDuplicateItems(data.duplicateItems || {});
      setTotal(data.total || 0);
    }
    setLoading(false);
  }, [statusFilter, categoryFilter, brandFilter, searchQuery, page]);

  useEffect(() => {
    if (user?.email === "coreyfmiller@gmail.com") fetchCandidates();
  }, [user, fetchCandidates]);

  useEffect(() => { setPage(0); }, [statusFilter, categoryFilter, brandFilter, searchQuery]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (res.ok || data.duplicate) {
        // Remove from list
        setCandidates((prev) => prev.filter((c) => c.id !== id));
        setTotal((t) => t - 1);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
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
          <h1 className="text-2xl font-bold tracking-tight">Catalog Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review gear candidates before they go into the live database.
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
              placeholder="Search candidates..."
              className="w-full rounded-lg border border-border bg-input pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
            />
          </div>
          <input
            type="text"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            placeholder="Filter by brand..."
            className="rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors w-40"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground"
          >
            <option value="all">All categories</option>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Stats + pagination */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-muted-foreground">
            {total} candidates · Page {page + 1} of {totalPages || 1}
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

        {/* Candidates list */}
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-16">Loading...</div>
        ) : candidates.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-16">
            No {statusFilter} candidates{categoryFilter !== "all" ? ` in ${categoryFilter}` : ""}.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {candidates.map((c) => {
              const dupe = c.duplicate_of ? duplicateItems[c.duplicate_of] : null;
              const isActioning = actionLoading === c.id;

              return (
                <div key={c.id} className="rounded-xl border border-border bg-card p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.category}</span>
                        {c.subcategory && (
                          <span className="text-[10px] text-muted-foreground">/ {c.subcategory}</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c.tier}</span>
                      </div>
                      <p className="text-sm font-semibold">{c.brand} {c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="num">{c.weight_oz}oz</span> · <span className="num">${c.price_usd}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Source URL */}
                      {c.source_url && (
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-xs text-primary hover:bg-primary/10 transition-colors"
                        >
                          <ExternalLink className="size-3" />
                          Source
                        </a>
                      )}

                      {/* Actions (only for pending) */}
                      {c.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAction(c.id, "approve")}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 transition-all disabled:opacity-50"
                          >
                            {isActioning ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(c.id, "reject")}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                          >
                            <X className="size-3" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {c.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{c.description}</p>
                  )}

                  {/* Specs row */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {c.shelter_type && <SpecBadge label="Type" value={c.shelter_type} />}
                    {c.capacity && <SpecBadge label="Capacity" value={`${c.capacity}p`} />}
                    {c.seasons && <SpecBadge label="Seasons" value={c.seasons} />}
                    {c.temp_rating != null && <SpecBadge label="Temp" value={`${c.temp_rating}°F`} />}
                    {c.fill_type && <SpecBadge label="Fill" value={c.fill_type} />}
                    {c.fill_power && <SpecBadge label="Fill power" value={`${c.fill_power}`} />}
                    {c.r_value && <SpecBadge label="R-value" value={`${c.r_value}`} />}
                    {c.volume && <SpecBadge label="Volume" value={`${c.volume}L`} />}
                    {c.fuel_type && <SpecBadge label="Fuel" value={c.fuel_type} />}
                    {c.lumens && <SpecBadge label="Lumens" value={`${c.lumens}`} />}
                    {c.fabric && <SpecBadge label="Fabric" value={c.fabric} />}
                  </div>

                  {/* Duplicate warning */}
                  {dupe && (
                    <div className="mt-3 rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="size-3.5 text-yellow-400" />
                        <p className="text-xs font-medium text-yellow-400">Possible duplicate</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Existing: <span className="font-medium text-foreground">{dupe.brand} {dupe.name}</span> — {dupe.weight_oz}oz · ${dupe.price_usd} · {dupe.category}
                      </p>
                      {c.match_notes && (
                        <p className="text-[10px] text-muted-foreground mt-1">{c.match_notes}</p>
                      )}
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

function SpecBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px]">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}
