export type GearTier = "ultra-budget" | "budget" | "mid" | "premium";

export const TIER_LABELS: Record<GearTier, string> = {
  "ultra-budget": "Ultra-Budget",
  budget: "Budget",
  mid: "Mid-Range",
  premium: "Premium",
};

export const TIER_COLORS: Record<GearTier, string> = {
  "ultra-budget": "#06b6d4", // cyan
  budget: "#22c55e", // green
  mid: "#eab308", // yellow
  premium: "#a855f7", // purple
};

export interface GearItem {
  id: string;
  name: string;
  brand: string;
  category: GearCategory;
  subcategory?: GearSubcategory;
  tier: GearTier;
  weightOz: number;
  priceUsd: number;
  description: string;
  url?: string;

  // === SHELTER SPECS ===
  floorArea?: number; // sq ft
  peakHeight?: number; // inches
  packedSize?: string; // e.g. "4x16 in"
  setupType?: "freestanding" | "semi-freestanding" | "non-freestanding" | "tarp";
  shelterType?: "trekking-pole-tent" | "freestanding-tent" | "tarp" | "tarp-system" | "hammock" | "bivy" | "pyramid";
  capacity?: number; // persons
  poleType?: "trekking" | "dedicated" | "both" | "none";
  fabric?: string; // e.g. "DCF", "15D Silnylon", "20D Silpoly"
  fabricDenier?: number; // e.g. 7, 10, 15, 20
  stakesNeeded?: number;
  seasons?: "3" | "3+" | "4";
  doors?: number;
  vestibuleArea?: number; // sq ft

  // === SLEEP SYSTEM (quilts/bags) ===
  tempRating?: number; // °F comfort rating
  fillPower?: number; // e.g. 800, 850, 900, 950
  fillWeight?: number; // oz of actual fill
  fillType?: "goose-down" | "duck-down" | "synthetic" | "none";
  sleepWidth?: "narrow" | "regular" | "wide" | "x-wide";
  sleepLength?: "short" | "regular" | "long";
  sleepStyle?: "quilt" | "mummy" | "semi-rectangular" | "rectangular";
  padAttachment?: boolean;
  enTested?: boolean; // ISO/EN temp rating tested

  // === SLEEP SYSTEM (pads) ===
  rValue?: number;
  thickness?: number; // inches
  padPackedSize?: string; // e.g. "4x9 in"
  padShape?: "mummy" | "rectangular" | "wide" | "tapered";
  inflationMethod?: "breath" | "pump" | "self-inflating" | "none";
  padWidth?: number; // inches
  padLength?: number; // inches

  // === PACK SPECS ===
  volume?: number; // liters
  maxCarryWeight?: number; // lbs
  frameType?: "framed" | "frameless" | "removable" | "stays";
  frameMaterial?: string; // e.g. "aluminum", "carbon", "HDPE"
  packFabric?: string; // e.g. "DCF", "Robic nylon", "X-Pac"
  torsoRange?: string; // e.g. "16-21 in"
  hipBelt?: "integrated" | "removable" | "none";
  waterBottleAccess?: "side" | "shoulder" | "both" | "none";

  // === CLOTHING (insulated) ===
  hoodType?: "hooded" | "hoodless";
  pockets?: number;
  packable?: boolean;

  // === CLOTHING (shells/rain) ===
  waterproof?: boolean;
  waterproofRating?: number; // mm
  breathability?: number; // g/m²/24hr MVTR
  fabricTech?: string; // e.g. "GORE-TEX", "Pertex Shield", "eVent"
  pitZips?: boolean;
  seamSealed?: boolean;

  // === STOVES ===
  fuelType?: "canister" | "alcohol" | "solid" | "wood" | "none";
  boilTime?: number; // minutes for 1L
  igniter?: boolean;
  potIncluded?: boolean;
  simmerControl?: boolean;

  // === HEADLAMPS / ELECTRONICS ===
  lumens?: number;
  batteryType?: "rechargeable" | "AAA" | "AA" | "CR2032";
  chargeMethod?: "usb-c" | "micro-usb" | "none";
  runtime?: number; // hours on max
  redLight?: boolean;
  ipxRating?: number; // e.g. 4, 5, 6, 7, 8

  // === TREKKING POLES ===
  poleMaterial?: "carbon" | "aluminum";
  collapsedLength?: number; // inches
  lockType?: "flicklock" | "twist" | "z-fold" | "lever";
  gripMaterial?: "cork" | "foam" | "rubber";
  poleSections?: number; // 2, 3, or folding

