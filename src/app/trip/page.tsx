"use client";

import { useState } from "react";
import {
  Loader2,
  Mountain,
  CloudRain,
  Wind,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Sun,
  Calendar,
  MapPin,
  Droplets,
  Shield,
  Sparkles,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { cn } from "@/lib/utils";
import { LimitReached, parseLimitError } from "@/components/limit-reached";
import { usePackStore } from "@/store/pack-store";

interface DayForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  feelsLikeMax: number;
  feelsLikeMin: number;
  precipSum: number;
  precipProb: number;
  precipHours: number;
  snowfall: number;
  windMax: number;
  gustMax: number;
  windDirection: number;
  uvIndexMax: number;
  humidity: number;
  dewPoint: number;
  cloudCover: number;
  sunrise: string;
  sunset: string;
  daylightHours: number;
  rainHours: string;
}

interface Warning {
  level: "red" | "yellow";
  message: string;
}

interface DayBreakdown {
  day: number;
  date: string;
  summary: string;
  tips: string[];
}

interface TripAnalysis {
  score: number;
  warnings: Warning[];
  recommendations: string[];
  dayByDay: DayBreakdown[];
}

interface TripResult {
  weather: DayForecast[];
  location: { name: string; region?: string; country: string; elevation?: number };
  analysis: TripAnalysis;
}

