"use client";

import { Clock, Zap, ArrowRight } from "lucide-react";

interface LimitReachedProps {
  feature: string;
  limit: number;
  tier?: string;
  className?: string;
}

const featureLabels: Record<string, string> = {
  chat: "AI Advisor messages",
  "build-kit": "Build My Kit generations",
  trip: "Trip Engine analyses",
  "analyze-pack": "Pack Audits",
};

export function LimitReached({ feature, limit, tier, className = "" }: LimitReachedProps) {
  const label = featureLabels[feature] || "requests";
  const isEarlyAdopter = tier === "early-adopter";

  return (
    <div className={`rounded-xl border border-yellow-500/30 bg-yellow-500/[0.06] p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-500/15 shrink-0">
          <Clock className="size-4 text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground">
            Daily limit reached
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            You&apos;ve used all {limit} {label} for today.
            {isEarlyAdopter && (
              <span className="text-yellow-400"> Early adopter bonus already applied.</span>
            )}
          </p>
          <p className="mt-2 text-[12px] text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3" />
            Resets at midnight UTC
          </p>

          {/* Pro upsell — gentle, not aggressive */}
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
            <Zap className="size-3.5 text-primary shrink-0" />
            <p className="text-[12px] text-muted-foreground">
              <span className="text-foreground font-medium">Pro</span> removes all daily limits — $5/month
            </p>
            <ArrowRight className="size-3 text-muted-foreground ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Check if an API error response indicates a rate limit.
 * Returns parsed limit data if yes, null if it's a regular error.
 */
export function parseLimitError(data: Record<string, unknown>): {
  feature: string;
  limit: number;
  tier?: string;
} | null {
  if (data.limitReached && typeof data.limit === "number" && typeof data.feature === "string") {
    return {
      feature: data.feature as string,
      limit: data.limit as number,
      tier: data.tier as string | undefined,
    };
  }
  return null;
}
