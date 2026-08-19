"use client";

import { useState } from "react";
import { BarChart3, Layers, Search } from "lucide-react";
import { usePackStore } from "@/store/pack-store";
import { formatWeightWithUnit } from "@/utils/format";
import { Nav } from "@/components/Nav";
import { GearSearch } from "./GearSearch";
import { PackList } from "./PackList";
import { StatsPanel } from "./StatsPanel";
import { cn } from "@/lib/utils";

type Tab = "search" | "pack" | "stats";

export function PackBuilder() {
  const [tab, setTab] = useState<Tab>("pack");

  const getBaseWeight = usePackStore((s) => s.getBaseWeight);
  const getTotalWeight = usePackStore((s) => s.getTotalWeight);
  const getItemCount = usePackStore((s) => s.getItemCount);
  const loadouts = usePackStore((s) => s.loadouts);
  const activeLoadoutId = usePackStore((s) => s.activeLoadoutId);
  const weightUnit = usePackStore((s) => s.weightUnit);

  const baseWeight = getBaseWeight();
  const totalWeight = getTotalWeight();
  const itemCount = (loadouts.find((l) => l.id === activeLoadoutId)?.items ?? []).reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Nav />

      {/* Stats bar */}
      <div className="flex shrink-0 items-center justify-end gap-4 border-b border-white/10 px-4 py-2 md:px-6">
        <div className="hidden items-center gap-4 sm:flex">
          <HeaderStat label="Base" value={formatWeightWithUnit(baseWeight, weightUnit)} accent />
          <span aria-hidden="true" className="h-7 w-px bg-white/10" />
          <HeaderStat label="Skin-out" value={formatWeightWithUnit(totalWeight, weightUnit)} />
        </div>
        <div className="num rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary sm:hidden">
          {formatWeightWithUnit(baseWeight, weightUnit)}
        </div>
      </div>

      {/* Mobile tabs */}
      <nav
        aria-label="Pack builder sections"
        className="flex shrink-0 gap-1 border-b border-white/10 p-2 lg:hidden"
      >
        <TabButton
          active={tab === "search"}
          onClick={() => setTab("search")}
          icon={<Search className="size-3.5" />}
          label="Search"
        />
        <TabButton
          active={tab === "pack"}
          onClick={() => setTab("pack")}
          icon={<Layers className="size-3.5" />}
          label="Pack"
          badge={String(itemCount)}
        />
        <TabButton
          active={tab === "stats"}
          onClick={() => setTab("stats")}
          icon={<BarChart3 className="size-3.5" />}
          label="Stats"
        />
      </nav>

      {/* Three columns */}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_330px] xl:grid-cols-[340px_minmax(0,1fr)_360px]">
        <aside
          className={cn(
            "min-h-0 min-w-0 border-white/10 lg:block lg:border-r",
            tab === "search" ? "block" : "hidden"
          )}
        >
          <GearSearch />
        </aside>

        <main
          className={cn(
            "min-h-0 min-w-0 lg:block",
            tab === "pack" ? "block" : "hidden"
          )}
        >
          <PackList />
        </main>

        <aside
          className={cn(
            "min-h-0 min-w-0 border-white/10 lg:block lg:border-l",
            tab === "stats" ? "block" : "hidden"
          )}
        >
          <StatsPanel />
        </aside>
      </div>
    </div>
  );
}

function HeaderStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="text-right leading-tight">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "num text-sm font-semibold",
          accent ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/12 text-primary"
          : "border-transparent text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
      )}
    >
      {icon}
      {label}
      {badge && (
        <span className="num rounded bg-white/10 px-1 text-[10px] text-muted-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}