export default function TripPage() {
  const { loadouts, activeLoadoutId } = usePackStore();

  const [location, setLocation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; latitude: number; longitude: number; admin1?: string; country: string } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState(3);
  const [selectedLoadoutId, setSelectedLoadoutId] = useState(activeLoadoutId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState("");
  const [limitInfo, setLimitInfo] = useState<{ feature: string; limit: number; tier?: string } | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setLimitInfo(null);

    const loadout = loadouts.find((l) => l.id === selectedLoadoutId);
    if (!loadout || loadout.items.length === 0) {
      setError("Selected loadout has no items. Add gear in Pack Lab first.");
      setLoading(false);
      return;
    }

    const packItems = loadout.items.map((pi) => ({
      name: pi.item.name,
      brand: pi.item.brand,
      category: pi.item.category,
      weightOz: pi.item.weightOz,
      tempRating: pi.item.tempRating,
      rValue: pi.item.rValue,
      waterproof: pi.item.waterproof,
      status: pi.status,
    }));

    try {
      const body = selectedLocation
        ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude, locationName: `${selectedLocation.name}${selectedLocation.admin1 ? `, ${selectedLocation.admin1}` : ""}, ${selectedLocation.country}`, startDate, duration, packItems }
        : { location, startDate, duration, packItems };

      const res = await fetch("/api/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.limitReached) {
        const parsed = parseLimitError(data);
        if (parsed) setLimitInfo(parsed);
        else setError(data.error);
      } else if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-primary";
    if (score >= 5) return "text-yellow-400";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "border-primary/40 bg-primary/10";
    if (score >= 5) return "border-yellow-400/40 bg-yellow-400/10";
    return "border-destructive/40 bg-destructive/10";
  };

  const getWeatherIcon = (day: DayForecast) => {
    if (day.snowfall > 0) return <Mountain className="size-5 text-white" />;
    if (day.precipProb > 50) return <CloudRain className="size-5 text-blue-400" />;
    if (day.windMax > 25) return <Wind className="size-5 text-muted-foreground" />;
    if (day.cloudCover > 70) return <CloudRain className="size-5 text-muted-foreground/50" />;
    return <Sun className="size-5 text-yellow-400" />;
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {!result ? (
          <>
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Trail Forecast</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                AI-powered pack analysis against real weather forecasts. Know if your gear is ready before you hit the trail.
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Weather data from Open-Meteo. Always check local conditions before heading out.
              </p>
              <a href="/calories" className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline">
                Calorie & food calculator →
              </a>
            </div>

            {/* Form */}
            <div className="grid gap-5 max-w-2xl mx-auto overflow-visible">
              {/* Location */}
              <div className="rounded-xl border border-border bg-card p-5 relative z-30 overflow-visible">
                <label className="block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  <MapPin className="size-3.5 inline mr-1.5 -mt-0.5" />
                  Location / Trail Name
                </label>
                <LocationAutocomplete
                  value={location}
                  onChange={(val) => { setLocation(val); setSelectedLocation(null); }}
                  onSelect={(loc) => { setLocation(loc.name); setSelectedLocation(loc); }}
                />
                {selectedLocation && (
                  <p className="mt-2 text-xs text-primary flex items-center gap-1.5">
                    <CheckCircle className="size-3" />
                    {selectedLocation.name}{selectedLocation.admin1 ? `, ${selectedLocation.admin1}` : ""}, {selectedLocation.country}
                    <span className="text-muted-foreground ml-1">({selectedLocation.latitude.toFixed(2)}°, {selectedLocation.longitude.toFixed(2)}°)</span>
                  </p>
                )}
              </div>

              {/* Date + Duration Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <label className="block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                    <Calendar className="size-3.5 inline mr-1.5 -mt-0.5" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={todayStr}
                    className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 transition-colors"
                  />
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <label className="block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                    <Mountain className="size-3.5 inline mr-1.5 -mt-0.5" />
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={duration}
                    onChange={(e) => setDuration(Math.min(14, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 transition-colors"
                  />
                </div>
              </div>

              {/* Loadout Selection */}
              <div className="rounded-xl border border-border bg-card p-5">
                <label className="block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  <Shield className="size-3.5 inline mr-1.5 -mt-0.5" />
                  Loadout to Analyze
                </label>
                <select
                  value={selectedLoadoutId}
                  onChange={(e) => setSelectedLoadoutId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 transition-colors"
                >
                  {loadouts.map((l) => (
                    <option key={l.id} value={l.id} className="bg-background text-foreground">
                      {l.name} ({l.items.length} items)
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                onClick={handleAnalyze}
                disabled={loading || (!location && !selectedLocation) || !startDate}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base tracking-wide transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Analyzing trip conditions...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5" />
                    Analyze Trip
                  </>
                )}
              </button>

              {limitInfo && (
                <LimitReached feature={limitInfo.feature} limit={limitInfo.limit} tier={limitInfo.tier} className="mt-4" />
              )}

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
          </>
        ) : (
          /* Results */
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Trip Analysis</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.location.name}{result.location.region ? `, ${result.location.region}` : ""}, {result.location.country}
                  {result.location.elevation && <span> · {Math.round(result.location.elevation)}m elev</span>}
                  {" "}&middot; {duration} days
                </p>
              </div>
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 rounded-lg border border-border bg-input text-sm font-medium hover:bg-muted transition-colors"
              >
                New Analysis
              </button>
            </div>

            {/* Score */}
            <div className={cn("rounded-xl border border-border bg-card p-6 text-center", getScoreBg(result.analysis.score))}>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-2">Pack Readiness Score</p>
              <p className={cn("num text-6xl font-bold", getScoreColor(result.analysis.score))}>
                {result.analysis.score}
              </p>
              <p className="text-sm text-muted-foreground mt-1">/10</p>
            </div>

            {/* Warnings */}
            {result.analysis.warnings.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
                  <AlertTriangle className="size-3.5 inline mr-1.5 -mt-0.5" />
                  Warnings
                </h3>
                <div className="space-y-2.5">
                  {result.analysis.warnings.map((w, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-lg px-4 py-3 border",
                        w.level === "red"
                          ? "border-destructive/30 bg-destructive/10"
                          : "border-yellow-400/30 bg-yellow-400/10"
                      )}
                    >
                      <AlertTriangle
                        className={cn(
                          "size-4 mt-0.5 shrink-0",
                          w.level === "red" ? "text-destructive" : "text-yellow-400"
                        )}
                      />
                      <p className="text-sm">{w.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weather Forecast */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
                <Thermometer className="size-3.5 inline mr-1.5 -mt-0.5" />
                Weather Forecast
                {result.location.elevation && (
                  <span className="ml-2 text-[10px] text-muted-foreground/60 normal-case tracking-normal">
                    {Math.round(result.location.elevation)}m elevation
                  </span>
                )}
              </h3>
              <div className="space-y-3">
                {result.weather.map((day, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Date + Icon */}
                      <div className="flex items-center gap-3 w-36 shrink-0">
                        {getWeatherIcon(day)}
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Day {i + 1}</p>
                        </div>
                      </div>

                      {/* Temps */}
                      <div className="text-center min-w-[80px]">
                        <div className="flex items-baseline gap-1.5 justify-center">
                          <span className="num text-base font-semibold">{day.tempMax}°</span>
                          <span className="num text-xs text-muted-foreground">{day.tempMin}°</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Feels {day.feelsLikeMax}° / {day.feelsLikeMin}°
                        </p>
                      </div>

                      {/* Precipitation */}
                      <div className="text-center min-w-[70px]">
                        {day.precipProb > 0 ? (
                          <>
                            <p className="num text-sm font-medium text-blue-400">{day.precipProb}%</p>
                            <p className="text-[10px] text-muted-foreground">
                              {day.snowfall > 0 ? `${day.snowfall}cm snow` : `${day.precipSum}mm`}
                              {day.rainHours !== "none" && ` · ${day.rainHours}`}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="num text-sm text-muted-foreground/50">0%</p>
                            <p className="text-[10px] text-muted-foreground">dry</p>
                          </>
                        )}
                      </div>

                      {/* Wind */}
                      <div className="text-center min-w-[70px]">
                        <p className={cn("num text-sm font-medium", day.windMax > 25 ? "text-yellow-400" : "text-muted-foreground")}>
                          {day.windMax}mph
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          gusts {day.gustMax}
                        </p>
                      </div>

                      {/* UV */}
                      <div className="text-center min-w-[45px]">
                        <p className={cn("num text-sm font-medium", day.uvIndexMax >= 8 ? "text-destructive" : day.uvIndexMax >= 6 ? "text-yellow-400" : "text-muted-foreground")}>
                          {day.uvIndexMax}
                        </p>
                        <p className="text-[10px] text-muted-foreground">UV</p>
                      </div>

                      {/* Humidity */}
                      <div className="text-center min-w-[45px]">
                        <p className="num text-sm text-muted-foreground">{day.humidity}%</p>
                        <p className="text-[10px] text-muted-foreground">humid</p>
                      </div>

                      {/* Daylight */}
                      <div className="text-center min-w-[85px] hidden md:block">
                        <p className="num text-sm text-muted-foreground">{day.daylightHours}h</p>
                        <p className="text-[10px] text-muted-foreground">
                          ☀ {day.sunrise} → {day.sunset}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {result.analysis.recommendations.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
                  <CheckCircle className="size-3.5 inline mr-1.5 -mt-0.5" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.analysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Day-by-Day */}
            {result.analysis.dayByDay.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-4">
                  <Calendar className="size-3.5 inline mr-1.5 -mt-0.5" />
                  Day-by-Day Breakdown
                </h3>
                <div className="space-y-4">
                  {result.analysis.dayByDay.map((day) => (
                    <div key={day.day} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="num text-xs font-bold text-primary bg-primary/15 px-2 py-0.5 rounded">
                          Day {day.day}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{day.summary}</p>
                      {day.tips.length > 0 && (
                        <ul className="space-y-1">
                          {day.tips.map((tip, j) => (
                            <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== Location Autocomplete ========== */
interface GeoSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  admin2?: string;
  elevation?: number;
}

function LocationAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (val: string) => void;
  onSelect: (loc: { name: string; latitude: number; longitude: number; admin1?: string; country: string }) => void;
}) {
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(val: string) {
    onChange(val);

    // Clear previous timer
    if (debounceRef[0]) clearTimeout(debounceRef[0]);

    if (val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    // Debounce search
    debounceRef[0] = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen((data.results || []).length > 0);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 300);
  }

  function handleSelect(result: GeoSearchResult) {
    onSelect({
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      admin1: result.admin1,
      country: result.country,
    });
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Start typing... e.g. Katahdin, Yosemite, Banff"
          className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 transition-colors"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-[100] mt-1 w-full rounded-lg border border-border bg-card backdrop-blur-xl shadow-2xl overflow-y-auto max-h-[320px]">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(r)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
            >
              <MapPin className="size-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[r.admin1, r.admin2, r.country].filter(Boolean).join(", ")}
                  {r.elevation ? ` · ${Math.round(r.elevation)}m elev` : ""}
                </p>
              </div>
              <span className="num text-[10px] text-muted-foreground/60 shrink-0 mt-1">
                {r.latitude.toFixed(2)}°, {r.longitude.toFixed(2)}°
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