  // === SHOES ===
  heelDrop?: number; // mm
  stackHeight?: number; // mm
  toeBoxWidth?: "narrow" | "standard" | "wide" | "extra-wide";

  // === COMMUNITY DATA ===
  communityRating?: number; // 1-10 from PCT survey or aggregated
  pctUsagePercent?: number; // % of PCT hikers using this
  pairsPerThru?: number; // shoes: avg pairs used on a thru-hike
}

export type GearCategory =
  | "shelter"
  | "sleep"
  | "pack"
  | "kitchen"
  | "electronics"
  | "clothing"
  | "safety"
  | "accessories";

export type GearSubcategory = string;

export const SUBCATEGORIES: Record<GearCategory, { id: string; label: string }[]> = {
  shelter: [
    { id: "trekking-pole-tent", label: "Trekking Pole Tents" },
    { id: "freestanding-tent", label: "Freestanding Tents" },
    { id: "tarp", label: "Tarps" },
    { id: "hammock", label: "Hammocks" },
    { id: "bivy", label: "Bivys" },
    { id: "pyramid", label: "Pyramids" },
  ],
  sleep: [
    { id: "quilt", label: "Quilts" },
    { id: "sleeping-bag", label: "Sleeping Bags" },
    { id: "pad-inflatable", label: "Pads (Air)" },
    { id: "pad-foam", label: "Pads (Foam)" },
    { id: "pillow", label: "Pillows" },
    { id: "underquilt", label: "Underquilts" },
    { id: "liner", label: "Liners" },
  ],
  pack: [
    { id: "thru-hike", label: "Thru-Hiking (45L+)" },
    { id: "fast-light", label: "Fast & Light (<45L)" },
    { id: "daypack", label: "Day Packs" },
    { id: "running-vest", label: "Running Vests" },
  ],
  kitchen: [
    { id: "stove", label: "Stoves" },
    { id: "cookware", label: "Cookware" },
    { id: "water-filter", label: "Water Filtration" },
    { id: "water-storage", label: "Water Storage" },
    { id: "food", label: "Food & Coffee" },
    { id: "utensils", label: "Utensils & Fuel" },
  ],
  electronics: [
    { id: "headlamp", label: "Headlamps" },
    { id: "gps-watch", label: "GPS Watches" },
    { id: "satellite", label: "Sat Messengers" },
    { id: "power", label: "Power Banks" },
    { id: "solar", label: "Solar" },
    { id: "nav-app", label: "Nav Apps" },
    { id: "camera", label: "Cameras" },
  ],
  clothing: [],
  safety: [
    { id: "bear", label: "Bear Safety" },
    { id: "first-aid", label: "First Aid" },
    { id: "repair", label: "Repair" },
    { id: "insect", label: "Insect Protection" },
    { id: "fire-signal", label: "Fire & Signaling" },
    { id: "tools", label: "Tools & Knives" },
    { id: "traction", label: "Traction" },
  ],
  accessories: [
    { id: "trekking-poles", label: "Trekking Poles" },
    { id: "stuff-sacks", label: "Stuff Sacks & Dry Bags" },
    { id: "rain-gear", label: "Rain Gear" },
    { id: "insulation", label: "Insulation (Puffies)" },
    { id: "sun-protection", label: "Sun Protection" },
    { id: "camp-comfort", label: "Camp Comfort" },
    { id: "hygiene", label: "Hygiene" },
    { id: "socks", label: "Socks" },
    { id: "hammock-suspension", label: "Hammock Suspension" },
  ],
};

/** Canonical display order for categories — use this for sorting everywhere. */
export const CATEGORY_ORDER: GearCategory[] = [
  "shelter",
  "sleep",
  "pack",
  "kitchen",
  "clothing",
  "electronics",
  "safety",
  "accessories",
];

export const CATEGORY_LABELS: Record<GearCategory, string> = {
  shelter: "Shelter",
  sleep: "Sleep",
  pack: "Pack",
  kitchen: "Kitchen",
  electronics: "Electronics",
  clothing: "Clothing",
  safety: "Safety",
  accessories: "Accessories",
};

export const CATEGORY_COLORS: Record<GearCategory, string> = {
  shelter: "#ef4444",
  sleep: "#8b5cf6",
  pack: "#f97316",
  kitchen: "#eab308",
  electronics: "#ec4899",
  clothing: "#3b82f6",
  safety: "#f43f5e",
  accessories: "#6b7280",
};
import gearDatabaseRaw from "./gear-database.json";

export const gearDatabase: GearItem[] = gearDatabaseRaw as unknown as GearItem[];
