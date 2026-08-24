"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/Nav";
import { cn } from "@/lib/utils";
import { Flame, Droplets, Package, Mountain, TrendingUp } from "lucide-react";
import { usePackStore } from "@/store/pack-store";

/**
 * Pandolf Equation (simplified for hiking):
 * M = 1.5W + 2.0(W + L)(L/W)² + n(W + L)(1.5V² + 0.35VG)
 *
 * Where:
 * M = metabolic rate (watts)
 * W = body weight (kg)
 * L = load weight (kg)
 * V = speed (m/s)
 * G = grade (%)
 * n = terrain factor (1.0 = paved, 1.2 = dirt, 1.5 = sand/snow)
 *
 * Simplified for backpackers: we use average speed from miles/hours,
 * average grade from elevation gain/distance, and terrain factor.
 */

type TerrainType = "trail" | "off-trail" | "snow";
type Sex = "male" | "female";

interface CalorieInputs {
  bodyWeightLbs: number;
  packWeightLbs: number;
  distanceMiles: number;
  elevationGainFt: number;
  hikingHours: number;
  terrain: TerrainType;
  sex: Sex;
  tripDays: number;
}

interface CalorieResult {
  dailyCalories: number;
  dailyFoodOz: number;
  dailyFoodLbs: number;
  dailyWaterLiters: number;
  totalFoodLbs: number;
  totalWaterLbs: number;
  baseMetabolicRate: number;
  hikingCalories: number;
  campCalories: number;
  macros: { protein: number; fat: number; carbs: number };
}

function calculateCalories(inputs: CalorieInputs): CalorieResult {
  const bodyKg = inputs.bodyWeightLbs * 0.4536;
  const loadKg = inputs.packWeightLbs * 0.4536;
  const distanceKm = inputs.distanceMiles * 1.609;
  const elevationM = inputs.elevationGainFt * 0.3048;

  // Average speed in m/s
  const speedMs = (distanceKm * 1000) / (inputs.hikingHours * 3600);

  // Average grade (%)
  const averageGrade = (elevationM / (distanceKm * 1000)) * 100;

  // Terrain factor
  const terrainFactor = inputs.terrain === "trail" ? 1.2 : inputs.terrain === "off-trail" ? 1.5 : 1.8;

  // Pandolf equation (metabolic rate in watts)
  const W = bodyKg;
  const L = loadKg;
  const V = speedMs;
  const G = Math.max(averageGrade, 0);
  const n = terrainFactor;

  // Simplified Pandolf
  const metabolicWatts = 1.5 * W + 2.0 * (W + L) * Math.pow(L / W, 2) + n * (W + L) * (1.5 * V * V + 0.35 * V * G);

  // Convert watts to kcal/hour (1 watt = 0.86 kcal/hr)
  const calPerHour = metabolicWatts * 0.86;

  // Hiking calories
  const hikingCalories = calPerHour * inputs.hikingHours;

  // Base metabolic rate (Harris-Benedict)
  let bmr: number;
  if (inputs.sex === "male") {
    bmr = 88.362 + (13.397 * bodyKg) + (4.799 * 175) - (5.677 * 30); // assume 175cm, 30yo
  } else {
    bmr = 447.593 + (9.247 * bodyKg) + (3.098 * 163) - (4.330 * 30); // assume 163cm, 30yo
  }

  // Camp/rest calories (remaining hours at 1.2x BMR)
  const campHours = 24 - inputs.hikingHours;
  const campCalories = (bmr / 24) * campHours * 1.2;

  // Total daily calories
  const dailyCalories = Math.round(hikingCalories + campCalories);

  // Food weight: average backpacking food is ~125 cal/oz (trail mix, bars, freeze-dried)
  const calPerOz = 125;
  const dailyFoodOz = dailyCalories / calPerOz;
  const dailyFoodLbs = dailyFoodOz / 16;

  // Water: ~1 liter per 2 hours of hiking + 1L baseline
  const dailyWaterLiters = (inputs.hikingHours / 2) + 1;

  // Trip totals
  const totalFoodLbs = dailyFoodLbs * inputs.tripDays;
  const totalWaterLbs = dailyWaterLiters * 2.2; // 1L water = 2.2 lbs (carrying capacity, not total trip)

  // Macro breakdown for hiking (typical recommendation: 50% carbs, 30% fat, 20% protein)
  const macros = {
    carbs: Math.round(dailyCalories * 0.50 / 4), // 4 cal/g
    fat: Math.round(dailyCalories * 0.30 / 9), // 9 cal/g
    protein: Math.round(dailyCalories * 0.20 / 4), // 4 cal/g
  };

  return {
    dailyCalories,
    dailyFoodOz: Math.round(dailyFoodOz),
    dailyFoodLbs: Math.round(dailyFoodLbs * 10) / 10,
    dailyWaterLiters: Math.round(dailyWaterLiters * 10) / 10,
    totalFoodLbs: Math.round(totalFoodLbs * 10) / 10,
    totalWaterLbs: Math.round(totalWaterLbs * 10) / 10,
    baseMetabolicRate: Math.round(bmr),
    hikingCalories: Math.round(hikingCalories),
    campCalories: Math.round(campCalories),
    macros,
  };
}

