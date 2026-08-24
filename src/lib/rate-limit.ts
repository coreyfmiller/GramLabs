/**
 * Rate Limiting + Auth Gate for API Routes
 *
 * Two layers:
 * 1. IP-based rate limiting (stops bots, no auth needed)
 * 2. User-based daily limits (tracks authenticated usage in Supabase)
 *
 * Usage in an API route:
 *   const check = await rateLimit(request, { maxPerMinute: 10, dailyLimit: 20, requireAuth: true });
 *   if (check.error) return check.error;
 *   // check.user is available if requireAuth was true
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================
// In-memory IP rate limiter (resets on cold start)
// For Vercel serverless: each instance has its own map,
// so this is approximate but still stops rapid-fire abuse.
// ============================================

interface IPEntry {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, IPEntry>();

function getIP(request: Request): string {
  // Vercel forwards real IP in x-forwarded-for
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function checkIPRate(ip: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= maxPerMinute) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

// Clean up old entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipMap.entries()) {
    if (now > entry.resetAt) ipMap.delete(ip);
  }
}, 60_000);

// ============================================
// User-based daily limit (Supabase-backed)
// ============================================

interface RateLimitOptions {
  /** Max requests per minute from a single IP */
  maxPerMinute?: number;
  /** Max requests per day for authenticated users (0 = unlimited) */
  dailyLimit?: number;
  /** Require authentication (returns 401 if not logged in) */
  requireAuth?: boolean;
  /** Feature name for tracking (e.g., "chat", "build-kit") */
  feature?: string;
}

interface RateLimitResult {
  error: NextResponse | null;
  user: { id: string; email?: string } | null;
  remaining?: number;
}

export async function rateLimit(
  request: Request,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const {
    maxPerMinute = 20,
    dailyLimit = 0,
    requireAuth = false,
    feature = "unknown",
  } = options;

  // Layer 1: IP rate limiting
  const ip = getIP(request);
  if (!checkIPRate(ip, maxPerMinute)) {
    return {
      error: NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: 60 },
        { status: 429, headers: { "Retry-After": "60" } }
      ),
      user: null,
    };
  }

  // Layer 2: Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (requireAuth && !user) {
    return {
      error: NextResponse.json(
        { error: "Sign in to use this feature.", authRequired: true },
        { status: 401 }
      ),
      user: null,
    };
  }

  // Layer 3: User daily limit (only if authenticated and dailyLimit > 0)
  if (user && dailyLimit > 0) {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Check current usage
    const { data: usage } = await supabase
      .from("usage_tracking")
      .select("count")
      .eq("user_id", user.id)
      .eq("feature", feature)
      .eq("date", today)
      .single();

    const currentCount = usage?.count || 0;

    if (currentCount >= dailyLimit) {
      // Check if user is on pro or early-adopter plan
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, tier")
        .eq("id", user.id)
        .single();

      // Pro users bypass entirely
      if (profile?.plan === "pro") {
        // Pro — no limit
      } else if (profile?.tier === "early-adopter") {
        // Early adopters get 2x the free limit before being capped
        const earlyAdopterLimit = dailyLimit * 2;
        if (currentCount >= earlyAdopterLimit) {
          return {
            error: NextResponse.json(
              {
                error: `Daily limit reached (${earlyAdopterLimit}/${earlyAdopterLimit}). Early adopter bonus applied. Resets at midnight UTC.`,
                limitReached: true,
                current: currentCount,
                limit: earlyAdopterLimit,
                feature,
                tier: "early-adopter",
              },
              { status: 429 }
            ),
            user: { id: user.id, email: user.email },
            remaining: 0,
          };
        }
        // Under early adopter limit — allow through
      } else {
        return {
          error: NextResponse.json(
            {
              error: `Daily limit reached (${dailyLimit}/${dailyLimit}). Resets at midnight UTC.`,
              limitReached: true,
              current: currentCount,
              limit: dailyLimit,
              feature,
            },
            { status: 429 }
          ),
          user: { id: user.id, email: user.email },
          remaining: 0,
        };
      }
    }

    // Increment usage (upsert)
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_feature: feature,
      p_date: today,
    });

    return {
      error: null,
      user: { id: user.id, email: user.email },
      remaining: dailyLimit - currentCount - 1,
    };
  }

  // No daily limit or not authenticated — allow through
  return {
    error: null,
    user: user ? { id: user.id, email: user.email } : null,
  };
}
