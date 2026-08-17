"use client";

import { useEffect, useRef, useState } from "react";
import { GearCategory, CATEGORY_LABELS, CATEGORY_COLORS } from "@/data/gear-database";

const SIZE = 180;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
const GAP = 2; // degrees of visual separation between arcs

/** Animates a number toward `target` with an ease-out curve. */
function useAnimatedNumber(target: number, duration = 700) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      setValue(next);
      fromRef.current = next;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

export interface CategoryBreakdown {
  category: GearCategory;
  weightOz: number;
  percentage: number;
}

type Props = {
  breakdown: CategoryBreakdown[];
  baseWeight: number;
};

export function WeightDonut({ breakdown, baseWeight }: Props) {
  const [active, setActive] = useState<GearCategory | null>(null);
  const progress = useAnimatedNumber(1, 900);
  const animatedLb = useAnimatedNumber(baseWeight / 16, 700);

  const segments = breakdown.filter((b) => b.percentage > 0);
  const activeSeg = segments.find((s) => s.category === active);

  let offsetDeg = -90;
  const arcs = segments.map((seg) => {
    const share = seg.percentage / 100;
    const sweep = share * 360;
    const arc = {
      ...seg,
      share,
      rotation: offsetDeg,
      length: Math.max((sweep - GAP) / 360, 0) * CIRC,
      color: CATEGORY_COLORS[seg.category],
      label: CATEGORY_LABELS[seg.category],
    };
    offsetDeg += sweep;
    return arc;
  });

  const centerLabel = activeSeg
    ? `${(activeSeg.weightOz / 16).toFixed(2)}`
    : animatedLb.toFixed(2);
  const centerSub = activeSeg
    ? CATEGORY_LABELS[activeSeg.category]
    : "lb base weight";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`Base weight distribution: ${segments
            .map(
              (s) =>
                `${CATEGORY_LABELS[s.category]} ${s.percentage.toFixed(0)}%`
            )
            .join(", ")}`}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-white/[0.05]"
          />
          {arcs.map((arc) => {
            const isDim = active !== null && active !== arc.category;
            return (
              <circle
                key={arc.category}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={active === arc.category ? STROKE + 4 : STROKE}
                strokeLinecap="round"
                strokeDasharray={`${arc.length * progress} ${CIRC}`}
                transform={`rotate(${arc.rotation} ${SIZE / 2} ${SIZE / 2})`}
                opacity={isDim ? 0.25 : 1}
                style={{
                  transition: "opacity 200ms ease, stroke-width 200ms ease",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setActive(arc.category)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-[28px] font-semibold leading-none tracking-tight text-foreground">
            {centerLabel}
          </span>
          <span className="mt-1.5 max-w-[100px] text-center text-[10px] uppercase leading-tight tracking-[0.14em] text-muted-foreground">
            {centerSub}
          </span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-1">
        {segments.map((seg) => (
          <li key={seg.category}>
            <button
              type="button"
              onMouseEnter={() => setActive(seg.category)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(seg.category)}
              onBlur={() => setActive(null)}
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-white/[0.05]"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[seg.category] }}
              />
              <span className="flex-1 truncate text-[12px] text-muted-foreground">
                {CATEGORY_LABELS[seg.category]}
              </span>
              <span className="num text-[12px] font-medium">
                {seg.weightOz.toFixed(1)}
              </span>
              <span className="num w-9 text-right text-[11px] text-muted-foreground">
                {seg.percentage.toFixed(0)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