export default function CaloriesPage() {
  const getBaseWeight = usePackStore((s) => s.getBaseWeight);

  const [inputs, setInputs] = useState<CalorieInputs>({
    bodyWeightLbs: 170,
    packWeightLbs: 20,
    distanceMiles: 15,
    elevationGainFt: 3000,
    hikingHours: 8,
    terrain: "trail",
    sex: "male",
    tripDays: 3,
  });

  // Auto-fill pack weight from active loadout
  useEffect(() => {
    const baseWeightOz = getBaseWeight();
    if (baseWeightOz > 0) {
      setInputs((prev) => ({ ...prev, packWeightLbs: Math.round((baseWeightOz / 16) * 10) / 10 }));
    }
  }, [getBaseWeight]);

  const [result, setResult] = useState<CalorieResult | null>(null);

  function handleCalculate() {
    setResult(calculateCalories(inputs));
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calorie Calculator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimate daily calorie needs, food weight, and water for your trip. Based on the Pandolf equation used by the US military.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <div className="space-y-4">
            {/* Body stats */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">Hiker Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Body Weight (lbs)</label>
                  <input
                    type="number"
                    value={inputs.bodyWeightLbs}
                    onChange={(e) => setInputs({ ...inputs, bodyWeightLbs: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Sex</label>
                  <select
                    value={inputs.sex}
                    onChange={(e) => setInputs({ ...inputs, sex: e.target.value as Sex })}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Trip details */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">Trip Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Pack Weight (lbs)</label>
                  <input
                    type="number"
                    value={inputs.packWeightLbs}
                    onChange={(e) => setInputs({ ...inputs, packWeightLbs: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Trip Duration (days)</label>
                  <input
                    type="number"
                    value={inputs.tripDays}
                    onChange={(e) => setInputs({ ...inputs, tripDays: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={30}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Daily Distance (miles)</label>
                  <input
                    type="number"
                    value={inputs.distanceMiles}
                    onChange={(e) => setInputs({ ...inputs, distanceMiles: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Daily Elevation Gain (ft)</label>
                  <input
                    type="number"
                    value={inputs.elevationGainFt}
                    onChange={(e) => setInputs({ ...inputs, elevationGainFt: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Hiking Hours / Day</label>
                  <input
                    type="number"
                    value={inputs.hikingHours}
                    onChange={(e) => setInputs({ ...inputs, hikingHours: parseFloat(e.target.value) || 0 })}
                    min={1}
                    max={16}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Terrain</label>
                  <select
                    value={inputs.terrain}
                    onChange={(e) => setInputs({ ...inputs, terrain: e.target.value as TerrainType })}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  >
                    <option value="trail">Maintained trail</option>
                    <option value="off-trail">Off-trail / rough</option>
                    <option value="snow">Snow / sand</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all"
            >
              Calculate
            </button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {result ? (
              <>
                {/* Primary stat */}
                <div className="rounded-xl border border-border bg-card p-5 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Daily Calories Needed</p>
                  <p className="num text-4xl font-bold text-primary mt-2">{result.dailyCalories.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">kcal / day</p>
                </div>

                {/* Key numbers */}
                <div className="grid grid-cols-2 gap-3">
                  <ResultCard icon={Package} label="Food / Day" value={`${result.dailyFoodLbs} lb`} sub={`${result.dailyFoodOz} oz`} />
                  <ResultCard icon={Droplets} label="Water / Day" value={`${result.dailyWaterLiters} L`} sub={`${(result.dailyWaterLiters * 2.2).toFixed(1)} lb`} />
                  <ResultCard icon={Flame} label="Total Food" value={`${result.totalFoodLbs} lb`} sub={`for ${inputs.tripDays} days`} />
                  <ResultCard icon={Mountain} label="Hiking Burn" value={`${result.hikingCalories}`} sub="kcal from hiking" />
                </div>

                {/* Macros */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Daily Macros</h3>
                  <div className="space-y-2">
                    <MacroBar label="Carbs" grams={result.macros.carbs} pct={50} color="bg-blue-400" />
                    <MacroBar label="Fat" grams={result.macros.fat} pct={30} color="bg-yellow-400" />
                    <MacroBar label="Protein" grams={result.macros.protein} pct={20} color="bg-red-400" />
                  </div>
                </div>

                {/* Breakdown */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base metabolic rate</span>
                      <span className="num">{result.baseMetabolicRate} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hiking energy</span>
                      <span className="num">{result.hikingCalories} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Camp / rest</span>
                      <span className="num">{result.campCalories} kcal</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 font-medium">
                      <span>Total</span>
                      <span className="num text-primary">{result.dailyCalories} kcal</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  Based on the Pandolf equation. Assumes 125 cal/oz average food density. Adjust for your actual food choices.
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <TrendingUp className="size-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Enter your trip details and hit Calculate to see your calorie needs, food weight, and water requirements.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ResultCard({ icon: Icon, label, value, sub }: { icon: typeof Flame; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      </div>
      <p className="num text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function MacroBar({ label, grams, pct, color }: { label: string; grams: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="num text-xs">{grams}g <span className="text-muted-foreground">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
