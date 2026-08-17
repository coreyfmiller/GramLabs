import { GearCategory } from "@/data/gear-database";

export interface ParsedItem {
  name: string;
  brand?: string;
  category?: GearCategory;
  weightOz: number;
  price?: number;
}

/**
 * Map a raw category string (from LighterPack, CSV, etc.) to our GearCategory type.
 */
export function mapCategory(raw: string): GearCategory {
  const s = raw.toLowerCase().trim();

  if (/\b(big\s*3|shelter|tent|tarp|hammock|bivy)\b/.test(s)) return "shelter";
  if (/\b(insulation|quilt|sleeping\s*bag|down\s*bag|underquilt|top\s*quilt)\b/.test(s)) return "insulation";
  if (/\b(pad|mattress|foam|sleeping\s*pad|mat)\b/.test(s)) return "sleeping-pad";
  if (/\b(sleep|sleeping)\b/.test(s)) return "insulation"; // fallback for generic "sleep system"
  if (/\b(pack|backpack|rucksack)\b/.test(s)) return "pack";
  if (/\b(clothing|clothes|worn|apparel|layers?)\b/.test(s)) return "clothing";
  if (/\b(cook|stove|food|eating|kitchen|pot)\b/.test(s)) return "cooking";
  if (/\b(water|hydration|filter|purif)\b/.test(s)) return "water";
  if (/\b(electr|power|light|headlamp|battery|phone|solar)\b/.test(s)) return "electronics";
  if (/\b(hygiene|toiletries|toilet|soap)\b/.test(s)) return "hygiene";
  if (/\b(nav|maps?|compass|gps)\b/.test(s)) return "navigation";
  if (/\b(safety|first\s*aid|emergency|repair)\b/.test(s)) return "safety";

  return "accessories";
}

/**
 * Convert a weight value from a given unit string to ounces.
 */
function convertToOz(value: number, unit: string): number {
  const u = unit.toLowerCase().trim();
  if (/^(g|grams?|gr)$/.test(u)) return value / 28.3495;
  if (/^(kg|kilograms?)$/.test(u)) return (value * 1000) / 28.3495;
  if (/^(lb|lbs?|pounds?)$/.test(u)) return value * 16;
  // oz, ounces, or unrecognized → treat as oz
  return value;
}

/**
 * Detect whether a text block uses comma or tab as delimiter.
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] || "";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs >= commas ? "\t" : ",";
}

/**
 * Try to auto-map header names to our field keys.
 */
type FieldKey = "name" | "brand" | "category" | "weight" | "unit" | "price";

function mapHeader(header: string): FieldKey | null {
  const h = header.toLowerCase().trim();
  if (/^(name|item(\s*name)?|gear|product)$/.test(h)) return "name";
  if (/^(brand|manufacturer|make)$/.test(h)) return "brand";
  if (/^(category|cat|type|group)$/.test(h)) return "category";
  if (/^(weight|wt|mass|oz|grams?|g)$/.test(h)) return "weight";
  if (/^(unit|units?)$/.test(h)) return "unit";
  if (/^(price|cost|\$|usd)$/.test(h)) return "price";
  // LighterPack specific
  if (h === "desc" || h === "description") return null;
  if (h === "qty" || h === "quantity") return null;
  if (h === "url" || h === "link") return null;
  if (h === "worn" || h === "consumable") return null;
  return null;
}

export interface ColumnMapping {
  name: number;
  brand: number;
  category: number;
  weight: number;
  unit: number;
  price: number;
}

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  suggestedMapping: ColumnMapping;
  delimiter: string;
}

/**
 * Parse raw CSV/TSV text and return headers, rows, and a suggested column mapping.
 * Does NOT produce ParsedItems yet — that happens after user confirms the mapping.
 */
export function parseCSVPreview(text: string): CSVParseResult {
  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) {
    return { headers: [], rows: [], suggestedMapping: emptyMapping(), delimiter };
  }

  const headers = splitRow(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => splitRow(line, delimiter));

  // Suggest mapping based on header names
  const suggestedMapping = emptyMapping();
  headers.forEach((h, i) => {
    const field = mapHeader(h);
    if (field && suggestedMapping[field] === -1) {
      suggestedMapping[field] = i;
    }
  });

  // If no name column detected, default to first column
  if (suggestedMapping.name === -1 && headers.length > 0) {
    suggestedMapping.name = 0;
  }

  return { headers, rows, suggestedMapping, delimiter };
}

