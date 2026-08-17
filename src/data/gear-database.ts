export interface GearItem {
  id: string;
  name: string;
  brand: string;
  category: GearCategory;
  weightOz: number;
  priceUsd: number;
  description: string;
  tempRating?: number; // °F for sleep system items
  rValue?: number; // For sleeping pads
  volume?: number; // Liters for packs
  waterproof?: boolean;
}

export type GearCategory =
  | "shelter"
  | "sleep-system"
  | "pack"
  | "clothing"
  | "cooking"
  | "water"
  | "electronics"
  | "hygiene"
  | "navigation"
  | "safety"
  | "accessories";

export const CATEGORY_LABELS: Record<GearCategory, string> = {
  shelter: "Shelter",
  "sleep-system": "Sleep System",
  pack: "Pack",
  clothing: "Clothing",
  cooking: "Cooking",
  water: "Water",
  electronics: "Electronics",
  hygiene: "Hygiene",
  navigation: "Navigation",
  safety: "Safety",
  accessories: "Accessories",
};

export const CATEGORY_COLORS: Record<GearCategory, string> = {
  shelter: "#ef4444",
  "sleep-system": "#8b5cf6",
  pack: "#f97316",
  clothing: "#3b82f6",
  cooking: "#eab308",
  water: "#06b6d4",
  electronics: "#ec4899",
  hygiene: "#84cc16",
  navigation: "#14b8a6",
  safety: "#f43f5e",
  accessories: "#6b7280",
};

