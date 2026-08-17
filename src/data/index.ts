import { gearDatabase, GearItem } from "./gear-database";
import { gearSpecs } from "./gear-specs";

/**
 * Complete gear database with specs merged in.
 * Use this instead of importing gearDatabase directly.
 */
export const gear: GearItem[] = gearDatabase.map((item) => {
  const specs = gearSpecs[item.id];
  if (specs) {
    return { ...item, ...specs };
  }
  return item;
});

// Re-export everything from gear-database for convenience
export * from "./gear-database";
