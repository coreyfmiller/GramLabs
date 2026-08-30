import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const OZ_PER_MG = 1 / 28349.523125;

interface ParsedItem {
  nm: string; br: string; ca: string; wt: number; pr: number; st: string; qt: number; sr: number; ur: string;
}
interface ParsedCategory { id: string; label: string; color: string }

// Decode the handful of HTML entities LighterPack emits (it escapes slashes as &#x2F;).
function decodeEntities(s: string): string {
  return s
    .replace(/&#x2F;/gi, "/")
    .replace(/&#x3D;/gi, "=")
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .trim();
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (!m) return "#888888";
  const hex = (n: string) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, "0");
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
}

// Slugify a free-text category name into a stable id used across the app.
function catId(label: string): string {
  return "lp-" + (label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "category");
}

/**
 * Parse a LighterPack public share page's HTML into items + categories.
 * The page renders each item as <li class="lpItem ..."> inside category blocks that
 * start with an <li class="lpHeader lpItemsHeader"> carrying the category name + swatch.
 */
function parseLighterPackHtml(html: string): { name: string; items: ParsedItem[]; categories: ParsedCategory[] } {
  // Pack name
  const nameMatch = html.match(/class="lpListName"[^>]*>([\s\S]*?)<\//);
  const packName = nameMatch ? stripTags(nameMatch[1]) : "LighterPack Import";

  const items: ParsedItem[] = [];
  const categories = new Map<string, ParsedCategory>();

  // Collect the opening <li> tags for category headers and items in document order.
  // Header <li>s aren't reliably closed before their items, so we slice each block
  // from its opening tag up to the next header/item <li> rather than trusting </li>.
  const liOpen = /<li\b[^>]*class="([^"]*)"[^>]*>/g;
  const opens: { cls: string; start: number; contentStart: number }[] = [];
  let om: RegExpExecArray | null;
  while ((om = liOpen.exec(html)) !== null) {
    const cls = om[1];
    if (/\blpItemsHeader\b/.test(cls) || /\blpItem\b/.test(cls)) {
      opens.push({ cls, start: om.index, contentStart: liOpen.lastIndex });
    }
  }

  // Walk the blocks, tracking the current category as we pass header rows.
  let currentCat: ParsedCategory = { id: "lp-uncategorized", label: "Uncategorized", color: "#888888" };
  for (let k = 0; k < opens.length; k++) {
    const cur = opens[k];
    const next = opens[k + 1];
    const classes = cur.cls;
    const inner = html.slice(cur.contentStart, next ? next.start : cur.contentStart + 4000);

    if (/\blpItemsHeader\b/.test(classes)) {
      const label = (() => {
        const c = inner.match(/class="lpCategoryName"[^>]*>([\s\S]*?)<\/h2>/) || inner.match(/class="lpCategoryName"[^>]*>([\s\S]*?)<\//);
        return c ? stripTags(c[1]) : "Category";
      })();
      const swatch = inner.match(/lpCategorySwatch"[^>]*background:\s*(rgb\([^)]+\))/i);
      const color = swatch ? rgbToHex(swatch[1]) : "#888888";
      const id = catId(label);
      currentCat = { id, label, color };
      categories.set(id, currentCat);
      continue;
    }

    if (/\blpItem\b/.test(classes) && !/\blpItemsHeader\b/.test(classes)) {
      // Name (inside lpName, possibly wrapped in an <a>)
      const nameBlock = inner.match(/class="lpName"[^>]*>([\s\S]*?)<\/span>/);
      const nm = nameBlock ? stripTags(nameBlock[1]) : "";
      if (!nm) continue;

      // URL
      const href = inner.match(/class="lpHref"[^>]*href="([^"]*)"/) || inner.match(/href="([^"]*)"[^>]*class="lpHref"/);
      const ur = href ? decodeEntities(href[1]) : "";

      // Description -> brand/notes
      const descBlock = inner.match(/class="lpDescription"[^>]*>([\s\S]*?)<\/span>/);
      const br = descBlock ? stripTags(descBlock[1]) : "";

      // Weight: authoritative milligrams from the hidden lpMG input.
      const mgMatch = inner.match(/class="lpMG"\s+value="([\d.]+)"/) || inner.match(/value="([\d.]+)"[^>]*class="lpMG"/);
      const mg = mgMatch ? parseFloat(mgMatch[1]) : 0;
      const wt = Math.round(mg * OZ_PER_MG * 100) / 100;

      // Quantity from the qty cell value or the qtyN attribute.
      const qtyM = inner.match(/class="lpQtyCellValue"[^>]*>\s*(\d+)/) || inner.match(/\bqty(\d+)\b/);
      const qt = qtyM ? Math.max(1, parseInt(qtyM[1], 10)) : 1;

      // Flags (active modifier = on)
      const worn = /class="[^"]*\blpWorn\b[^"]*\blpActive\b/.test(inner);
      const consumable = /class="[^"]*\blpConsumable\b[^"]*\blpActive\b/.test(inner);
      const starred = /class="[^"]*\blpStar(?:1|2|3)\b/.test(inner);

      const st = worn ? "worn" : consumable ? "consumable" : "packed";
      categories.set(currentCat.id, currentCat);
      items.push({ nm, br, ca: currentCat.id, wt, pr: 0, st, qt, sr: starred ? 1 : 0, ur });
    }
  }

  return { name: packName, items, categories: [...categories.values()] };
}

/**
 * GET/POST /api/import/lighterpack?url=...  (public — imports a public LighterPack list)
 * Server-side fetch avoids the browser CORS block and reads the real embedded markup
 * (the old lighterpack.com/r/<id>.json endpoint never existed).
 */
async function handle(req: NextRequest, rawUrl: string | null) {
  const check = await rateLimit(req, { maxPerMinute: 10, feature: "lighterpack-import" });
  if (check.error) return check.error;

  const input = (rawUrl || "").trim();
  const idMatch = input.match(/lighterpack\.com\/(?:r|e)\/([a-z0-9]+)/i) || input.match(/^([a-z0-9]{4,})$/i);
  if (!idMatch) {
    return NextResponse.json({ error: "Enter a LighterPack share URL like https://lighterpack.com/r/abc123" }, { status: 400 });
  }
  const shareId = idMatch[1];

  let html: string;
  try {
    const res = await fetch(`https://lighterpack.com/r/${shareId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HikeMind/1.0; +https://gram-labs.vercel.app)" },
      cache: "no-store",
    });
    if (res.status === 404) return NextResponse.json({ error: "That LighterPack list wasn't found (it may be private or deleted)." }, { status: 404 });
    if (!res.ok) return NextResponse.json({ error: `LighterPack returned ${res.status}` }, { status: 502 });
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Couldn't reach LighterPack. Try again in a moment." }, { status: 502 });
  }

  const parsed = parseLighterPackHtml(html);
  if (parsed.items.length === 0) {
    return NextResponse.json({ error: "No items found in that list." }, { status: 422 });
  }
  return NextResponse.json(parsed);
}

export async function GET(req: NextRequest) {
  return handle(req, new URL(req.url).searchParams.get("url"));
}

export async function POST(req: NextRequest) {
  let body: { url?: string } = {};
  try { body = await req.json(); } catch { /* fall through to 400 */ }
  return handle(req, body.url ?? null);
}