export const gearDatabase: GearItem[] = [
  // === SHELTER ===
  {
    id: "zpacks-duplex",
    name: "Duplex",
    brand: "Zpacks",
    category: "shelter",
    weightOz: 19.4,
    priceUsd: 699,
    description: "DCF 2-person trekking pole tent. Gold standard UL shelter.",
  },
  {
    id: "tarptent-notch-li",
    name: "Notch Li",
    brand: "Tarptent",
    category: "shelter",
    weightOz: 22,
    priceUsd: 525,
    description: "DCF single-wall trekking pole tent with integrated bug net.",
  },
  {
    id: "gossamer-gear-one",
    name: "The One",
    brand: "Gossamer Gear",
    category: "shelter",
    weightOz: 18,
    priceUsd: 350,
    description: "Silnylon single-person trekking pole shelter. Budget UL pick.",
  },
  {
    id: "hmg-unbound-2p",
    name: "Unbound 2P",
    brand: "Hyperlite Mountain Gear",
    category: "shelter",
    weightOz: 28,
    priceUsd: 895,
    description: "DCF freestanding 2-person tent. Bomber in weather.",
  },
  {
    id: "sixmoon-lunar-solo",
    name: "Lunar Solo",
    brand: "Six Moon Designs",
    category: "shelter",
    weightOz: 26,
    priceUsd: 260,
    description: "Silnylon single-wall trekking pole tent. Great value.",
  },

  // === SLEEP SYSTEM ===
  {
    id: "katabatic-palisade",
    name: "Palisade 15°F",
    brand: "Katabatic",
    category: "sleep-system",
    weightOz: 22.8,
    priceUsd: 465,
    description: "900fp down quilt. Drafts-free collar. Top-tier warmth-to-weight.",
    tempRating: 15,
  },
  {
    id: "enlightened-enigma-20",
    name: "Enigma 20°F",
    brand: "Enlightened Equipment",
    category: "sleep-system",
    weightOz: 20.5,
    priceUsd: 340,
    description: "850fp down quilt. Customizable length/width/fill.",
    tempRating: 20,
  },
  {
    id: "nunatak-arc-ul-20",
    name: "Arc UL 20°F",
    brand: "Nunatak",
    category: "sleep-system",
    weightOz: 24,
    priceUsd: 560,
    description: "Premium 950fp quilt with differential cut. Virtually no drafts.",
    tempRating: 20,
  },
  {
    id: "nemo-tensor-regular",
    name: "Tensor Insulated Regular",
    brand: "NEMO",
    category: "sleep-system",
    weightOz: 15,
    priceUsd: 200,
    description: "Air pad with excellent R-value for weight. Quiet fabric.",
    rValue: 4.2,
  },
  {
    id: "thermarest-xlite-nxt",
    name: "NeoAir XLite NXT",
    brand: "Therm-a-Rest",
    category: "sleep-system",
    weightOz: 12.5,
    priceUsd: 230,
    description: "Lightest insulated air pad. Industry benchmark.",
    rValue: 4.5,
  },
  {
    id: "thermarest-uberlite",
    name: "NeoAir UberLite",
    brand: "Therm-a-Rest",
    category: "sleep-system",
    weightOz: 8.8,
    priceUsd: 200,
    description: "Ultralight 3-season pad. Minimal R-value for summer use.",
    rValue: 2.3,
  },

  // === PACK ===
  {
    id: "hmg-southwest-55",
    name: "Southwest 55",
    brand: "Hyperlite Mountain Gear",
    category: "pack",
    weightOz: 30.4,
    priceUsd: 405,
    description: "DCF frameless-to-framed hybrid. Waterproof. Comfortable to 25lbs.",
    volume: 55,
  },
  {
    id: "gossamer-gear-mariposa",
    name: "Mariposa 60",
    brand: "Gossamer Gear",
    category: "pack",
    weightOz: 26.5,
    priceUsd: 285,
    description: "Best UL pack for carrying heavier loads. Internal frame.",
    volume: 60,
  },
  {
    id: "ula-circuit",
    name: "Circuit",
    brand: "ULA",
    category: "pack",
    weightOz: 39,
    priceUsd: 275,
    description: "Reliable workhorse. Handles 35lbs. Excellent hip belt.",
    volume: 68,
  },
  {
    id: "pa-packer-35",
    name: "Packer 35",
    brand: "Pa'lante",
    category: "pack",
    weightOz: 15,
    priceUsd: 250,
    description: "Minimalist frameless pack. For sub-12lb base weights only.",
    volume: 35,
  },
  {
    id: "durston-kakwa-55",
    name: "Kakwa 55",
    brand: "Durston",
    category: "pack",
    weightOz: 22,
    priceUsd: 260,
    description: "Frameless DCF pack with great organization. Solid to 20lbs.",
    volume: 55,
  },

  // === CLOTHING ===
  {
    id: "patagonia-houdini",
    name: "Houdini Air",
    brand: "Patagonia",
    category: "clothing",
    weightOz: 3.7,
    priceUsd: 129,
    description: "Breathable wind shell. Essential above treeline.",
    waterproof: false,
  },
  {
    id: "frogg-toggs-ul2",
    name: "Ultra-Lite2 Rain Suit",
    brand: "Frogg Toggs",
    category: "clothing",
    weightOz: 5.5,
    priceUsd: 20,
    description: "Cheap disposable rain jacket. Not durable but incredibly light.",
    waterproof: true,
  },
  {
    id: "enlightened-torrid-apex",
    name: "Torrid APEX",
    brand: "Enlightened Equipment",
    category: "clothing",
    weightOz: 8.5,
    priceUsd: 220,
    description: "Synthetic insulated jacket. Works when wet. Camp warmth.",
  },
  {
    id: "katabatic-tarn",
    name: "Tarn 800fp",
    brand: "Katabatic",
    category: "clothing",
    weightOz: 7.8,
    priceUsd: 340,
    description: "Premium down jacket. Incredible warmth-to-weight.",
  },
  {
    id: "montbell-versalite",
    name: "Versalite Rain Jacket",
    brand: "Montbell",
    category: "clothing",
    weightOz: 6.4,
    priceUsd: 249,
    description: "Gore-Tex Infinium rain jacket. Light, breathable, bombproof.",
    waterproof: true,
  },
  {
    id: "melanzana-microgrid",
    name: "Micro Grid Hoodie",
    brand: "Melanzana",
    category: "clothing",
    weightOz: 8.2,
    priceUsd: 72,
    description: "Cult-classic fleece. Breathable, wicking, great as active layer.",
  },

  // === COOKING ===
  {
    id: "brs-3000t",
    name: "BRS-3000T",
    brand: "BRS",
    category: "cooking",
    weightOz: 0.9,
    priceUsd: 18,
    description: "Titanium canister stove. Lightest hot-cooking option.",
  },
  {
    id: "toaks-550-ti",
    name: "550ml Titanium Pot",
    brand: "TOAKS",
    category: "cooking",
    weightOz: 2.6,
    priceUsd: 35,
    description: "Solo cooking pot. Fits a small fuel canister inside.",
  },
  {
    id: "litesmith-cold-soak-jar",
    name: "Cold Soak Jar",
    brand: "Litesmith",
    category: "cooking",
    weightOz: 2.8,
    priceUsd: 8,
    description: "Talenti jar for cold soaking. No stove needed.",
  },
  {
    id: "bic-mini-lighter",
    name: "Mini Lighter",
    brand: "BIC",
    category: "cooking",
    weightOz: 0.5,
    priceUsd: 2,
    description: "Standard mini lighter. Backup fire starter.",
  },

  // === WATER ===
  {
    id: "sawyer-squeeze",
    name: "Squeeze Filter",
    brand: "Sawyer",
    category: "water",
    weightOz: 3,
    priceUsd: 37,
    description: "Gravity/squeeze filter. Community standard. Backflush to maintain.",
  },
  {
    id: "cnoc-vecto-2l",
    name: "Vecto 2L",
    brand: "CNOC",
    category: "water",
    weightOz: 2.9,
    priceUsd: 18,
    description: "Wide-mouth soft flask. Pairs perfectly with Sawyer.",
  },
  {
    id: "smartwater-1l",
    name: "1L Smartwater Bottle",
    brand: "Smartwater",
    category: "water",
    weightOz: 1.3,
    priceUsd: 3,
    description: "The UL water bottle. Sports cap fits Sawyer. Disposable.",
  },

  // === ELECTRONICS ===
  {
    id: "nitecore-nb10000-gen2",
    name: "NB10000 Gen 2",
    brand: "Nitecore",
    category: "electronics",
    weightOz: 5.3,
    priceUsd: 50,
    description: "10,000mAh power bank. Best capacity-to-weight for UL.",
  },
  {
    id: "petzl-iko-core",
    name: "IKO Core",
    brand: "Petzl",
    category: "electronics",
    weightOz: 2.4,
    priceUsd: 100,
    description: "Ultralight rechargeable headlamp. 500 lumens.",
  },
  {
    id: "garmin-inreach-mini2",
    name: "inReach Mini 2",
    brand: "Garmin",
    category: "electronics",
    weightOz: 3.5,
    priceUsd: 400,
    description: "Satellite messenger + SOS. Essential for remote areas.",
  },

  // === HYGIENE ===
  {
    id: "deuce-trowel",
    name: "#2 UL Trowel",
    brand: "The Deuce",
    category: "hygiene",
    weightOz: 0.6,
    priceUsd: 20,
    description: "Aluminum cathole trowel. LNT essential.",
  },
  {
    id: "litesmith-hand-sani",
    name: "Hand Sanitizer (1oz)",
    brand: "Litesmith",
    category: "hygiene",
    weightOz: 1.2,
    priceUsd: 3,
    description: "Small dropper bottle of hand sanitizer.",
  },

  // === NAVIGATION ===
  {
    id: "caltopo-subscription",
    name: "CalTopo (App)",
    brand: "CalTopo",
    category: "navigation",
    weightOz: 0,
    priceUsd: 50,
    description: "Offline topo maps + route planning. Yearly subscription.",
  },

  // === SAFETY ===
  {
    id: "leukotape",
    name: "Leukotape (pre-cut strips)",
    brand: "Leukotape",
    category: "safety",
    weightOz: 0.5,
    priceUsd: 5,
    description: "Blister prevention/treatment tape. Wrapped around lighter.",
  },
  {
    id: "mini-first-aid",
    name: "UL First Aid Kit",
    brand: "Custom",
    category: "safety",
    weightOz: 2.8,
    priceUsd: 25,
    description: "Ibuprofen, antihistamine, gauze, tape, tweezers, Aquamira.",
  },

  // === ACCESSORIES ===
  {
    id: "zpacks-bear-bag-kit",
    name: "Bear Bagging Kit",
    brand: "Zpacks",
    category: "accessories",
    weightOz: 3.1,
    priceUsd: 42,
    description: "DCF food bag + rock sack + 50ft line.",
  },
  {
    id: "sea-to-summit-stuff-sack-6l",
    name: "Ultra-Sil Stuff Sack 6.5L",
    brand: "Sea to Summit",
    category: "accessories",
    weightOz: 0.8,
    priceUsd: 18,
    description: "Lightweight organization sack.",
  },
  {
    id: "gossamer-gear-thinlight-pad",
    name: "Thinlight 1/8\" Pad",
    brand: "Gossamer Gear",
    category: "accessories",
    weightOz: 2,
    priceUsd: 22,
    description: "CCF sit pad / frame sheet / extra insulation. Multi-use.",
  },
];
