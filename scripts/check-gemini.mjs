/**
 * Daily Gemini API Health Check
 * 
 * Tests that the configured model is still available.
 * Run via: node scripts/check-gemini.mjs
 * 
 * Set these env vars:
 *   GEMINI_API_KEY - your Google AI API key
 *   ALERT_EMAIL - (optional) email for notifications
 *   ALERT_WEBHOOK - (optional) Discord/Slack webhook URL
 * 
 * For automated daily checks, add to GitHub Actions or Vercel Cron.
 */

const MODEL = "gemini-3.6-flash";
const API_KEY = process.env.GEMINI_API_KEY;
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK; // Discord or Slack webhook

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY not set");
  process.exit(1);
}

async function checkModel() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with OK" }] }],
      }),
    });

    if (res.ok) {
      console.log(`✅ Model ${MODEL} is responding (${res.status})`);
      return true;
    }

    const error = await res.json();
    const msg = error?.error?.message || `HTTP ${res.status}`;
    console.error(`❌ Model ${MODEL} FAILED: ${msg}`);
    await sendAlert(`🚨 HikeMind Gemini Check Failed\n\nModel: ${MODEL}\nError: ${msg}\nTime: ${new Date().toISOString()}`);
    return false;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Network error checking ${MODEL}: ${msg}`);
    await sendAlert(`🚨 HikeMind Gemini Check Failed\n\nModel: ${MODEL}\nNetwork Error: ${msg}\nTime: ${new Date().toISOString()}`);
    return false;
  }
}

async function sendAlert(message) {
  if (!ALERT_WEBHOOK) {
    console.log("No ALERT_WEBHOOK set, skipping notification");
    return;
  }

  try {
    // Works for both Discord and Slack webhooks
    const isDiscord = ALERT_WEBHOOK.includes("discord.com");
    const body = isDiscord
      ? JSON.stringify({ content: message })
      : JSON.stringify({ text: message });

    await fetch(ALERT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    console.log("📨 Alert sent to webhook");
  } catch (err) {
    console.error("Failed to send alert:", err);
  }
}

const ok = await checkModel();
process.exit(ok ? 0 : 1);
