/**
 * Extended specs for gear items.
 * These are merged into the gear database at runtime.
 * Sourced from: manufacturer specs, PCT 2025 survey (790 hikers), OutdoorGearLab, SectionHiker
 */

import { GearItem } from "./gear-database";

type PartialSpecs = Partial<Omit<GearItem, "id" | "name" | "brand" | "category" | "tier" | "weightOz" | "priceUsd" | "description">>;

export const gearSpecs: Record<string, PartialSpecs> = {
  // ═══════════════════════════════════════════════════════════════
  // SHELTERS — Verified from manufacturer sites + PCT survey
  // ═══════════════════════════════════════════════════════════════

  "zpacks-duplex": {
    floorArea: 28.1,
    peakHeight: 48,
    packedSize: "5x7 in",
    setupType: "non-freestanding",
    shelterType: "trekking-pole-tent",
    capacity: 2,
    poleType: "trekking",
    fabric: "DCF 0.55 oz/sqyd",
    fabricDenier: 7,
    stakesNeeded: 8,
    seasons: "3",
    doors: 2,
    vestibuleArea: 17.5,
    communityRating: 8.86,
  },

  "tarptent-notch-li": {
    floorArea: 22,
    peakHeight: 40,
    packedSize: "4.5x15 in",
    setupType: "non-freestanding",
    shelterType: "trekking-pole-tent",
    capacity: 1,
    poleType: "trekking",
    fabric: "DCF 0.55 oz/sqyd",
    fabricDenier: 7,
    stakesNeeded: 6,
    seasons: "3",
    doors: 2,
    vestibuleArea: 9,
  },

  "gossamer-gear-one": {
    floorArea: 15.75,
    peakHeight: 48,
    setupType: "non-freestanding",
    capacity: 1,
    poleType: "trekking",
    fabric: "Silnylon 30D",
    fabricDenier: 30,
    stakesNeeded: 6,
    seasons: "3",
    doors: 1,
    communityRating: 8.32,
  },

  "hmg-unbound-2p": {
    floorArea: 30,
    peakHeight: 42,
    setupType: "freestanding",
    capacity: 2,
    poleType: "dedicated",
    fabric: "DCF 8",
    fabricDenier: 8,
    stakesNeeded: 0,
    seasons: "3+",
    doors: 2,
    vestibuleArea: 12,
    communityRating: 7.67,
  },

  "sixmoon-lunar-solo": {
    floorArea: 26.25,
    peakHeight: 48,
    setupType: "non-freestanding",
    capacity: 1,
    poleType: "trekking",
    fabric: "Silnylon 20D",
    fabricDenier: 20,
    stakesNeeded: 6,
    seasons: "3",
    doors: 1,
    communityRating: 7.80,
  },

  "3ful-lanshan-2-pro": {
    floorArea: 27,
    peakHeight: 43,
    setupType: "non-freestanding",
    capacity: 2,
    poleType: "trekking",
    fabric: "Silnylon 15D",
    fabricDenier: 15,
    stakesNeeded: 8,
    seasons: "3",
    doors: 2,
  },

  "3ful-lanshan-1": {
    floorArea: 18,
    peakHeight: 41,
    setupType: "non-freestanding",
    capacity: 1,
    poleType: "trekking",
    fabric: "Silnylon 15D",
    fabricDenier: 15,
    stakesNeeded: 6,
    seasons: "3",
    doors: 1,
  },

  "naturehike-cloud-up-2": {
    floorArea: 28,
    peakHeight: 39,
    setupType: "freestanding",
    capacity: 2,
    poleType: "dedicated",
    fabric: "Silnylon 20D",
    fabricDenier: 20,
    stakesNeeded: 0,
    seasons: "3",
    doors: 2,
  },

  "durston-xmid-pro-1": {
    floorArea: 20,
    peakHeight: 45,
    packedSize: "4x16 in",
    setupType: "non-freestanding",
    capacity: 1,
    poleType: "trekking",
    fabric: "DCF 0.55 oz/sqyd",
    fabricDenier: 7,
    stakesNeeded: 4,
    seasons: "3",
    doors: 2,
    vestibuleArea: 22,
    communityRating: 7.97,
    pctUsagePercent: 12.1,
  },

  "durston-xmid-1": {
    floorArea: 21.3,
    peakHeight: 45,
    setupType: "non-freestanding",
    capacity: 1,
    poleType: "trekking",
    fabric: "Silpoly 20D",
    fabricDenier: 20,
    stakesNeeded: 4,
    seasons: "3",
    doors: 2,
    vestibuleArea: 22,
    communityRating: 8.35,
  },

  "durston-xmid-pro-2": {
    floorArea: 28.75,
    peakHeight: 45,
    setupType: "non-freestanding",
    capacity: 2,
    poleType: "trekking",
    fabric: "DCF 0.55 oz/sqyd",
    fabricDenier: 7,
    stakesNeeded: 4,
    seasons: "3",
    doors: 2,
    vestibuleArea: 22,
    communityRating: 8.07,
  },

  "durston-xmid-2": {
    floorArea: 33.2,
    peakHeight: 45,
    setupType: "non-freestanding",
    capacity: 2,
    poleType: "trekking",
    fabric: "Silpoly 20D",
    fabricDenier: 20,
    stakesNeeded: 4,
    seasons: "3",
    doors: 2,
    vestibuleArea: 22,
    communityRating: 7.53,
  },

  "big-agnes-copper-spur-ul2": {
    floorArea: 29,
    peakHeight: 40,
    packedSize: "6x20 in",
    setupType: "freestanding",
    capacity: 2,
    poleType: "dedicated",
    fabric: "Silnylon/Ripstop",
    fabricDenier: 15,
    stakesNeeded: 0,
    seasons: "3",
    doors: 2,
    vestibuleArea: 17,
    communityRating: 8.77,
  },

  "big-agnes-tiger-wall-ul2": {
    floorArea: 28,
    peakHeight: 39,
    setupType: "semi-freestanding",
    capacity: 2,
    poleType: "dedicated",
    fabric: "Silnylon/Ripstop",
    fabricDenier: 15,
    stakesNeeded: 2,
    seasons: "3",
    doors: 2,
    vestibuleArea: 14,
    communityRating: 8.75,
  },

  "nemo-hornet-osmo-2p": {
    floorArea: 27.7,
    peakHeight: 38,
    setupType: "semi-freestanding",
    capacity: 2,
    poleType: "dedicated",
    fabric: "OSMO Ripstop 15D/20D",
    fabricDenier: 15,
    stakesNeeded: 2,
    seasons: "3",
    doors: 2,
    vestibuleArea: 14,
    communityRating: 8.77,
  },

  "nemo-hornet-osmo-1p": {
    floorArea: 20.6,
    peakHeight: 36,
    setupType: "semi-freestanding",
    capacity: 1,
    poleType: "dedicated",
    fabric: "OSMO Ripstop 15D/20D",
    fabricDenier: 15,
    stakesNeeded: 2,
    seasons: "3",
    doors: 1,
    communityRating: 8.64,
  },

  "zpacks-plex-solo": {
    floorArea: 20.6,
    peakHeight: 52,
    packedSize: "4x6 in",
    setupType: "non-freestanding",
    capacity: 1,
    poleType: "trekking",
    fabric: "DCF 0.55 oz/sqyd",
    fabricDenier: 7,
    stakesNeeded: 6,
    seasons: "3",
    doors: 1,
    vestibuleArea: 8,
    communityRating: 8.43,
  },

  "big-agnes-copper-spur-ul1": {
    floorArea: 20,
    peakHeight: 37,
    setupType: "freestanding",
    capacity: 1,
    poleType: "dedicated",
    fabric: "Silnylon/Ripstop",
    fabricDenier: 15,
    stakesNeeded: 0,
    seasons: "3",
    doors: 1,
    vestibuleArea: 8.5,
    communityRating: 8.33,
  },

  // Ultra-budget shelters
  "flames-creed-lanshan-1": {
    floorArea: 18,
    peakHeight: 43,
    setupType: "non-freestanding",
    capacity: 1,
    poleType: "trekking",
    fabric: "Silnylon 15D",
    fabricDenier: 15,
    stakesNeeded: 6,
    seasons: "3",
    doors: 1,
  },

  "naturehike-vik-1": {
    floorArea: 17,
    peakHeight: 37,
    setupType: "non-freestanding",
    capacity: 1,
    poleType: "dedicated",
    fabric: "Silnylon 15D",
    fabricDenier: 15,
    stakesNeeded: 4,
    seasons: "3",
    doors: 1,
  },

  "naturehike-star-trail-ext": {
    floorArea: 19,
    peakHeight: 38,
    setupType: "non-freestanding",
    capacity: 1,
    poleType: "dedicated",
    fabric: "Silnylon 15D",
    fabricDenier: 15,
    stakesNeeded: 4,
    seasons: "3",
    doors: 1,
  },

  "3ful-floating-cloud-tarp": {
    floorArea: 50,
    peakHeight: 55,
    setupType: "tarp",
    capacity: 2,
    poleType: "trekking",
    fabric: "Silnylon 15D",
    fabricDenier: 15,
    stakesNeeded: 6,
    seasons: "3",
    doors: 0,
  },

  // ═══════════════════════════════════════════════════════════════
  // SLEEP SYSTEM (quilts/bags) — PCT survey + manufacturer data
  // ═══════════════════════════════════════════════════════════════

  "katabatic-palisade": {
    fillPower: 900,
    fillWeight: 16,
    fillType: "goose-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: true,
    communityRating: 9.40,
  },

  "enlightened-enigma-20": {
    fillPower: 950,
    fillWeight: 13.83,
    fillType: "duck-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: true,
    communityRating: 9.07,
    pctUsagePercent: 15.2,
  },

  "nunatak-arc-ul-20": {
    fillPower: 950,
    fillWeight: 14,
    fillType: "goose-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: true,
  },

  "katabatic-sawatch-15": {
    fillPower: 900,
    fillWeight: 16.6,
    fillType: "goose-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: true,
    communityRating: 9.40,
  },

  "katabatic-flex-22": {
    fillPower: 900,
    fillWeight: 14.3,
    fillType: "goose-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: true,
    communityRating: 9.29,
  },

  "ee-revelation-20": {
    fillPower: 950,
    fillWeight: 14.4,
    fillType: "duck-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: true,
    communityRating: 9.00,
  },

  "feathered-friends-flicker-ul-20": {
    fillPower: 950,
    fillWeight: 14.7,
    fillType: "goose-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: false,
    communityRating: 9.25,
  },

  "rei-magma-15": {
    fillPower: 850,
    fillWeight: 23.3,
    fillType: "goose-down",
    sleepStyle: "mummy",
    sleepWidth: "regular",
    padAttachment: false,
    communityRating: 8.79,
  },

  "western-mountaineering-versalite-10": {
    fillPower: 850,
    fillWeight: 20,
    fillType: "goose-down",
    sleepStyle: "mummy",
    sleepWidth: "regular",
    padAttachment: false,
    communityRating: 9.30,
  },

  "sea-to-summit-spark-15": {
    fillPower: 850,
    fillWeight: 16.9,
    fillType: "goose-down",
    sleepStyle: "mummy",
    sleepWidth: "regular",
    padAttachment: false,
    communityRating: 9.36,
  },

  "underground-quilts-bandit-20": {
    fillPower: 950,
    fillWeight: 14.51,
    fillType: "goose-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: true,
    communityRating: 9.07,
  },

  "hammock-gear-econ-burrow-20": {
    fillPower: 800,
    fillWeight: 13.5,
    fillType: "duck-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: true,
  },

  "paria-thermodown-15": {
    fillPower: 700,
    fillWeight: 18,
    fillType: "goose-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: true,
  },

  "paria-thermodown-30": {
    fillPower: 700,
    fillWeight: 14,
    fillType: "goose-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: true,
  },

  "aegismax-nano2-800fp": {
    fillPower: 800,
    fillWeight: 12,
    fillType: "goose-down",
    sleepStyle: "mummy",
    sleepWidth: "regular",
    padAttachment: false,
  },

  "kamperbox-800fp-quilt": {
    fillPower: 800,
    fillWeight: 8.8,
    fillType: "duck-down",
    sleepStyle: "quilt",
    sleepWidth: "regular",
    padAttachment: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // SLEEP PADS — manufacturer specs + survey
  // ═══════════════════════════════════════════════════════════════

  "thermarest-xlite-nxt": {
    thickness: 3,
    padShape: "mummy",
    inflationMethod: "breath",
    padWidth: 20,
    padLength: 72,
    communityRating: 8.57,
    pctUsagePercent: 35.5,
  },

  "nemo-tensor-regular": {
    thickness: 3.5,
    padShape: "rectangular",
    inflationMethod: "breath",
    padWidth: 20,
    padLength: 72,
  },

  "nemo-tensor-all-season": {
    thickness: 3.5,
    padShape: "rectangular",
    inflationMethod: "breath",
    padWidth: 20,
    padLength: 72,
    communityRating: 9.00,
  },

  "nemo-tensor-extreme-conditions": {
    thickness: 3.5,
    padShape: "mummy",
    inflationMethod: "breath",
    padWidth: 20,
    padLength: 72,
    communityRating: 9.57,
  },

  "thermarest-xtherm-nxt": {
    thickness: 3,
    padShape: "mummy",
    inflationMethod: "breath",
    padWidth: 20,
    padLength: 72,
    communityRating: 7.85,
  },

  "thermarest-uberlite": {
    thickness: 2.5,
    padShape: "mummy",
    inflationMethod: "breath",
    padWidth: 20,
    padLength: 72,
  },

  "exped-ultra-3r": {
    thickness: 3,
    padShape: "rectangular",
    inflationMethod: "breath",
    padWidth: 20,
    padLength: 72,
    communityRating: 9.20,
  },

  "flextail-zero-pad-r05-mummy": {
    thickness: 3,
    padShape: "mummy",
    inflationMethod: "breath",
    padWidth: 20,
    padLength: 72,
  },

  "nemo-switchback": {
    thickness: 0.9,
    padShape: "mummy",
    inflationMethod: "none",
    padWidth: 20,
    padLength: 72,
    communityRating: 7.85,
  },

  "thermarest-zlite-sol": {
    thickness: 0.75,
    padShape: "mummy",
    inflationMethod: "none",
    padWidth: 20,
    padLength: 72,
    communityRating: 7.96,
  },

  // ═══════════════════════════════════════════════════════════════
  // PACKS — PCT survey + manufacturer
  // ═══════════════════════════════════════════════════════════════

  "ula-circuit": {
    maxCarryWeight: 35,
    frameType: "framed",
    frameMaterial: "aluminum",
    packFabric: "Robic nylon",
    hipBelt: "integrated",
    waterBottleAccess: "side",
    communityRating: 8.34,
    pctUsagePercent: 14.2,
  },

  "durston-kakwa-55": {
    maxCarryWeight: 45,
    frameType: "frameless",
    packFabric: "DCF/VX21",
    hipBelt: "removable",
    waterBottleAccess: "side",
    communityRating: 7.69,
  },

  "hmg-southwest-55": {
    maxCarryWeight: 40,
    frameType: "framed",
    frameMaterial: "aluminum",
    packFabric: "DCF",
    hipBelt: "integrated",
    waterBottleAccess: "side",
    communityRating: 8.36,
  },

  "gossamer-gear-mariposa": {
    maxCarryWeight: 35,
    frameType: "framed",
    frameMaterial: "aluminum",
    packFabric: "Robic nylon",
    hipBelt: "integrated",
    waterBottleAccess: "side",
    communityRating: 7.82,
  },

  "atom-packs-prospector": {
    maxCarryWeight: 42,
    frameType: "framed",
    frameMaterial: "carbon",
    packFabric: "VX21/Gridstop",
    hipBelt: "integrated",
    waterBottleAccess: "side",
    communityRating: 9.03,
  },

  "osprey-exos-58": {
    maxCarryWeight: 35,
    frameType: "framed",
    frameMaterial: "aluminum",
    packFabric: "Nylon ripstop",
    hipBelt: "integrated",
    waterBottleAccess: "side",
    communityRating: 8.44,
  },

  "zpacks-arc-haul": {
    maxCarryWeight: 35,
    frameType: "framed",
    frameMaterial: "carbon",
    packFabric: "DCF",
    hipBelt: "integrated",
    waterBottleAccess: "side",
    communityRating: 6.88,
  },

  // ═══════════════════════════════════════════════════════════════
  // STOVES — manufacturer specs
  // ═══════════════════════════════════════════════════════════════

  "brs-3000t": {
    fuelType: "canister",
    boilTime: 4.5,
    igniter: false,
    potIncluded: false,
    simmerControl: false,
    communityRating: 8.80,
  },

  "msr-pocketrocket-2": {
    fuelType: "canister",
    boilTime: 3.5,
    igniter: false,
    potIncluded: false,
    simmerControl: true,
    communityRating: 9.11,
  },

  "soto-windmaster": {
    fuelType: "canister",
    boilTime: 3,
    igniter: false,
    potIncluded: false,
    simmerControl: true,
    communityRating: 9.26,
  },

  "soto-amicus": {
    fuelType: "canister",
    boilTime: 3.5,
    igniter: false,
    potIncluded: false,
    simmerControl: true,
    communityRating: 9.29,
  },

  "jetboil-stash": {
    fuelType: "canister",
    boilTime: 2.5,
    igniter: false,
    potIncluded: true,
    simmerControl: true,
    communityRating: 9.39,
  },

  "msr-pocketrocket-deluxe": {
    fuelType: "canister",
    boilTime: 3.5,
    igniter: true,
    potIncluded: false,
    simmerControl: true,
    communityRating: 9.18,
  },

  // ═══════════════════════════════════════════════════════════════
  // HEADLAMPS — manufacturer + survey
  // ═══════════════════════════════════════════════════════════════

  "nitecore-nu20-classic": {
    lumens: 360,
    batteryType: "rechargeable",
    chargeMethod: "usb-c",
    runtime: 30,
    redLight: true,
    ipxRating: 66,
    communityRating: 9.35,
  },

  "nitecore-nu25": {
    lumens: 400,
    batteryType: "rechargeable",
    chargeMethod: "usb-c",
    runtime: 45,
    redLight: true,
    ipxRating: 66,
    communityRating: 9.12,
    pctUsagePercent: 37.7,
  },

  "nitecore-nu27": {
    lumens: 600,
    batteryType: "rechargeable",
    chargeMethod: "usb-c",
    runtime: 28,
    redLight: true,
    communityRating: 8.87,
  },

  "petzl-actik-core": {
    lumens: 625,
    batteryType: "rechargeable",
    chargeMethod: "usb-c",
    runtime: 35,
    redLight: true,
    ipxRating: 67,
    communityRating: 8.85,
  },

  "petzl-tikka": {
    lumens: 350,
    batteryType: "AAA",
    chargeMethod: "none",
    runtime: 60,
    redLight: true,
    ipxRating: 67,
    communityRating: 8.96,
  },

  "black-diamond-spot-400": {
    lumens: 400,
    batteryType: "AAA",
    chargeMethod: "none",
    runtime: 40,
    redLight: true,
    ipxRating: 67,
    communityRating: 8.31,
  },

  "flextail-tiny-helio": {
    lumens: 600,
    batteryType: "rechargeable",
    chargeMethod: "usb-c",
    runtime: 20,
    redLight: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // TREKKING POLES — manufacturer + survey
  // ═══════════════════════════════════════════════════════════════

  "bd-alpine-carbon-cork": {
    poleMaterial: "carbon",
    collapsedLength: 24,
    lockType: "flicklock",
    gripMaterial: "cork",
    poleSections: 3,
    communityRating: 9.11,
  },

  "bd-trail": {
    poleMaterial: "aluminum",
    collapsedLength: 24,
    lockType: "flicklock",
    gripMaterial: "foam",
    poleSections: 3,
    communityRating: 8.53,
  },

  "bd-trail-cork": {
    poleMaterial: "aluminum",
    collapsedLength: 24,
    lockType: "flicklock",
    gripMaterial: "cork",
    poleSections: 3,
    communityRating: 9.11,
  },

  "bd-distance-carbon-z": {
    poleMaterial: "carbon",
    collapsedLength: 15,
    lockType: "z-fold",
    gripMaterial: "foam",
    poleSections: 3,
    communityRating: 8.50,
  },

  "leki-makalu-cork-lite": {
    poleMaterial: "aluminum",
    collapsedLength: 26,
    lockType: "lever",
    gripMaterial: "cork",
    poleSections: 3,
    communityRating: 9.50,
  },

  "gossamer-gear-lt5": {
    poleMaterial: "carbon",
    collapsedLength: 23.5,
    lockType: "twist",
    gripMaterial: "foam",
    poleSections: 2,
    communityRating: 8.12,
  },

  "cascade-mtn-tech-cf": {
    poleMaterial: "carbon",
    collapsedLength: 30,
    lockType: "flicklock",
    gripMaterial: "cork",
    poleSections: 3,
    communityRating: 8.08,
  },

  // ═══════════════════════════════════════════════════════════════
  // SHOES — PCT survey data
  // ═══════════════════════════════════════════════════════════════

  "altra-lone-peak-9": {
    heelDrop: 0,
    toeBoxWidth: "wide",
    communityRating: 9.29,
    pctUsagePercent: 28.4,
    pairsPerThru: 4.74,
  },

  "altra-olympus-6": {
    heelDrop: 0,
    toeBoxWidth: "wide",
    communityRating: 8.41,
    pairsPerThru: 5.0,
  },

  "hoka-speedgoat-6": {
    heelDrop: 4,
    toeBoxWidth: "standard",
    communityRating: 8.64,
    pairsPerThru: 4.86,
  },

  "topo-athletic-traverse": {
    heelDrop: 5,
    toeBoxWidth: "wide",
    communityRating: 8.28,
    pairsPerThru: 4.93,
  },

  "brooks-cascadia": {
    heelDrop: 6,
    toeBoxWidth: "standard",
    communityRating: 8.60,
    pairsPerThru: 4.88,
  },

  "salomon-speedcross-6": {
    heelDrop: 10,
    toeBoxWidth: "narrow",
    communityRating: 9.17,
    pairsPerThru: 5.5,
  },
};
