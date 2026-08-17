/**
 * Format weight in lb + oz format.
 * Under 16oz: shows "X.X oz"
 * 16oz and over: shows "X lb Y.X oz"
 */
export function formatWeight(oz: number): string {
  if (oz < 16) {
    return `${oz.toFixed(1)} oz`;
  }
  const lbs = Math.floor(oz / 16);
  const remainOz = oz % 16;
  return `${lbs} lb ${remainOz.toFixed(1)} oz`;
}

/**
 * Convert oz to grams.
 */
export function ozToGrams(oz: number): number {
  return oz * 28.3495;
}

/**
 * Format weight based on user's preferred unit.
 * - "oz" → lb+oz format (uses formatWeight above)
 * - "g" → grams or kg
 */
export function formatWeightWithUnit(oz: number, unit: "oz" | "g"): string {
  if (unit === "g") {
    const g = ozToGrams(oz);
    if (g >= 1000) {
      return `${(g / 1000).toFixed(2)} kg`;
    }
    return `${Math.round(g)} g`;
  }
  return formatWeight(oz);
}
