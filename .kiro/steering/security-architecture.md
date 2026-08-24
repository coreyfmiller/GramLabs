---
inclusion: auto
---

# Security & Architecture — Enforced Rules

These rules are NON-NEGOTIABLE. Every code change must comply. If a rule conflicts with speed or convenience, the rule wins.

---

## Authentication

- **All features require authentication.** The only public routes are `/` (homepage), `/login`, and `/auth/*`.
- **API routes handle their own auth** via `rateLimit()` from `src/lib/rate-limit.ts`. The proxy does NOT gate `/api/*` — each route is responsible for its own auth check.
- **Never create a feature that works without an account.** No "anonymous mode." No "try before you sign up." The homepage is the sales pitch; the product requires login.
- **Use `createClient()` from `@/lib/supabase/server` in server components/API routes.** Use `createClient()` from `@/lib/supabase/client` in client components.
- **Never use `@supabase/auth-helpers-nextjs`.** It's deprecated. Always use `@supabase/ssr` with `getAll`/`setAll` cookie pattern.

## Data Persistence

- **Supabase is the ONLY source of truth for user data.** Not localStorage. Not cookies. Not in-memory.
- **localStorage MUST NOT be used for persisting user data.** It exists currently as legacy in `pack-store.ts` and must be removed. Any new feature that needs persistence writes to Supabase.
- **The Zustand store (`pack-store.ts`) is an in-memory runtime cache.** It is hydrated FROM Supabase on page load and synced back on changes. It is NOT the persistence layer.
- **If Supabase is down, the app degrades gracefully** (shows a "connection issue" message), it does NOT fall back to localStorage.

## Rate Limiting & Cost Protection

- **Every AI-powered API route MUST use `rateLimit()`.** No exceptions. If you create a new route that calls Gemini, it gets rate-limited.
- **Daily limits per feature:** chat=20, build-kit=5, trip=10, analyze-pack=10. Early adopters get 2x. Pro gets unlimited.
- **IP rate limiting:** Maximum 10 requests/minute per IP on AI routes.
- **Abuse detection:** Import `isAbusivePrompt` from `@/lib/abuse-detection` on any route that accepts free-form text input.
- **Bot blocking:** Check `isBotUserAgent` on expensive routes.

## API Route Template

Every new AI API route MUST follow this pattern:

```typescript
import { rateLimit } from "@/lib/rate-limit";
import { isAbusivePrompt, isBotUserAgent } from "@/lib/abuse-detection";

export async function POST(req: NextRequest) {
  if (isBotUserAgent(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const check = await rateLimit(req, {
    requireAuth: true,
    dailyLimit: <number>,
    maxPerMinute: <number>,
    feature: "<feature-name>",
  });
  if (check.error) return check.error;

  // ... route logic
}
```

## Database Access

- **Public gear data** (gear_items table) can use the anonymous client (`src/lib/supabase.ts`) since it's read-only public data.
- **User-specific data** (user_gear, loadouts, usage_tracking, profiles) MUST use the authenticated client.
- **Row Level Security (RLS) is enabled on ALL user tables.** Never disable it. Never use `service_role` key in client-facing code.
- **Supabase returns max 1000 rows per query.** Always paginate with `.range()` or use `{ count: "exact", head: true }` for counts.

## What NEVER Goes in Client Bundles

- API keys (GEMINI_API_KEY, service role keys)
- Full gear database as static data (the `src/data/gear-database.ts` data array is LEGACY — do not import the array in new code, only the types)
- User data from other users
- Internal admin logic

## Anti-Scraping

- Gear browsing queries Supabase directly (protected by Supabase's own rate limiting on the anon key).
- The AI routes are the expensive attack surface — always gated behind auth + rate limits.
- Never create an API route that dumps the full gear database in one response.

## Environment Variables

- `NEXT_PUBLIC_*` vars are exposed to the client. ONLY Supabase URL and anon key go here.
- `GEMINI_API_KEY` is server-only. Never prefix with `NEXT_PUBLIC_`.
- Never log, echo, or return env var values in API responses.

## Deployment

- All code deploys via `git push` to `main` → Vercel auto-deploys.
- Database schema changes require running SQL manually in Supabase SQL Editor.
- SQL migration scripts live in `/scripts/*.sql` and are documented in `TODO.md`.
