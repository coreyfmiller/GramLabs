/**
 * Abuse Detection
 *
 * Detects bot-like patterns:
 * 1. Repeated identical prompts (same message 3+ times in 5 minutes)
 * 2. Rapid sequential requests from same user (sustained high-rate)
 * 3. Known bot user-agents (blocked in proxy)
 */

// In-memory cache of recent prompts per user/IP
interface PromptEntry {
  hash: string;
  timestamp: number;
}

const recentPrompts = new Map<string, PromptEntry[]>();

// Simple hash function for prompt comparison
function hashPrompt(text: string): string {
  const normalized = text.toLowerCase().trim().slice(0, 200);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Check if a prompt appears to be abusive (repeated/bot-like).
 * Returns true if the request should be blocked.
 */
export function isAbusivePrompt(
  identifier: string, // user ID or IP
  promptText: string,
  options: { maxRepeats?: number; windowMs?: number } = {}
): { blocked: boolean; reason?: string } {
  const { maxRepeats = 3, windowMs = 5 * 60 * 1000 } = options;
  const now = Date.now();
  const hash = hashPrompt(promptText);

  // Get or create entry list for this identifier
  let entries = recentPrompts.get(identifier) || [];

  // Clean old entries outside the window
  entries = entries.filter((e) => now - e.timestamp < windowMs);

  // Count how many times this exact prompt was sent
  const repeatCount = entries.filter((e) => e.hash === hash).length;

  if (repeatCount >= maxRepeats) {
    return {
      blocked: true,
      reason: `Same prompt sent ${repeatCount + 1} times in ${Math.round(windowMs / 60000)} minutes. Please try a different question.`,
    };
  }

  // Check for rapid-fire (10+ prompts of ANY kind in 1 minute — even varied)
  const lastMinuteEntries = entries.filter((e) => now - e.timestamp < 60_000);
  if (lastMinuteEntries.length >= 10) {
    return {
      blocked: true,
      reason: "Too many requests in a short time. Please wait a moment.",
    };
  }

  // Record this prompt
  entries.push({ hash, timestamp: now });
  recentPrompts.set(identifier, entries);

  return { blocked: false };
}

// Known bot user-agent patterns
const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /scrape/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /axios/i,
  /node-fetch/i,
  /postman/i,
  /insomnia/i,
];

/**
 * Check if the request comes from a known bot user-agent.
 * Note: this is easily spoofed, so it's a first-pass filter, not a security guarantee.
 */
export function isBotUserAgent(request: Request): boolean {
  const ua = request.headers.get("user-agent") || "";
  if (!ua) return true; // No user-agent = suspicious
  return BOT_PATTERNS.some((pattern) => pattern.test(ua));
}

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 min retention
  for (const [key, entries] of recentPrompts.entries()) {
    const filtered = entries.filter((e) => now - e.timestamp < windowMs);
    if (filtered.length === 0) {
      recentPrompts.delete(key);
    } else {
      recentPrompts.set(key, filtered);
    }
  }
}, 60_000);
