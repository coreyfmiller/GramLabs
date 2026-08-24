/**
 * HikeMind Database Expansion — Seed Script
 * 
 * Adds items across weak categories with full specs per our standards.
 * UL-leaning but covers all tiers so users building 15lb+ kits are served.
 * 
 * Usage: node scripts/seed-expansion.mjs
 * 
 * After running, follow up with:
 *   node scripts/enrich-database.mjs   (fill any gaps Gemini can catch)
 *   node scripts/audit-data.mjs        (verify 100% maintained)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
} catch { /* ignore */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── NEW ITEMS ──────────────────────────────────────────────────────────────

const NEW_ITEMS = [

  // ══════════════════════════════════════════════════════════════════════════
  // HAMMOCKS — filling out the ecosystem (budget + mid + premium)
  // ══════════════════════════════════════════════════════════════════════════

  // Budget hammocks
  { id: "wise-owl-outfitters-double", name: "DoubleOwl Hammock", brand: "Wise Owl Outfitters", category: "shelter", subcategory: "hammock", tier: "ultra-budget", weight_oz: 26, price_usd: 30, description: "Best-selling budget double hammock on Amazon. 400lb capacity, includes carabiners and tree straps.", capacity: 2, seasons: "3", fabric: "210D Nylon", fabric_denier: 210 },
  { id: "wise-owl-single", name: "SingleOwl Hammock", brand: "Wise Owl Outfitters", category: "shelter", subcategory: "hammock", tier: "ultra-budget", weight_oz: 16, price_usd: 26, description: "Compact single hammock. Good entry point for hammock camping.", capacity: 1, seasons: "3", fabric: "210D Nylon", fabric_denier: 210 },
  { id: "bear-butt-double", name: "Double Hammock", brand: "Bear Butt", category: "shelter", subcategory: "hammock", tier: "ultra-budget", weight_oz: 24, price_usd: 35, description: "Popular Amazon budget double with included straps.", capacity: 2, seasons: "3", fabric: "210D Parachute Nylon", fabric_denier: 210 },
  { id: "grand-trunk-ultralight", name: "Ultralight Hammock", brand: "Grand Trunk", category: "shelter", subcategory: "hammock", tier: "budget", weight_oz: 12, price_usd: 50, description: "Compact single hammock for weight-conscious backpackers on a budget.", capacity: 1, seasons: "3", fabric: "30D Ripstop Nylon", fabric_denier: 30 },
  { id: "grand-trunk-skeeter-beeter-pro", name: "Skeeter Beeter Pro", brand: "Grand Trunk", category: "shelter", subcategory: "hammock", tier: "budget", weight_oz: 28, price_usd: 80, description: "Hammock with integrated no-see-um mesh net. Great bug protection for 3-season.", capacity: 1, seasons: "3", fabric: "70D Nylon Taffeta", fabric_denier: 70 },
  { id: "kammok-roo-double", name: "Roo Double", brand: "Kammok", category: "shelter", subcategory: "hammock", tier: "mid", weight_oz: 22, price_usd: 75, description: "Premium feel double hammock with diamond ripstop and integrated stuff sack.", capacity: 2, seasons: "3", fabric: "40D Diamond Ripstop Nylon", fabric_denier: 40 },
  { id: "kammok-roo-single", name: "Roo Single", brand: "Kammok", category: "shelter", subcategory: "hammock", tier: "mid", weight_oz: 16, price_usd: 65, description: "Lightweight single with Kammok's quality construction.", capacity: 1, seasons: "3", fabric: "40D Diamond Ripstop Nylon", fabric_denier: 40 },
  { id: "kammok-mantis-ul", name: "Mantis UL", brand: "Kammok", category: "shelter", subcategory: "hammock", tier: "premium", weight_oz: 29, price_usd: 250, description: "All-in-one hammock tent system with integrated bug net and rainfly.", capacity: 1, seasons: "3", fabric: "20D Ripstop Nylon", fabric_denier: 20 },
  { id: "ridge-outdoor-gear-everest", name: "Everest Double", brand: "Ridge Outdoor Gear", category: "shelter", subcategory: "hammock", tier: "ultra-budget", weight_oz: 24, price_usd: 28, description: "Amazon's Choice budget double hammock. Solid entry-level option.", capacity: 2, seasons: "3", fabric: "210D Nylon", fabric_denier: 210 },
  { id: "onetigris-kompound-camp", name: "Kompound Camp Hammock", brand: "OneTigris", category: "shelter", subcategory: "hammock", tier: "budget", weight_oz: 20, price_usd: 60, description: "Budget hammock with detachable bug net. Popular for versatility.", capacity: 1, seasons: "3", fabric: "70D Ripstop Nylon", fabric_denier: 70 },
  { id: "dutchware-halfwit", name: "Halfwit Hammock", brand: "Dutchware", category: "shelter", subcategory: "hammock", tier: "premium", weight_oz: 14, price_usd: 155, description: "11ft gathered-end hammock with half-zip bug net integrated.", capacity: 1, seasons: "3", fabric: "Hexon 1.6", fabric_denier: 40 },
  { id: "warbonnet-ridgerunner-bridge", name: "RidgeRunner Bridge", brand: "Warbonnet", category: "shelter", subcategory: "hammock", tier: "premium", weight_oz: 30, price_usd: 210, description: "Flat-lay bridge hammock. Sleeps like a bed, not a banana. Cult following.", capacity: 1, seasons: "3", fabric: "1.6 oz Ripstop Nylon", fabric_denier: 40 },

  // Hammock suspension
  { id: "wise-owl-talon-straps", name: "Talon Hammock Straps", brand: "Wise Owl Outfitters", category: "accessories", subcategory: "hammock-suspension", tier: "ultra-budget", weight_oz: 12, price_usd: 15, description: "Budget daisy-chain straps. Heavy but cheap and functional." },
  { id: "kammok-python-10", name: "Python 10 Straps", brand: "Kammok", category: "accessories", subcategory: "hammock-suspension", tier: "mid", weight_oz: 11, price_usd: 35, description: "10ft straps with 18 attachment points each. Quick and easy setup." },
  { id: "grand-trunk-trunk-straps", name: "Trunk Straps", brand: "Grand Trunk", category: "accessories", subcategory: "hammock-suspension", tier: "budget", weight_oz: 14, price_usd: 20, description: "Simple loop straps for quick hammock setup." },

  // ══════════════════════════════════════════════════════════════════════════
  // BUDGET SHELTERS — the tents people actually start with
  // ══════════════════════════════════════════════════════════════════════════

  { id: "ozark-trail-2p-backpacking", name: "2-Person Backpacking Tent", brand: "Ozark Trail", category: "shelter", subcategory: "freestanding-tent", tier: "ultra-budget", weight_oz: 72, price_usd: 45, description: "Walmart's cheapest backpacking tent. Heavy but functional for beginners on a tight budget.", setup_type: "freestanding", floor_area: 27, peak_height: 40, fabric: "Polyester Taffeta", fabric_denier: 68, capacity: 2, seasons: "3", doors: 1, vestibule_area: 5 },
  { id: "ozark-trail-1p-backpacking", name: "1-Person Backpacking Tent", brand: "Ozark Trail", category: "shelter", subcategory: "freestanding-tent", tier: "ultra-budget", weight_oz: 52, price_usd: 35, description: "Cheapest legitimate solo backpacking tent. Gets people on trail.", setup_type: "freestanding", floor_area: 18, peak_height: 36, fabric: "Polyester Taffeta", fabric_denier: 68, capacity: 1, seasons: "3", doors: 1, vestibule_area: 3 },
  { id: "mountain-warehouse-backpacker-2", name: "Backpacker 2 Man Tent", brand: "Mountain Warehouse", category: "shelter", subcategory: "freestanding-tent", tier: "ultra-budget", weight_oz: 80, price_usd: 60, description: "International budget brand tent. Popular in UK/Canada.", setup_type: "freestanding", floor_area: 29, peak_height: 39, fabric: "Polyester", fabric_denier: 70, capacity: 2, seasons: "3", doors: 1, vestibule_area: 8 },
  { id: "coleman-sundome-3p", name: "Sundome 3-Person Tent", brand: "Coleman", category: "shelter", subcategory: "freestanding-tent", tier: "ultra-budget", weight_oz: 112, price_usd: 55, description: "Classic Coleman car/backpack crossover. Heavy but bulletproof and cheap.", setup_type: "freestanding", floor_area: 45, peak_height: 52, fabric: "68D Polyester", fabric_denier: 68, capacity: 3, seasons: "3", doors: 1, vestibule_area: 0 },
  { id: "teton-sports-mountain-ultra-2", name: "Mountain Ultra 2", brand: "Teton Sports", category: "shelter", subcategory: "freestanding-tent", tier: "budget", weight_oz: 64, price_usd: 100, description: "Budget-friendly backpacking tent with decent weight for the price.", setup_type: "freestanding", floor_area: 31, peak_height: 42, fabric: "Poly/Nylon Blend", fabric_denier: 68, capacity: 2, seasons: "3", doors: 2, vestibule_area: 10 },
  { id: "alps-mountaineering-lynx-2", name: "Lynx 2-Person", brand: "Alps Mountaineering", category: "shelter", subcategory: "freestanding-tent", tier: "budget", weight_oz: 82, price_usd: 90, description: "Popular Amazon mid-budget tent. Solid for the price, lots of headroom.", setup_type: "freestanding", floor_area: 32, peak_height: 46, fabric: "75D Polyester", fabric_denier: 75, capacity: 2, seasons: "3", doors: 2, vestibule_area: 12 },
  { id: "kelty-late-start-2", name: "Late Start 2", brand: "Kelty", category: "shelter", subcategory: "freestanding-tent", tier: "budget", weight_oz: 76, price_usd: 120, description: "Quick-corner freestanding tent. Easy setup for beginners.", setup_type: "freestanding", floor_area: 30, peak_height: 42, fabric: "68D Polyester", fabric_denier: 68, capacity: 2, seasons: "3", doors: 1, vestibule_area: 8 },
  { id: "onetigris-cosmitto-2p", name: "COSMITTO 2P Tent", brand: "OneTigris", category: "shelter", subcategory: "freestanding-tent", tier: "budget", weight_oz: 60, price_usd: 130, description: "Lightweight budget tent from OneTigris. Surprising quality for price.", setup_type: "freestanding", floor_area: 28, peak_height: 41, fabric: "20D Silnylon", fabric_denier: 20, capacity: 2, seasons: "3", doors: 2, vestibule_area: 10 },

  // ══════════════════════════════════════════════════════════════════════════
  // BUDGET PACKS — where most beginners start
  // ══════════════════════════════════════════════════════════════════════════

  { id: "ozark-trail-50l", name: "50L Backpacking Pack", brand: "Ozark Trail", category: "pack", subcategory: "thru-hike", tier: "ultra-budget", weight_oz: 56, price_usd: 35, description: "Walmart's entry pack. Heavy but gets beginners on trail for next to nothing.", volume: 50, frame_type: "framed", hip_belt: "integrated" },
  { id: "teton-sports-scout-3400", name: "Scout 3400", brand: "Teton Sports", category: "pack", subcategory: "thru-hike", tier: "ultra-budget", weight_oz: 62, price_usd: 60, description: "55L Amazon best-seller. Internal frame, rain cover included. First pack for thousands of hikers.", volume: 55, frame_type: "framed", hip_belt: "integrated" },
  { id: "teton-sports-explorer-4000", name: "Explorer 4000", brand: "Teton Sports", category: "pack", subcategory: "thru-hike", tier: "ultra-budget", weight_oz: 72, price_usd: 70, description: "65L budget hauler. For when beginners carry too much gear (they all do).", volume: 65, frame_type: "framed", hip_belt: "integrated" },
  { id: "mountain-warehouse-ventura-40l", name: "Ventura 40L", brand: "Mountain Warehouse", category: "pack", subcategory: "thru-hike", tier: "ultra-budget", weight_oz: 48, price_usd: 55, description: "International budget brand. Decent airflow back panel for the price.", volume: 40, frame_type: "framed", hip_belt: "integrated" },
  { id: "amazon-basics-55l", name: "55L Internal Frame Pack", brand: "Amazon Basics", category: "pack", subcategory: "thru-hike", tier: "ultra-budget", weight_oz: 64, price_usd: 45, description: "The literal cheapest option. Gets you on trail.", volume: 55, frame_type: "framed", hip_belt: "integrated" },
  { id: "outdoor-vitals-shadowlight-45", name: "Shadowlight 45", brand: "Outdoor Vitals", category: "pack", subcategory: "fast-light", tier: "budget", weight_oz: 28, price_usd: 130, description: "Budget ultralight option. DCF-like weight at a fraction of the cost.", volume: 45, frame_type: "frameless", hip_belt: "removable" },
  { id: "kelty-coyote-60", name: "Coyote 60", brand: "Kelty", category: "pack", subcategory: "thru-hike", tier: "budget", weight_oz: 68, price_usd: 170, description: "Well-built traditional pack. Good suspension for heavier loads.", volume: 60, frame_type: "framed", hip_belt: "integrated" },
  { id: "decathlon-forclaz-mt500-air-40l", name: "MT500 Air 40L", brand: "Decathlon", category: "pack", subcategory: "thru-hike", tier: "budget", weight_oz: 42, price_usd: 100, description: "Excellent weight-to-price ratio. Decathlon's serious backpacking entry.", volume: 40, frame_type: "framed", hip_belt: "integrated" },

  // ══════════════════════════════════════════════════════════════════════════
  // BUDGET SLEEP — bags and pads for beginners
  // ══════════════════════════════════════════════════════════════════════════

  { id: "ozark-trail-30f-synthetic", name: "30°F Synthetic Mummy Bag", brand: "Ozark Trail", category: "sleep", subcategory: "sleeping-bag", tier: "ultra-budget", weight_oz: 48, price_usd: 30, description: "Walmart's cheapest mummy bag. Heavy but warm enough for 3-season.", temp_rating: 30, fill_type: "synthetic", sleep_style: "mummy" },
  { id: "teton-sports-celsius-xxl-0f", name: "Celsius XXL 0°F", brand: "Teton Sports", category: "sleep", subcategory: "sleeping-bag", tier: "ultra-budget", weight_oz: 80, price_usd: 70, description: "Wide-body mummy for bigger hikers. Budget winter capability.", temp_rating: 0, fill_type: "synthetic", sleep_style: "semi-rectangular" },
  { id: "coleman-brazos-30f", name: "Brazos 30°F Sleeping Bag", brand: "Coleman", category: "sleep", subcategory: "sleeping-bag", tier: "ultra-budget", weight_oz: 56, price_usd: 35, description: "Basic rectangular bag. Not light, not warm, but $35.", temp_rating: 30, fill_type: "synthetic", sleep_style: "rectangular" },
  { id: "mountain-warehouse-trek-300", name: "Trek 300 Sleeping Bag", brand: "Mountain Warehouse", category: "sleep", subcategory: "sleeping-bag", tier: "ultra-budget", weight_oz: 44, price_usd: 50, description: "Budget mummy bag popular internationally. Decent warmth-to-price.", temp_rating: 35, fill_type: "synthetic", sleep_style: "mummy" },
  { id: "outdoor-vitals-summitx-20f", name: "Summit X 20°F", brand: "Outdoor Vitals", category: "sleep", subcategory: "sleeping-bag", tier: "budget", weight_oz: 38, price_usd: 140, description: "Budget down bag that punches above its weight. 650FP duck down.", temp_rating: 20, fill_type: "duck-down", fill_power: 650, sleep_style: "mummy" },
  { id: "aegismax-wind-hard-tiny", name: "Wind Hard Tiny", brand: "Aegismax", category: "sleep", subcategory: "sleeping-bag", tier: "ultra-budget", weight_oz: 22, price_usd: 80, description: "Ultra-cheap Chinese down bag. Surprisingly light for the price. Summer use.", temp_rating: 40, fill_type: "goose-down", fill_power: 800, sleep_style: "mummy" },
  { id: "ozark-trail-sleeping-pad-self", name: "Self-Inflating Sleeping Pad", brand: "Ozark Trail", category: "sleep", subcategory: "pad-inflatable", tier: "ultra-budget", weight_oz: 34, price_usd: 20, description: "Cheapest sleeping pad option. Heavy but functional.", r_value: 2.5, thickness: 1.5, pad_width: 22, pad_length: 72 },
  { id: "klymit-static-v-luxe", name: "Static V Luxe", brand: "Klymit", category: "sleep", subcategory: "pad-inflatable", tier: "budget", weight_oz: 27, price_usd: 70, description: "Wide (30in) pad for restless sleepers. Great value.", r_value: 1.5, thickness: 3.0, pad_width: 30, pad_length: 76 },
  { id: "outdoor-vitals-ultralight-pad", name: "Ultralight Sleeping Pad", brand: "Outdoor Vitals", category: "sleep", subcategory: "pad-inflatable", tier: "budget", weight_oz: 16, price_usd: 80, description: "Budget lightweight inflatable with integrated pump.", r_value: 3.0, thickness: 2.5, pad_width: 20, pad_length: 72 },

  // ══════════════════════════════════════════════════════════════════════════
  // STOVES + COOKWARE — filling the ecosystem
  // ══════════════════════════════════════════════════════════════════════════

  // Integrated stove systems
  { id: "jetboil-minimo", name: "MiniMo", brand: "Jetboil", category: "kitchen", subcategory: "stove", tier: "mid", weight_oz: 14.6, price_usd: 145, description: "Best simmer control of any integrated system. Low profile, great for real cooking.", fuel_type: "canister", boil_time: 4.5, igniter: true, pot_included: true, simmer_control: true },
  { id: "msr-windburner-1l", name: "WindBurner 1.0L", brand: "MSR", category: "kitchen", subcategory: "stove", tier: "mid", weight_oz: 15.5, price_usd: 170, description: "Windproof enclosed burner. Performs in conditions that kill upright stoves.", fuel_type: "canister", boil_time: 4.5, igniter: true, pot_included: true, simmer_control: true },

  // Alcohol stoves
  { id: "trangia-spirit-burner", name: "Spirit Burner", brand: "Trangia", category: "kitchen", subcategory: "stove", tier: "budget", weight_oz: 3.5, price_usd: 20, description: "The original alcohol stove. Proven for decades. Brass construction.", fuel_type: "alcohol", boil_time: 8, igniter: false, pot_included: false, simmer_control: true },
  { id: "zelph-starlyte-stove", name: "StarLyte Stove", brand: "Zelph", category: "kitchen", subcategory: "stove", tier: "budget", weight_oz: 0.5, price_usd: 18, description: "Ultralight alcohol stove. Half an ounce. Used by serious gram-counters.", fuel_type: "alcohol", boil_time: 7, igniter: false, pot_included: false, simmer_control: false },
  { id: "evernew-titanium-alcohol-stove", name: "Titanium Alcohol Stove", brand: "Evernew", category: "kitchen", subcategory: "stove", tier: "premium", weight_oz: 1.1, price_usd: 42, description: "Japanese titanium alcohol stove. Featherweight, premium build.", fuel_type: "alcohol", boil_time: 6, igniter: false, pot_included: false, simmer_control: false },

  // Budget canister stoves
  { id: "ozark-trail-canister-stove", name: "Single Burner Backpacking Stove", brand: "Ozark Trail", category: "kitchen", subcategory: "stove", tier: "ultra-budget", weight_oz: 4, price_usd: 8, description: "Walmart BRS-3000T equivalent. Gets the job done for almost nothing.", fuel_type: "canister", boil_time: 4, igniter: false, pot_included: false, simmer_control: false },
  { id: "fire-maple-fms-116t", name: "FMS-116T Titanium Stove", brand: "Fire Maple", category: "kitchen", subcategory: "stove", tier: "budget", weight_oz: 1.7, price_usd: 30, description: "Budget titanium canister stove. Lighter than BRS, better pot support.", fuel_type: "canister", boil_time: 3.5, igniter: false, pot_included: false, simmer_control: true },

  // Cookware
  { id: "toaks-titanium-750ml", name: "Titanium 750ml Pot", brand: "TOAKS", category: "kitchen", subcategory: "cookware", tier: "mid", weight_oz: 3.5, price_usd: 35, description: "The standard UL titanium pot. Fits a 230g canister inside." },
  { id: "toaks-titanium-550ml", name: "Titanium 550ml Pot", brand: "TOAKS", category: "kitchen", subcategory: "cookware", tier: "mid", weight_oz: 2.8, price_usd: 30, description: "Solo mug/pot. Fits a 110g canister inside. Just enough for one meal." },
  { id: "toaks-titanium-1100ml", name: "Titanium 1100ml Pot", brand: "TOAKS", category: "kitchen", subcategory: "cookware", tier: "mid", weight_oz: 4.7, price_usd: 40, description: "Duo-friendly pot. Boils enough water for two freeze-dried meals." },
  { id: "stanley-adventure-cook-set", name: "Adventure Camp Cook Set", brand: "Stanley", category: "kitchen", subcategory: "cookware", tier: "ultra-budget", weight_oz: 12, price_usd: 20, description: "Stainless steel nesting set. Heavy but indestructible and cheap." },
  { id: "snow-peak-trek-900", name: "Trek 900 Titanium", brand: "Snow Peak", category: "kitchen", subcategory: "cookware", tier: "premium", weight_oz: 5.9, price_usd: 55, description: "Premium Japanese titanium. Slightly heavier than TOAKS but beautiful build." },
  { id: "sea-to-summit-x-pot-1.4l", name: "X-Pot 1.4L", brand: "Sea to Summit", category: "kitchen", subcategory: "cookware", tier: "mid", weight_oz: 6.2, price_usd: 50, description: "Collapsible silicone/aluminum pot. Packs flat. Great for groups." },

  // ══════════════════════════════════════════════════════════════════════════
  // GPS + SATELLITE — filling out communicators
  // ══════════════════════════════════════════════════════════════════════════

  { id: "garmin-inreach-messenger", name: "inReach Messenger", brand: "Garmin", category: "electronics", subcategory: "satellite", tier: "mid", weight_oz: 4, price_usd: 300, description: "Lightweight satellite communicator. Two-way messaging + SOS without the GPS mapping.", battery_type: "rechargeable", charge_method: "usb-c" },
  { id: "zoleo-satellite-communicator", name: "Satellite Communicator", brand: "ZOLEO", category: "electronics", subcategory: "satellite", tier: "mid", weight_oz: 5.3, price_usd: 200, description: "Budget satellite messenger. Pairs with phone for messaging. Cheapest subscription plans.", battery_type: "rechargeable", charge_method: "micro-usb" },
  { id: "spot-x-2-way-messenger", name: "X 2-Way Messenger", brand: "SPOT", category: "electronics", subcategory: "satellite", tier: "budget", weight_oz: 7, price_usd: 250, description: "Budget 2-way satellite with keyboard. Heavier but affordable subscription.", battery_type: "rechargeable", charge_method: "micro-usb" },
  { id: "acr-bivy-stick", name: "Bivy Stick", brand: "ACR", category: "electronics", subcategory: "satellite", tier: "mid", weight_oz: 4.2, price_usd: 350, description: "Compact satellite communicator with SOS. Iridium network.", battery_type: "rechargeable", charge_method: "usb-c" },

  // GPS handhelds
  { id: "garmin-gpsmap-67i", name: "GPSMAP 67i", brand: "Garmin", category: "electronics", subcategory: "satellite", tier: "premium", weight_oz: 8, price_usd: 600, description: "Full GPS + inReach satellite in one device. The gold standard for serious backcountry.", battery_type: "rechargeable", charge_method: "usb-c" },
  { id: "garmin-etrex-32x", name: "eTrex 32x", brand: "Garmin", category: "electronics", subcategory: "gps-watch", tier: "budget", weight_oz: 5, price_usd: 200, description: "Basic GPS handheld. AA batteries = infinite runtime. No satellite messaging.", battery_type: "AA", charge_method: "none" },

  // ══════════════════════════════════════════════════════════════════════════
  // BUDGET QUILTS + UNDERQUILTS — expanding sleep for the money-conscious
  // ══════════════════════════════════════════════════════════════════════════

  { id: "outdoor-vitals-stormloft-15", name: "StormLoft 15°F Quilt", brand: "Outdoor Vitals", category: "sleep", subcategory: "quilt", tier: "budget", weight_oz: 32, price_usd: 180, description: "Budget 800FP down quilt with differential cut. Legit UL quilt for cheap.", temp_rating: 15, fill_type: "goose-down", fill_power: 800, sleep_style: "quilt" },
  { id: "outdoor-vitals-stormloft-30", name: "StormLoft 30°F Quilt", brand: "Outdoor Vitals", category: "sleep", subcategory: "quilt", tier: "budget", weight_oz: 22, price_usd: 150, description: "Summer/shoulder-season budget quilt. Surprising quality for price.", temp_rating: 30, fill_type: "goose-down", fill_power: 800, sleep_style: "quilt" },
  { id: "aegismax-ul-quilt-40f", name: "UL Down Quilt 40°F", brand: "Aegismax", category: "sleep", subcategory: "quilt", tier: "ultra-budget", weight_oz: 15, price_usd: 65, description: "Chinese ultralight quilt. The value king for summer use. 800FP goose down.", temp_rating: 40, fill_type: "goose-down", fill_power: 800, sleep_style: "quilt" },
  { id: "paria-thermodown-15", name: "Thermodown 15°F Quilt", brand: "Paria Outdoor", category: "sleep", subcategory: "quilt", tier: "budget", weight_oz: 35, price_usd: 140, description: "Budget down quilt with 700FP down. Best value for cold-weather quilting.", temp_rating: 15, fill_type: "duck-down", fill_power: 700, sleep_style: "quilt" },
  { id: "hammock-gear-econ-phoenix-40", name: "Econ Phoenix 40°F Underquilt", brand: "Hammock Gear", category: "sleep", subcategory: "underquilt", tier: "budget", weight_oz: 12, price_usd: 110, description: "Budget summer underquilt. 800FP down at a fraction of premium price.", temp_rating: 40, fill_type: "goose-down", fill_power: 800 },
  { id: "onetigris-underquilt-40f", name: "Night Protector UQ 40°F", brand: "OneTigris", category: "sleep", subcategory: "underquilt", tier: "ultra-budget", weight_oz: 18, price_usd: 60, description: "Budget hammock underquilt. Synthetic fill. Good entry into hammock insulation.", temp_rating: 40, fill_type: "synthetic" },

  // ══════════════════════════════════════════════════════════════════════════
  // MISSING MUST-HAVES from gap analysis
  // ══════════════════════════════════════════════════════════════════════════

  { id: "tarptent-stratospire-2", name: "Stratospire 2", brand: "Tarptent", category: "shelter", subcategory: "trekking-pole-tent", tier: "mid", weight_oz: 34, price_usd: 329, description: "Roomy 2-person trekking pole tent. More livable than the Li version.", setup_type: "non-freestanding", floor_area: 35, peak_height: 48, fabric: "20D Silnylon", fabric_denier: 20, capacity: 2, seasons: "3", doors: 2, vestibule_area: 20 },
  { id: "gossamer-gear-nightlight", name: "NightLight Sleeping Pad", brand: "Gossamer Gear", category: "sleep", subcategory: "pad-foam", tier: "premium", weight_oz: 4.5, price_usd: 60, description: "Torso-length air pad + foam combo. Ultra minimalist sleep system.", r_value: 1.6, thickness: 0.5 },
  { id: "zpacks-20f-classic-quilt-2", name: "20°F Classic Quilt", brand: "Zpacks", category: "sleep", subcategory: "quilt", tier: "premium", weight_oz: 19.4, price_usd: 399, description: "Zpacks flagship quilt. 900FP down, snaps and drawcord closure.", temp_rating: 20, fill_type: "goose-down", fill_power: 900, sleep_style: "quilt" },

  // ══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL BUDGET ACCESSORIES — things beginners buy
  // ══════════════════════════════════════════════════════════════════════════

  { id: "ozark-trail-trekking-poles", name: "Aluminum Trekking Poles (Pair)", brand: "Ozark Trail", category: "accessories", subcategory: "trekking-poles", tier: "ultra-budget", weight_oz: 22, price_usd: 15, description: "Walmart trekking poles. Not light, not fancy, $15.", pole_material: "aluminum", collapsed_length: 26, lock_type: "twist", grip_material: "rubber" },
  { id: "naturehike-carbon-poles", name: "Carbon Fiber Trekking Poles", brand: "Naturehike", category: "accessories", subcategory: "trekking-poles", tier: "budget", weight_oz: 13, price_usd: 55, description: "Budget carbon poles. Shockingly good for the price.", pole_material: "carbon", collapsed_length: 15, lock_type: "z-fold", grip_material: "cork" },
  { id: "mountain-warehouse-trekking-poles", name: "Walking Poles (Pair)", brand: "Mountain Warehouse", category: "accessories", subcategory: "trekking-poles", tier: "ultra-budget", weight_oz: 20, price_usd: 25, description: "Basic budget poles from international brand.", pole_material: "aluminum", collapsed_length: 24, lock_type: "twist", grip_material: "rubber" },

  // Rain gear
  { id: "frogg-toggs-xtreme-lite", name: "Xtreme Lite Rain Jacket", brand: "Frogg Toggs", category: "accessories", subcategory: "rain-gear", tier: "ultra-budget", weight_oz: 5.5, price_usd: 30, description: "Upgraded UltraLite. Still disposable-cheap but less crinkly.", waterproof: true },
  { id: "outdoor-research-helium-rain", name: "Helium Rain Jacket", brand: "Outdoor Research", category: "accessories", subcategory: "rain-gear", tier: "mid", weight_oz: 6.4, price_usd: 160, description: "Premium ultralight rain shell. Pertex Shield, pit zips, real hood.", waterproof: true },
  { id: "mountain-warehouse-pakka-jacket", name: "Pakka Waterproof Jacket", brand: "Mountain Warehouse", category: "accessories", subcategory: "rain-gear", tier: "ultra-budget", weight_oz: 8, price_usd: 30, description: "Cheap waterproof shell. Packable. Gets the job done for casual hikers.", waterproof: true },

  // ══════════════════════════════════════════════════════════════════════════
  // WATER FILTERS — budget options
  // ══════════════════════════════════════════════════════════════════════════

  { id: "lifestraw-personal", name: "Personal Water Filter", brand: "LifeStraw", category: "kitchen", subcategory: "water-filter", tier: "ultra-budget", weight_oz: 2, price_usd: 15, description: "The most basic filter. Drink directly from source. No gravity option." },
  { id: "survivor-filter-pro", name: "Pro", brand: "Survivor Filter", category: "kitchen", subcategory: "water-filter", tier: "budget", weight_oz: 6.4, price_usd: 40, description: "Inline pump filter. 0.01 micron. Heavier but filters viruses too." },
  { id: "hydroblu-versa-flow-plus", name: "Versa Flow Plus", brand: "HydroBlu", category: "kitchen", subcategory: "water-filter", tier: "budget", weight_oz: 2.6, price_usd: 25, description: "Budget Sawyer Squeeze alternative. Lighter, cheaper, shorter lifespan." },
];

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 HikeMind Database Expansion');
  console.log(`   Items to add: ${NEW_ITEMS.length}\n`);

  // Check for duplicates
  const ids = NEW_ITEMS.map(i => i.id);
  const { data: existing } = await supabase
    .from('gear_items')
    .select('id')
    .in('id', ids);

  const existingIds = new Set((existing || []).map(e => e.id));
  const toInsert = NEW_ITEMS.filter(i => !existingIds.has(i.id));
  const skipped = NEW_ITEMS.length - toInsert.length;

  if (skipped > 0) {
    console.log(`⚠️  Skipping ${skipped} items (already exist)`);
  }

  if (toInsert.length === 0) {
    console.log('✅ All items already in database. Nothing to do.');
    return;
  }

  // Insert in batches of 50
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    const { error } = await supabase.from('gear_items').insert(batch);
    if (error) {
      console.error(`❌ Batch error at ${i}: ${error.message}`);
      // Try one-by-one to find the problem
      for (const item of batch) {
        const { error: singleErr } = await supabase.from('gear_items').insert(item);
        if (singleErr) {
          console.error(`   ❌ ${item.brand} ${item.name}: ${singleErr.message}`);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
      process.stdout.write(`✅ Inserted batch ${Math.floor(i / 50) + 1} (${batch.length} items)\n`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 RESULTS`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Total:    ${inserted + skipped}`);
  console.log(`${'='.repeat(50)}`);
  console.log('\n📋 Next steps:');
  console.log('   node scripts/enrich-database.mjs   (fill remaining specs)');
  console.log('   node scripts/audit-data.mjs        (verify 100%)');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
