"use client";

import { useState, useEffect } from "react";
import { Search, ExternalLink, Package, Loader2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface BrandWithCount {
  brand_name: string;
  product_count: number;
}

type SortOption = "products" | "name";

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("products");

  useEffect(() => {
    async function load() {
      // Derive brands + counts from the clean gear_items view (paginate past the 1000-row cap).
      const counts = new Map<string, number>();
      let offset = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("gear_items")
          .select("brand")
          .range(offset, offset + PAGE - 1);
        if (error || !data || data.length === 0) break;
        for (const row of data as { brand: string | null }[]) {
          const name = (row.brand || "").trim();
          if (!name || name.toLowerCase() === "unknown") continue;
          counts.set(name, (counts.get(name) || 0) + 1);
        }
        if (data.length < PAGE) break;
        offset += PAGE;
      }

      const brandsWithCounts: BrandWithCount[] = Array.from(counts.entries())
        .map(([brand_name, product_count]) => ({ brand_name, product_count }));

      setBrands(brandsWithCounts);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = brands
    .filter((b) => b.brand_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "products" ? b.product_count - a.product_count : a.brand_name.localeCompare(b.brand_name));

  const totalProducts = brands.reduce((sum, b) => sum + b.product_count, 0);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Brands</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {brands.length} brands, {totalProducts.toLocaleString()} products in the database
          </p>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands..."
              className="w-full rounded-lg border border-border bg-input pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          >
            <option value="products">Most products</option>
            <option value="name">A–Z</option>
          </select>
        </div>

        {/* Results count */}
        <p className="mb-4 text-xs text-muted-foreground">
          {filtered.length} brand{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">No brands found matching your search.</p>
            <button
              onClick={() => { setSearch(""); }}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Brand grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((brand) => (
              <BrandCard key={brand.brand_name} brand={brand} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BrandCard({ brand }: { brand: BrandWithCount }) {
  return (
    <Link
      href={`/explore?query=${encodeURIComponent(brand.brand_name)}`}
      className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground leading-tight group-hover:text-primary transition-colors">
            {brand.brand_name}
          </p>
        </div>
        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <Package className="size-3.5 text-primary" />
          <span className="num text-sm font-semibold text-foreground">{brand.product_count}</span>
          <span className="text-xs text-muted-foreground">products</span>
        </span>
      </div>
    </Link>
  );
}
