"use client";

import { useState, useMemo } from "react";
import { Nav } from "@/components/Nav";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Flame,
  Wrench,
  Rocket,
  Brain,
  Megaphone,
  Code,
  Package,
  Map,
  BarChart3,
  Link2,
  FileUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodoItem {
  text: string;
  done: boolean;
  indent: number;
}

interface TodoSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  priority: "blocking" | "high" | "medium" | "low" | "future";
  items: TodoItem[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS: TodoSection[] = [
  {
    id: "blocking",
    title: "DO THIS FIRST — Manual Steps (Blocks Everything)",
    icon: <AlertTriangle className="size-5" />,
    priority: "blocking",
    items: [
      { text: "Enable YouTube Data API v3 on Google Cloud", done: false, indent: 0 },
      { text: "Create/reuse API key with YouTube Data API access", done: false, indent: 0 },
      { text: "Add YOUTUBE_API_KEY to .env.local", done: false, indent: 0 },
      { text: "Add youtube_video_ids column to gear_items (text array, nullable)", done: false, indent: 0 },
      { text: "Add GitHub Actions secrets: YOUTUBE_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY", done: false, indent: 0 },
      { text: "Push workflow to GitHub and verify it runs", done: false, indent: 0 },
      { text: "Test script locally: node scripts/fetch-youtube-reviews.mjs --dry-run", done: false, indent: 0 },
    ],
  },
  {
    id: "youtube",
    title: "Step 0 — YouTube API Setup",
    icon: <Rocket className="size-5" />,
    priority: "high",
    items: [
      { text: "Build video search script: scripts/fetch-youtube-reviews.mjs", done: true, indent: 0 },
      { text: "Build GitHub Action for automated daily runs (1st-10th monthly)", done: true, indent: 0 },
      { text: "Complete manual setup steps above", done: false, indent: 0 },
      { text: "Build Gear Compare with embedded fullscreen YouTube reviews", done: false, indent: 0 },
    ],
  },
  {
    id: "gear-db",
    title: "Step 1 — Complete the Gear Database",
    icon: <Package className="size-5" />,
    priority: "high",
    items: [
      { text: "Sleeping pads: R-values filled", done: true, indent: 0 },
      { text: "Shelters: Seasons filled (0 missing)", done: true, indent: 0 },
      { text: "Shelters: Capacity filled (0 missing)", done: true, indent: 0 },
      { text: "Quilts/bags: temp_rating filled (0 missing)", done: true, indent: 0 },
      { text: "Quilts/bags: fill_type + fill_power filled (983/1000)", done: true, indent: 0 },
      { text: "Brand coverage verified (115+ brands)", done: true, indent: 0 },
    ],
  },
  {
    id: "compare",
    title: "Step 2 — Gear Compare (/compare)",
    icon: <BarChart3 className="size-5" />,
    priority: "high",
    items: [
      { text: "Select 2-3 items to compare (from search or Pack Lab)", done: false, indent: 0 },
      { text: "Side-by-side specs table (weight, price, R-value, temp rating)", done: false, indent: 0 },
      { text: "Weight diff, price diff, value-per-oz calculations", done: false, indent: 0 },
      { text: '"Winner" highlighting (lightest, best value, warmest)', done: false, indent: 0 },
      { text: '"Add to Pack" button on any item', done: false, indent: 0 },
      { text: "Shareable comparison URL", done: false, indent: 0 },
      { text: "Embedded YouTube review videos per item (fullscreen)", done: false, indent: 0 },
    ],
  },
  {
    id: "gear-explorer",
    title: "Step 3 — Gear Explorer (/gear)",
    icon: <Package className="size-5" />,
    priority: "high",
    items: [
      { text: "Browsable, filterable grid/table of all 1000+ items", done: false, indent: 0 },
      { text: "Search by name/brand", done: false, indent: 0 },
      { text: "Filter by category, tier, price range, weight range", done: false, indent: 0 },
      { text: "Sort by weight, price, warmth-to-weight, cost-per-oz-saved", done: false, indent: 0 },
      { text: 'Item cards with key specs + "Add to Pack" button', done: false, indent: 0 },
      { text: "Click into item detail with full specs + YouTube reviews", done: false, indent: 0 },
      { text: '"Compare" button (select 2-3 and jump to compare view)', done: false, indent: 0 },
      { text: 'External "Buy" link (when URL exists)', done: false, indent: 0 },
      { text: "SEO: individual item pages or rich metadata", done: false, indent: 0 },
    ],
  },
  {
    id: "links",
    title: "Gear Database — Links & Monitoring",
    icon: <Link2 className="size-5" />,
    priority: "medium",
    items: [
      { text: "URLs on all items (0/1012 currently)", done: false, indent: 0 },
      { text: "Monthly AI link updater script (Serper + validation)", done: false, indent: 0 },
      { text: "Affiliate links (REI, Amazon, brand sites)", done: false, indent: 0 },
      { text: "Admin dashboard: link health (% working, recently broken)", done: false, indent: 0 },
      { text: "Clothing category as browsable items (future)", done: false, indent: 0 },
    ],
  },
  {
    id: "packlab-polish",
    title: "Pack Lab — Polish",
    icon: <Wrench className="size-5" />,
    priority: "medium",
    items: [
      { text: "Priority matrix (quadrant chart: cost vs weight savings)", done: false, indent: 0 },
      { text: "Weight vs community average per category", done: false, indent: 0 },
      { text: "Category filter as horizontal scroll on mobile", done: false, indent: 0 },
      { text: "HikeMind AI Suggestions — contextual swap recommendations (FUTURE/PRO)", done: false, indent: 0 },
    ],
  },
  {
    id: "packlab-import",
    title: "Pack Lab — Import",
    icon: <FileUp className="size-5" />,
    priority: "medium",
    items: [
      { text: "PackWizard import", done: false, indent: 0 },
      { text: "CSV/spreadsheet import (parser exists, needs UI)", done: false, indent: 0 },
    ],
  },
  {
    id: "trip",
    title: "Trip Engine — Enhancements",
    icon: <Map className="size-5" />,
    priority: "medium",
    items: [
      { text: "Calorie/food weight estimation per day", done: false, indent: 0 },
      { text: "Water carry calculator between sources", done: false, indent: 0 },
      { text: "Resupply planning for multi-day trips", done: false, indent: 0 },
      { text: "Daily pack weight curve (consumables decrease)", done: false, indent: 0 },
      { text: 'Risk flags ("12-mile dry stretch in 90°F — carry 4L")', done: false, indent: 0 },
      { text: "Trail database with known waypoints/water sources", done: false, indent: 0 },
    ],
  },
  {
    id: "intel",
    title: "Gear Intel (Future)",
    icon: <Brain className="size-5" />,
    priority: "future",
    items: [
      { text: "Community gear ratings from real trail data", done: false, indent: 0 },
      { text: '"What are people carrying on [trail]?" aggregated data', done: false, indent: 0 },
      { text: "Trending gear (gaining/losing popularity)", done: false, indent: 0 },
      { text: "Browse/search community packs by trail, season, base weight", done: false, indent: 0 },
    ],
  },
  {
    id: "analyzer",
    title: "System Analyzer (AI Layer)",
    icon: <Brain className="size-5" />,
    priority: "future",
    items: [
      { text: "Gap detection (missing wind layer for exposed ridgeline)", done: false, indent: 0 },
      { text: "Redundancy detection (headlamp + lantern overlap)", done: false, indent: 0 },
      { text: "Combined warmth modeling (quilt + pad + clothing + shelter)", done: false, indent: 0 },
      { text: "Weight budget advisor (sub-10lb swap suggestions)", done: false, indent: 0 },
      { text: "Season transition recommendations", done: false, indent: 0 },
      { text: "Safety audit (missing essentials flagged)", done: false, indent: 0 },
    ],
  },
  {
    id: "marketing",
    title: "Homepage / Marketing",
    icon: <Megaphone className="size-5" />,
    priority: "low",
    items: [
      { text: "AI-generated hero videos — improve quality (Kling 3.0)", done: false, indent: 0 },
      { text: "Below-the-fold: feature showcase, testimonials, pricing", done: false, indent: 0 },
      { text: "Mobile nav menu (hamburger does nothing currently)", done: false, indent: 0 },
      { text: "Pricing page (Free / Pro $8/mo / Annual $60/yr)", done: false, indent: 0 },
    ],
  },
  {
    id: "tech-debt",
    title: "Tech Debt",
    icon: <Code className="size-5" />,
    priority: "low",
    items: [
      { text: "Add user auth (Clerk or NextAuth)", done: false, indent: 0 },
      { text: "Move pack data to database (Supabase)", done: false, indent: 0 },
      { text: "Server-side API for share links", done: false, indent: 0 },
      { text: "SEO metadata per page", done: false, indent: 0 },
      { text: "Accessibility audit (keyboard nav, screen reader)", done: false, indent: 0 },
      { text: "Performance: lazy load gear DB, virtualize long lists", done: false, indent: 0 },
      { text: "Gemini health check alerts (secrets + webhook)", done: false, indent: 0 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<TodoSection["priority"], { badge: string; border: string }> = {
  blocking: { badge: "bg-red-500/20 text-red-400 border-red-500/30", border: "border-red-500/20" },
  high: { badge: "bg-primary/20 text-primary border-primary/30", border: "border-primary/20" },
  medium: { badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", border: "border-blue-500/20" },
  low: { badge: "bg-muted text-muted-foreground border-border", border: "border-border" },
  future: { badge: "bg-purple-500/20 text-purple-400 border-purple-500/30", border: "border-purple-500/20" },
};

const PRIORITY_LABELS: Record<TodoSection["priority"], string> = {
  blocking: "BLOCKING",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
  future: "FUTURE",
};

// ─── Components ───────────────────────────────────────────────────────────────

function SectionCard({ section }: { section: TodoSection }) {
  const [expanded, setExpanded] = useState(
    section.priority === "blocking" || section.priority === "high"
  );

  const doneCount = section.items.filter((i) => i.done).length;
  const totalCount = section.items.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const allDone = doneCount === totalCount;

  const styles = PRIORITY_STYLES[section.priority];

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden transition-all",
        styles.border,
        allDone && "opacity-60"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
      >
        <span className="text-muted-foreground">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>

        <span className={cn("shrink-0", allDone ? "text-primary" : "text-muted-foreground")}>
          {section.icon}
        </span>

        <span className={cn("font-medium text-sm flex-1", allDone && "line-through")}>
          {section.title}
        </span>

        <span className={cn("px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded", styles.badge)}>
          {PRIORITY_LABELS[section.priority]}
        </span>

        <span className="text-xs text-muted-foreground tabular-nums ml-2">
          {doneCount}/{totalCount}
        </span>
      </button>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div
          className={cn(
            "h-full transition-all duration-500",
            allDone ? "bg-primary" : "bg-primary/60"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Items */}
      {expanded && (
        <div className="px-4 py-2 space-y-1">
          {section.items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2.5 py-1.5 rounded-md px-2",
                item.done && "opacity-50"
              )}
              style={{ paddingLeft: `${item.indent * 16 + 8}px` }}
            >
              {item.done ? (
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              ) : (
                <Circle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className={cn("text-sm", item.done && "line-through text-muted-foreground")}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTodoPage() {
  const [filter, setFilter] = useState<"all" | "blocking" | "high" | "medium" | "low" | "future">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return SECTIONS;
    return SECTIONS.filter((s) => s.priority === filter);
  }, [filter]);

  const totalItems = SECTIONS.reduce((acc, s) => acc + s.items.length, 0);
  const doneItems = SECTIONS.reduce((acc, s) => acc + s.items.filter((i) => i.done).length, 0);
  const overallProgress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Project Roadmap</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            HikeMind development tracker — {doneItems}/{totalItems} tasks complete ({overallProgress}%)
          </p>

          {/* Overall progress */}
          <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "blocking", "high", "medium", "low", "future"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-lg border transition-colors",
                filter === f
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-white/[0.03] text-muted-foreground border-border hover:bg-white/[0.06] hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {filtered.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </main>
    </div>
  );
}
