"use client";

import { useState, useEffect } from "react";
import { Search, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronRight, X } from "lucide-react";
import { Nav } from "@/components/Nav";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface GearItemRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  weight_oz: number;
  price_usd: number;
  tier: string;
}

interface BrandInfo {
  brand: string;
  count: number;
  categories: Record<string, number>;
  subcategories: string[];
}

interface DbStats {
  total: number;
  byCategory: Record<string, number>;
  brands: BrandInfo[];
}

// Brands that should exist with a minimum number of items
const EXPECTED_BRANDS: Record<string, { minItems: number; note: string }> = {
  // === SHELTER ===
  "Zpacks": { minItems: 6, note: "DCF shelters + packs" },
  "Tarptent": { minItems: 8, note: "Full tent lineup" },
  "Durston": { minItems: 6, note: "X-Mid series + packs" },
  "Big Agnes": { minItems: 8, note: "Copper Spur, Tiger Wall, etc." },
  "MSR": { minItems: 8, note: "Hubba series + stoves + filters" },
  "NEMO": { minItems: 10, note: "Tents + pads + bags" },
  "Hyperlite Mountain Gear": { minItems: 5, note: "UltaMid, packs, tarps" },
  "Six Moon Designs": { minItems: 4, note: "Lunar Solo, Haven, Gatewood" },
  "Mountain Laurel Designs": { minItems: 4, note: "DuoMid, SoloMid, tarps" },
  "Gossamer Gear": { minItems: 4, note: "The One/Two + packs" },
  "Naturehike": { minItems: 8, note: "Budget tents + pads" },
  "Lightheart Gear": { minItems: 3, note: "SoLong 6, Duo, tarps" },
  "Hilleberg": { minItems: 4, note: "Enan, Anjan, Niak, Soulo" },
  "SlingFin": { minItems: 2, note: "SplitWing 2 UL" },
  "Sierra Designs": { minItems: 5, note: "High Route, Clip Flashlight" },
  "Warbonnet": { minItems: 8, note: "Hammocks, tarps, quilts" },
  "Dutchware": { minItems: 6, note: "Hammocks, tarps, accessories" },
  "ENO": { minItems: 2, note: "DoubleNest, Sub7" },

  // === SLEEP ===
  "Enlightened Equipment": { minItems: 8, note: "Enigma, Revelation, Convert, Accomplice" },
  "Katabatic": { minItems: 5, note: "Palisade, Sawatch, Bristlecone" },
  "Western Mountaineering": { minItems: 4, note: "NanoLite, UltraLite, Versalite" },
  "Hammock Gear": { minItems: 6, note: "Econ Burrow, Premium quilts, tarps" },
  "Nunatak": { minItems: 2, note: "Custom quilts" },
  "Timmermade": { minItems: 3, note: "Custom quilts" },
  "Feathered Friends": { minItems: 4, note: "Tanager, Swallow, Hummingbird" },
  "Underground Quilts": { minItems: 4, note: "Bandit, Zeppelin — budget quilts" },
  "Therm-a-Rest": { minItems: 12, note: "NeoAir line + Z Lite + bags" },
  "Exped": { minItems: 8, note: "Ultra pads + bags" },
  "Sea to Summit": { minItems: 10, note: "Pads + pillows + accessories" },
  "Cumulus": { minItems: 4, note: "European UL quilts/bags" },
  "Klymit": { minItems: 4, note: "Static V line — budget pads" },
  "Aegismax": { minItems: 4, note: "Ultra-budget down bags/quilts from China" },
  "Zenbivy": { minItems: 2, note: "Quilt/sheet system" },
  "Pajak": { minItems: 2, note: "Polish UL bags" },

  // === PACK ===
  "Osprey": { minItems: 12, note: "Exos, Levity, Aether, Talon" },
  "ULA": { minItems: 5, note: "Circuit, Catalyst, Photon, CDT" },
  "Gregory": { minItems: 6, note: "Focal, Zulu, Paragon" },
  "Granite Gear": { minItems: 3, note: "Crown series" },
  "Pa'lante": { minItems: 2, note: "V2, Simple Pack" },
  "Atom Packs": { minItems: 2, note: "Atom+, Mo" },
  "LiteAF": { minItems: 2, note: "Curve, Full Suspension" },
  "Waymark Gear Co": { minItems: 2, note: "THRU, MILE" },
  "Superior Wilderness Designs": { minItems: 2, note: "Long Haul, Packrun" },
  "Northern Ultralight": { minItems: 2, note: "Sundown — Canadian cottage" },
  "KS Ultralight": { minItems: 1, note: "KS-series packs" },
  "Zimmerbuilt": { minItems: 1, note: "QuickStep, Pika" },
  "Mystery Ranch": { minItems: 2, note: "Coulee, Bridger — trad crossover" },
  "Deuter": { minItems: 4, note: "Aircontact, Speed Lite — mainstream" },
  "Kelty": { minItems: 6, note: "Cosmic, Salida — gateway brand" },
  "3F UL Gear": { minItems: 4, note: "Budget packs + shelters from China" },

  // === KITCHEN ===
  "TOAKS": { minItems: 5, note: "Titanium pots/cups/sporks" },
  "Snow Peak": { minItems: 4, note: "Titanium cookware" },
  "Sawyer": { minItems: 4, note: "Squeeze, Mini, Micro, Tap" },
  "Platypus": { minItems: 4, note: "QuickDraw, Platy bottles" },
  "Katadyn": { minItems: 3, note: "BeFree, Hiker Pro" },
  "Jetboil": { minItems: 2, note: "Flash, MiniMo, Stash" },
  "BRS": { minItems: 2, note: "Budget canister stoves" },
  "SOTO": { minItems: 3, note: "Windmaster, Amicus" },
  "CNOC": { minItems: 3, note: "Vecto, Vesica — dirty water bags" },
  "Evernew": { minItems: 3, note: "Titanium pots — Japanese" },

  // === ELECTRONICS ===
  "Nitecore": { minItems: 6, note: "NU-series headlamps + chargers" },
  "Garmin": { minItems: 6, note: "inReach Mini/Explorer, Fenix, Instinct" },
  "COROS": { minItems: 3, note: "PACE, APEX, VERTIX" },
  "BioLite": { minItems: 2, note: "HeadLamp series" },
  "Petzl": { minItems: 3, note: "Actik, IKO, Swift RL" },
  "Black Diamond": { minItems: 10, note: "Headlamps, poles, gloves, shelters" },
  "Suunto": { minItems: 3, note: "GPS watches" },
  "Anker": { minItems: 3, note: "Power banks" },

  // === INSULATION & CLOTHING (accessories) ===
  "Patagonia": { minItems: 4, note: "Nano Puff, R1, Houdini, Torrentshell" },
  "Senchi Designs": { minItems: 3, note: "Alpha Direct fleece (Lark, Wren, Swift)" },
  "Melanzana": { minItems: 1, note: "Micro Grid Hoodie" },
  "Outdoor Research": { minItems: 3, note: "Helium rain, Foray, gloves" },
  "Frogg Toggs": { minItems: 2, note: "Budget rain gear" },
  "Arc'teryx": { minItems: 2, note: "Norvan, Cerium, Squamish" },
  "Mont-bell": { minItems: 3, note: "Versalite, UL Down, packs" },
  "Rab": { minItems: 2, note: "Xenon, Phantom — European UL" },
  "Mountain Hardwear": { minItems: 3, note: "Ghost Whisperer, Stretchdown" },

  // === SHOES & FEET ===
  "Altra": { minItems: 3, note: "Lone Peak, Olympus, Timp" },
  "Hoka": { minItems: 2, note: "Speedgoat, Challenger" },
  "Salomon": { minItems: 3, note: "Speedcross, Ultra Glide, X Ultra" },
  "La Sportiva": { minItems: 1, note: "Ultra Raptor" },
  "Darn Tough": { minItems: 2, note: "Hiker socks" },
  "Injinji": { minItems: 1, note: "Toe socks" },
  "Xero Shoes": { minItems: 2, note: "Minimalist trail shoes" },

  // === SAFETY & MISC ===
  "Adventure Medical Kits": { minItems: 4, note: "First aid kits" },
  "Ursack": { minItems: 2, note: "Bear bags" },
  "BearVault": { minItems: 3, note: "BV450, BV500 bear cans" },
  "Gear Aid": { minItems: 4, note: "Tenacious Tape, Seam Grip, repair" },
  "Leatherman": { minItems: 3, note: "Squirt, Signal, Skeletool" },

  // === ADDITIONAL REAL BRANDS ===
  "REI Co-op": { minItems: 10, note: "Flash tents, Trail Hut, packs, clothing" },
  "Marmot": { minItems: 4, note: "Tents, rain jackets, puffies" },
  "Borah Gear": { minItems: 4, note: "Cottage bivys, tarps, packs" },
  "The North Face": { minItems: 3, note: "Stormbreak, ThermoBall, bags" },
  "LEKI": { minItems: 3, note: "Premium trekking poles" },
  "Flextail": { minItems: 4, note: "Budget pads + pump accessories" },
  "Paria Outdoor Products": { minItems: 2, note: "Budget tarps, shelters" },
  "Cascade Mountain Tech": { minItems: 2, note: "Budget carbon poles (Costco)" },
  "Grayl": { minItems: 2, note: "Water purifier bottles" },
  "Outdoor Vitals": { minItems: 2, note: "Budget quilts/pads" },
  "Helinox": { minItems: 2, note: "Camp chairs — luxury item" },
  "Yama Mountain Gear": { minItems: 2, note: "Cottage tarps/shelters" },
  "Alpkit": { minItems: 2, note: "UK budget UL gear" },
  "Hyke & Byke": { minItems: 2, note: "Amazon budget sleeping bags" },
  "HydraPak": { minItems: 2, note: "Water storage/bladders" },
  "GSI Outdoors": { minItems: 3, note: "Cookware, cups, kitchen" },
  "Mountain House": { minItems: 6, note: "#1 freeze-dried backpacking food" },
  "Peak Refuel": { minItems: 4, note: "Premium backpacking food" },
  "Good To-Go": { minItems: 3, note: "Premium dehydrated meals" },
  "Backpacker's Pantry": { minItems: 3, note: "Backpacking food" },
  "Bearikade": { minItems: 2, note: "Premium carbon bear cans" },
  "Victorinox": { minItems: 2, note: "Swiss Army knives" },
  "Smartwool": { minItems: 2, note: "Merino socks/base layers" },
  "Sunday Afternoons": { minItems: 2, note: "Sun hats" },
  "Kahtoola": { minItems: 1, note: "MICROspikes traction" },
  "Vargo": { minItems: 2, note: "Titanium stoves/accessories" },
  "Trail Designs": { minItems: 2, note: "Alcohol stove systems (Caldera)" },
};