/**
 * Given rows and a confirmed column mapping, produce ParsedItems.
 */
export function applyCSVMapping(
  rows: string[][],
  mapping: ColumnMapping
): ParsedItem[] {
  const items: ParsedItem[] = [];

  for (const row of rows) {
    const name = mapping.name >= 0 ? row[mapping.name]?.trim() : "";
    if (!name) continue;

    const rawWeight = mapping.weight >= 0 ? row[mapping.weight]?.trim() : "";
    const rawUnit = mapping.unit >= 0 ? row[mapping.unit]?.trim() : "oz";
    const rawBrand = mapping.brand >= 0 ? row[mapping.brand]?.trim() : undefined;
    const rawCategory = mapping.category >= 0 ? row[mapping.category]?.trim() : undefined;
    const rawPrice = mapping.price >= 0 ? row[mapping.price]?.trim() : undefined;

    const weightNum = parseFloat(rawWeight) || 0;
    const weightOz = convertToOz(weightNum, rawUnit || "oz");

    items.push({
      name,
      brand: rawBrand || undefined,
      category: rawCategory ? mapCategory(rawCategory) : undefined,
      weightOz: Math.round(weightOz * 100) / 100,
      price: rawPrice ? parseFloat(rawPrice) || undefined : undefined,
    });
  }

  return items;
}

/**
 * Convenience: parse a full CSV string directly into ParsedItems using auto-detection.
 */
export function parseCSV(text: string): ParsedItem[] {
  const { rows, suggestedMapping } = parseCSVPreview(text);
  return applyCSVMapping(rows, suggestedMapping);
}

/**
 * Parse free-form text into gear items.
 * Looks for weight patterns like "12 oz", "340g", "2.5 lb" etc.
 */
export function parseText(text: string): ParsedItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const items: ParsedItem[] = [];

  // Weight pattern: number (with optional decimal) followed by unit
  const weightRegex =
    /(\d+\.?\d*)\s*(oz|ounces?|g|grams?|gr|lb|lbs?|pounds?|kg|kilograms?)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip lines that look like headers
    if (/^(name|item|brand|category|weight)/i.test(trimmed) && lines.indexOf(line) === 0) {
      continue;
    }

    const match = trimmed.match(weightRegex);
    if (match) {
      const weightValue = parseFloat(match[1]);
      const unit = match[2];
      const weightOz = convertToOz(weightValue, unit);

      // Name is everything before the weight pattern, cleaned up
      const weightIndex = trimmed.indexOf(match[0]);
      let name = trimmed.substring(0, weightIndex).trim();

      // Remove trailing separators: dash, comma, pipe, parenthesis
      name = name.replace(/[-,|(\s]+$/, "").trim();

      // If name is empty, try everything after the weight
      if (!name) {
        name = trimmed.substring(weightIndex + match[0].length).trim();
        name = name.replace(/^[-,|)\s]+/, "").trim();
      }

      if (name) {
        items.push({
          name,
          weightOz: Math.round(weightOz * 100) / 100,
        });
      }
    } else {
      // No weight found — check if it's tab/comma separated with a number
      const parts = trimmed.split(/[,\t]+/).map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        // Look for a numeric value in remaining parts
        for (let i = 1; i < parts.length; i++) {
          const num = parseFloat(parts[i]);
          if (!isNaN(num) && num > 0 && num < 1000) {
            // Check if next part is a unit
            const nextPart = parts[i + 1]?.toLowerCase().trim() || "";
            const unit = /^(oz|g|grams?|lb|lbs?|kg)$/.test(nextPart)
              ? nextPart
              : "oz";
            items.push({
              name,
              weightOz: Math.round(convertToOz(num, unit) * 100) / 100,
            });
            break;
          }
        }
      }
    }
  }

  return items;
}

function emptyMapping(): ColumnMapping {
  return { name: -1, brand: -1, category: -1, weight: -1, unit: -1, price: -1 };
}

/**
 * Split a CSV row, handling basic quoted fields.
 */
function splitRow(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}
