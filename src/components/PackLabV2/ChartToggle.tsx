"use client";

import { useState, useEffect } from "react";
import { Circle, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChartType = "donut" | "two-ring" | "bar";

const STORAGE_KEY = "hikemind-chart-type";

const OPTIONS: { value: ChartType; label: string; icon: typeof Circle }[] = [
  { value: "donut", label: "Donut", icon: Circle },
  { value: "two-ring", label: "Rings", icon: Target },
  { value: "bar", label: "Bar", icon: BarChart3 },
];

export function useChartType(): [ChartType, (t: ChartType) => void] {
  const [chartType, setChartType] = useState<ChartType>("two-ring");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ChartType | null;
    if (saved && OPTIONS.some((o) => o.value === saved)) {
      setChartType(saved);
    }
  }, []);

  function update(type: ChartType) {
    setChartType(type);
    localStorage.setItem(STORAGE_KEY, type);
  }

  return [chartType, update];
}

interface ChartToggleProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
}

export function ChartToggle({ value, onChange }: ChartToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5" role="radiogroup" aria-label="Chart type">
      {OPTIONS.map(({ value: optValue, label, icon: Icon }) => (
        <button
          key={optValue}
          type="button"
          role="radio"
          aria-checked={value === optValue}
          aria-label={label}
          title={label}
          onClick={() => onChange(optValue)}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors",
            value === optValue
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-3" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