export default function BrandsPage() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"count" | "name">("count");
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [brandItems, setBrandItems] = useState<GearItemRow[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("gear_items").select("brand, category, subcategory");
      if (!data) { setLoading(false); return; }

      const brandMap = new Map<string, BrandInfo>();
      const catCounts: Record<string, number> = {};

      data.forEach((row) => {
        const b = row.brand;
        if (!brandMap.has(b)) {
          brandMap.set(b, { brand: b, count: 0, categories: {}, subcategories: [] });
        }
        const info = brandMap.get(b)!;
        info.count++;
        info.categories[row.category] = (info.categories[row.category] || 0) + 1;
        if (row.subcategory && !info.subcategories.includes(row.subcategory)) {
          info.subcategories.push(row.subcategory);
        }
        catCounts[row.category] = (catCounts[row.category] || 0) + 1;
      });

      setStats({
        total: data.length,
        byCategory: catCounts,
        brands: Array.from(brandMap.values()),
      });
      setLoading(false);
    }
    load();
  }, []);

  async function handleExpandBrand(brand: string) {
    if (expandedBrand === brand) {
      setExpandedBrand(null);
      setBrandItems([]);
      return;
    }
    setExpandedBrand(brand);
    setLoadingItems(true);
    const { data } = await supabase
      .from("gear_items")
      .select("id, name, brand, category, subcategory, weight_oz, price_usd, tier")
      .eq("brand", brand)
      .order("category")
      .order("weight_oz");
    setBrandItems(data || []);
    setLoadingItems(false);
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const filtered = stats.brands
    .filter((b) => b.brand.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "count" ? b.count - a.count : a.brand.localeCompare(b.brand));

  // Check for missing/underrepresented brands
  const missingBrands = Object.entries(EXPECTED_BRANDS).filter(
    ([name]) => !stats.brands.some((b) => b.brand.toLowerCase() === name.toLowerCase())
  );
  const underrepBrands = Object.entries(EXPECTED_BRANDS)
    .map(([name, expected]) => {
      const found = stats.brands.find((b) => b.brand.toLowerCase() === name.toLowerCase());
      if (!found) return null;
      if (found.count < expected.minItems) return { name, found: found.count, expected: expected.minItems, note: expected.note };
      return null;
    })
    .filter(Boolean);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">Brand Coverage</h1>
            <span className="rounded border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              Admin
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Database health dashboard. {stats.total} items across {stats.brands.length} brands. Click a brand to see all items.
          </p>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 mb-8">
          {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <div key={cat} className="glass rounded-lg border border-white/10 p-3 text-center">
              <p className="num text-lg font-semibold">{count}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{cat}</p>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {(missingBrands.length > 0 || underrepBrands.length > 0) && (
          <div className="glass rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-5 mb-8">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-yellow-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="size-3.5" />
              Coverage Gaps ({missingBrands.length} missing, {underrepBrands.length} underrepresented)
            </h2>

            {missingBrands.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-destructive mb-2">Missing brands ({missingBrands.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                  {missingBrands.map(([name, info]) => (
                    <div key={name} className="text-xs flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground">— {info.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {underrepBrands.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-yellow-400 mb-2">Underrepresented ({underrepBrands.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                  {underrepBrands.map((item) => item && (
                    <div key={item.name} className="text-xs flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-yellow-400 shrink-0" />
                      <span className="font-medium">{item.name}</span>
                      <span className="num text-muted-foreground">{item.found}/{item.expected}</span>
                      <span className="text-muted-foreground">— {item.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search + Sort */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands..."
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <button
            onClick={() => setSortBy(sortBy === "count" ? "name" : "count")}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sort: {sortBy === "count" ? "by count" : "A-Z"}
          </button>
          <span className="num text-xs text-muted-foreground">{filtered.length} brands</span>
        </div>

        {/* Brand list */}
        <div className="flex flex-col gap-2">
          {filtered.map((brand) => {
            const expected = Object.entries(EXPECTED_BRANDS).find(([name]) => name.toLowerCase() === brand.brand.toLowerCase());
            const expectedInfo = expected ? expected[1] : null;
            const isGood = !expectedInfo || brand.count >= expectedInfo.minItems;
            const isLow = expectedInfo && brand.count < expectedInfo.minItems;
            const isExpanded = expandedBrand === brand.brand;

            return (
              <div key={brand.brand}>
                <button
                  type="button"
                  onClick={() => handleExpandBrand(brand.brand)}
                  className={cn(
                    "w-full glass rounded-lg border p-4 transition-colors text-left flex items-center gap-4",
                    isLow ? "border-yellow-400/20 hover:border-yellow-400/40" : "border-white/10 hover:border-white/20",
                    isExpanded && "border-primary/40 bg-primary/5"
                  )}
                >
                  {isExpanded ? <ChevronDown className="size-4 text-primary shrink-0" /> : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{brand.brand}</p>
                      {expectedInfo && (
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">— {expectedInfo.note}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(brand.categories).map(([cat, count]) => (
                        <span key={cat} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-muted-foreground">
                          {cat} <span className="num">{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="num text-lg font-bold text-primary">{brand.count}</span>
                    {expectedInfo && <span className="num text-xs text-muted-foreground">/{expectedInfo.minItems}</span>}
                    {isGood && expectedInfo && <CheckCircle className="size-4 text-primary" />}
                    {isLow && <AlertTriangle className="size-4 text-yellow-400" />}
                  </div>
                </button>

                {/* Expanded item list */}
                {isExpanded && (
                  <div className="ml-8 mt-1 mb-2 rounded-lg border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                    {loadingItems ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.05]">
                        <div className="grid grid-cols-[1fr_80px_70px_70px_90px] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium bg-white/[0.03]">
                          <span>Name</span>
                          <span>Category</span>
                          <span className="text-right">Weight</span>
                          <span className="text-right">Price</span>
                          <span className="text-right">Tier</span>
                        </div>
                        {brandItems.map((item) => (
                          <div key={item.id} className="grid grid-cols-[1fr_80px_70px_70px_90px] gap-2 px-4 py-2.5 text-sm hover:bg-white/[0.03] transition-colors items-center">
                            <div className="min-w-0">
                              <a href={`/gear/${item.id}`} className="truncate font-medium hover:text-primary transition-colors">{item.name}</a>
                              {item.subcategory && <p className="text-[10px] text-muted-foreground">{item.subcategory}</p>}
                            </div>
                            <span className="text-xs text-muted-foreground">{item.category}</span>
                            <span className="num text-xs text-right">{item.weight_oz}oz</span>
                            <span className="num text-xs text-right">${item.price_usd}</span>
                            <span className={cn(
                              "text-[10px] text-right font-medium uppercase",
                              item.tier === "premium" ? "text-purple-400" :
                              item.tier === "mid" ? "text-yellow-400" :
                              item.tier === "budget" ? "text-green-400" : "text-cyan-400"
                            )}>
                              {item.tier}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
