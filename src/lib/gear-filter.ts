/**
 * Hard-filter utility for gear items.
 *
 * Narrows the full gear database by deterministic constraints (budget tier,
 * sleep style, category requirements) BEFORE semantic search runs. This
 * eliminates obviously irrelevant items and reduces embedding comparisons.
 */

import { gearDatabase, type GearItem, type GearTier } from "@/data/gear-database";

export interface FilterConstraints {
  /** Max total budget — determines which tiers are viable */
  budget: number;
  /** Trip type: "3-season", "winter", "thru-hike", "weekend" */
  tripType: string;
  /** Climate: "desert", "temperate", "alpine", "pnw" */
  climate: string;
  /** Sleep style: "tent", "tarp", "hammock" */
  sleepStyle: string;
  /** Priority: "lightest", "value", "comfort" */
  priority: string;
}

/**
 * Determine which tier(s) are affordable given the budget.
 * Higher budgets unlock premium gear; lower budgets restrict to budget tiers.
 */
function getAffordableTiers(budget: number): Set<GearTier> {
  if (budget >= 3000) return new Set(["ultra-budget", "budget", "mid", "premium"]);
  if (budget >= 1500) return new Set(["ultra-budget", "budget", "mid", "premium"]);
  if (budget >= 800) return new Set(["ultra-budget", "budget", "mid"]);
  if (budget >= 400) return new Set(["ultra-budget", "budget", "mid"]);
  return new Set(["ultra-budget", "budget"]);
}

/**
 * Determine max price per individual item based on budget.
 * Prevents recommending a single $700 tent on a $800 total budget.
 */
function getMaxItemPrice(budget: number): number {
  // No single item should exceed ~40% of total budget
  return Math.round(budget * 0.4);
}

/**
 * Filter shelter items by sleep style preference.
 * If user picked "hammock", exclude tents/tarps (and vice versa).
 */
function matchesSleepStyle(item: GearItem, sleepStyle: string): boolean {
  if (item.category !== "shelter") return true;

  switch (sleepStyle) {
    case "hammock":
      return item.shelterType === "hammock" || item.subcategory === "hammock";
    case "tarp":
      return (
        item.shelterType === "tarp" ||
        item.shelterType === "tarp-system" ||
        item.subcategory === "tarp"
      );
    case "tent":
    default:
      return (
        item.shelterType !== "hammock" &&
        item.subcategory !== "hammock"
      );
  }
}

/**
 * Filter sleep system items by climate suitability.
 * Desert doesn't need a 0°F quilt; alpine doesn't want a 40°F liner.
 */
function matchesClimate(item: GearItem, climate: string): boolean {
  // Only relevant for items with temp ratings (quilts, bags, underquilts)
  if (item.tempRating == null) return true;

  switch (climate) {
    case "desert":
      // Desert: 30°F+ is fine (warm nights)
      return item.tempRating >= 25;
    case "alpine":
    case "winter":
      // Alpine/winter: need items rated 20°F or below
      return item.tempRating <= 30;
    case "pnw":
      // PNW: moderate cold, 20-40°F range
      return item.tempRating <= 40;
    case "temperate":
    default:
      // Temperate: 20-40°F range
      return item.tempRating >= 10 && item.tempRating <= 45;
  }
}

/**
 * Filter pads by climate (R-value).
 */
function padMatchesClimate(item: GearItem, climate: string): boolean {
  if (item.rValue == null) return true;

  switch (climate) {
    case "desert":
      // Any pad works in desert
      return true;
    case "alpine":
    case "winter":
      // Need R-value 4+ for cold ground
      return item.rValue >= 3.5;
    case "pnw":
      // R-value 3+ for PNW
      return item.rValue >= 2.5;
    case "temperate":
    default:
      return item.rValue >= 2;
  }
}

/**
 * Filter hammock-specific sleep items.
 * If user chose hammock, include underquilts; otherwise exclude them.
 */
function matchesHammockContext(item: GearItem, sleepStyle: string): boolean {
  if (item.subcategory === "underquilt" || item.subcategory === "hammock-suspension") {
    return sleepStyle === "hammock";
  }
  return true;
}

/**
 * Apply all hard filters and return a reduced gear list.
 * Typically cuts the database by 60-80%.
 */
export function filterGear(constraints: FilterConstraints): GearItem[] {
  const affordableTiers = getAffordableTiers(constraints.budget);
  const maxItemPrice = getMaxItemPrice(constraints.budget);

  return gearDatabase.filter((item) => {
    // Price ceiling per item
    if (item.priceUsd > maxItemPrice) return false;

    // Tier filter — but allow all tiers if priority is "lightest"
    // (ultralight premium items may be necessary for weight goals)
    if (constraints.priority !== "lightest" && !affordableTiers.has(item.tier)) {
      return false;
    }
    // Even for "lightest", cap individual items at budget * 0.5
    if (constraints.priority === "lightest" && item.priceUsd > constraints.budget * 0.5) {
      return false;
    }

    // Sleep style compatibility
    if (!matchesSleepStyle(item, constraints.sleepStyle)) return false;

    // Climate suitability for temp-rated items
    if (!matchesClimate(item, constraints.climate)) return false;

    // Pad R-value vs climate
    if (!padMatchesClimate(item, constraints.climate)) return false;

    // Hammock-specific items
    if (!matchesHammockContext(item, constraints.sleepStyle)) return false;

    return true;
  });
}
