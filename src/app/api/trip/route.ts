import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface PackItemInput {
  name: string;
  brand: string;
  category: string;
  weightOz: number;
  tempRating?: number | null;
  rValue?: number | null;
  waterproof?: boolean;
  status: string;
}

interface GeoResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  admin1?: string;
  elevation?: number;
}

export interface DayForecast {
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
  rainHours: string; // e.g. "afternoon" or "morning" or "all day"
}

interface TripAnalysis {
  score: number;
  warnings: { level: "red" | "yellow"; message: string }[];
  recommendations: string[];
  dayByDay: { day: number; date: string; summary: string; tips: string[] }[];
}

const SYSTEM_PROMPT = `You are HikeMind Trip Engine, an expert backpacking trip planner and pack analyst. You analyze detailed weather forecasts against a hiker's gear to identify risks and provide recommendations.

ANALYSIS RULES:
1. Sleep System vs Overnight Lows: Compare quilt/bag temp ratings (tempRating field) against the FEELS-LIKE minimum temperature. Flag if the rating is within 10°F of the feels-like low or above it. Account for R-value of sleeping pads (R < 3 is insufficient below 30°F, R < 4 is risky below 20°F).
2. Rain Gear: Check for waterproof shells, rain jackets, pack covers. If precipitation probability > 40% or precip sum > 5mm on any day, rain gear is essential. Mention WHEN rain is expected (morning vs afternoon).
3. Wind & Layering: Use feels-like temps (which account for wind chill). Below 40°F feels-like, a puffy is needed. Below 50°F, a fleece or active insulation. Wind gusts > 30mph flag wind protection needs.
4. Water Carry: If max temps exceed 80°F, recommend 3L+ capacity. Above 90°F, recommend 4L+. Factor in humidity — high humidity means more sweating. Always note water filter/purification presence.
5. UV Protection: If UV index > 6, flag sun protection needs (hat, sunscreen, sun shirt). UV > 8 is extreme — cover up.
6. Snow/Ice: If snowfall > 0, check for traction devices (microspikes) and appropriate insulation. Even small amounts can make trails slippery.
7. Daylight Planning: Note sunrise/sunset for each day. If daylight hours are short (<11h), mention headlamp importance and early camp setup.
8. Dew Point & Condensation: If dew point is close to overnight low (within 5°F), warn about tent condensation. Suggest ventilation or double-wall shelter.
9. Missing Essentials: Check for headlamp, first aid, navigation, sun protection (when UV is high), trekking poles, rain gear.
10. Score: Rate overall pack readiness 1-10 based on how well the gear matches conditions. 10 = perfectly prepared, 1 = dangerously unprepared.

Be specific about which days and which items you're referencing.

RESPONSE FORMAT — respond with valid JSON only, no markdown fences:
{
  "score": 8,
  "warnings": [
    { "level": "red", "message": "Quilt rated to 30°F but feels-like low is 22°F on Day 3 — risk of hypothermia" },
    { "level": "yellow", "message": "UV index 9 on Day 1-2 — no sun hat detected in pack" }
  ],
  "recommendations": [
    "Add a warmer quilt or liner for nights below 25°F",
    "Bring a sun shirt or hat — UV is extreme for 3 of your 5 days",
    "Start hiking by 6:30am to maximize daylight (sunset 7:45pm)"
  ],
  "dayByDay": [
    { "day": 1, "date": "2024-07-15", "summary": "Hot and clear, UV extreme. Afternoon thunderstorm risk (65% after 2pm). Overnight low 45°F feels like 41°F.", "tips": ["Start early — heat peaks 1-4pm", "Carry 3L+ water, refill at stream crossings", "Set up camp before 3pm thunderstorms"] }
  ]
}`;

async function geocodeLocation(location: string): Promise<GeoResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  const r = data.results[0];
  return {
    latitude: r.latitude,
    longitude: r.longitude,
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    elevation: r.elevation,
  };
}

function cToF(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

function getWindDirection(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
}

function getRainTiming(hourlyPrecip: number[], dayIndex: number): string {
  // Each day has 24 hourly values
  const start = dayIndex * 24;
  const morning = hourlyPrecip.slice(start, start + 12); // 0-11am
  const afternoon = hourlyPrecip.slice(start + 12, start + 24); // 12-11pm

  const morningRain = morning.some((p) => p > 0.1);
  const afternoonRain = afternoon.some((p) => p > 0.1);

  if (morningRain && afternoonRain) return "all day";
  if (morningRain) return "morning";
  if (afternoonRain) return "afternoon";
  return "none";
}

function calculateDaylightHours(sunrise: string, sunset: string): number {
  const rise = new Date(`2000-01-01T${sunrise}`);
  const set = new Date(`2000-01-01T${sunset}`);
  return Math.round(((set.getTime() - rise.getTime()) / 3600000) * 10) / 10;
}

async function getWeatherForecast(lat: number, lng: number, days: number): Promise<DayForecast[]> {
  const dailyParams = [
    "temperature_2m_max", "temperature_2m_min",
    "apparent_temperature_max", "apparent_temperature_min",
    "precipitation_sum", "precipitation_probability_max", "precipitation_hours",
    "snowfall_sum",
    "wind_speed_10m_max", "wind_gusts_10m_max", "wind_direction_10m_dominant",
    "uv_index_max",
    "sunrise", "sunset",
  ].join(",");

  const hourlyParams = [
    "temperature_2m", "precipitation", "relative_humidity_2m",
    "dew_point_2m", "cloud_cover",
  ].join(",");

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=${dailyParams}&hourly=${hourlyParams}&timezone=auto&forecast_days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API request failed");
  const data = await res.json();

  const forecasts: DayForecast[] = [];
  for (let i = 0; i < days; i++) {
    // Get average humidity and dew point for the day from hourly data
    const hourStart = i * 24;
    const hourEnd = hourStart + 24;
    const dayHumidity = data.hourly.relative_humidity_2m.slice(hourStart, hourEnd);
    const dayDewPoint = data.hourly.dew_point_2m.slice(hourStart, hourEnd);
    const dayCloudCover = data.hourly.cloud_cover.slice(hourStart, hourEnd);
    const avgHumidity = Math.round(dayHumidity.reduce((s: number, v: number) => s + v, 0) / dayHumidity.length);
    const avgDewPoint = cToF(dayDewPoint.reduce((s: number, v: number) => s + v, 0) / dayDewPoint.length);
    const avgCloudCover = Math.round(dayCloudCover.reduce((s: number, v: number) => s + v, 0) / dayCloudCover.length);

    // Parse sunrise/sunset times
    const sunriseStr = data.daily.sunrise[i]?.split("T")[1] || "06:00";
    const sunsetStr = data.daily.sunset[i]?.split("T")[1] || "20:00";

    forecasts.push({
      date: data.daily.time[i],
      tempMax: cToF(data.daily.temperature_2m_max[i]),
      tempMin: cToF(data.daily.temperature_2m_min[i]),
      feelsLikeMax: cToF(data.daily.apparent_temperature_max[i]),
      feelsLikeMin: cToF(data.daily.apparent_temperature_min[i]),
      precipSum: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
      precipProb: data.daily.precipitation_probability_max[i],
      precipHours: Math.round(data.daily.precipitation_hours[i]),
      snowfall: Math.round((data.daily.snowfall_sum[i] || 0) * 10) / 10,
      windMax: kmhToMph(data.daily.wind_speed_10m_max[i]),
      gustMax: kmhToMph(data.daily.wind_gusts_10m_max[i]),
      windDirection: data.daily.wind_direction_10m_dominant[i],
      uvIndexMax: Math.round(data.daily.uv_index_max[i] * 10) / 10,
      humidity: avgHumidity,
      dewPoint: avgDewPoint,
      cloudCover: avgCloudCover,
      sunrise: sunriseStr,
      sunset: sunsetStr,
      daylightHours: calculateDaylightHours(sunriseStr, sunsetStr),
      rainHours: getRainTiming(data.hourly.precipitation, i),
    });
  }
  return forecasts;
}

export async function POST(req: NextRequest) {
  try {
    const { location, latitude, longitude, locationName, startDate, duration, packItems } = await req.json() as {
      location?: string;
      latitude?: number;
      longitude?: number;
      locationName?: string;
      startDate: string;
      duration: number;
      packItems: PackItemInput[];
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    if (!duration || duration < 1 || duration > 14) {
      return NextResponse.json({ error: "Invalid input: duration (1-14) required" }, { status: 400 });
    }

    let geo: GeoResult | null = null;

    if (latitude !== undefined && longitude !== undefined) {
      geo = {
        latitude,
        longitude,
        name: locationName || "Selected Location",
        country: "",
        admin1: undefined,
      };
    } else if (location) {
      geo = await geocodeLocation(location);
    }

    if (!geo) {
      return NextResponse.json({ error: `Could not find location: "${location || ""}". Try a city name or well-known trail.` }, { status: 400 });
    }

    // Fetch weather
    const weather = await getWeatherForecast(geo.latitude, geo.longitude, duration);

    // Send to Gemini for analysis
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const prompt = `Analyze this trip and pack:

TRIP DETAILS:
- Location: ${geo.name}, ${geo.admin1 || ""}, ${geo.country} (${geo.latitude}°N, ${geo.longitude}°W)
- Elevation: ${geo.elevation ? `${geo.elevation}m` : "unknown"}
- Start Date: ${startDate}
- Duration: ${duration} days

DETAILED WEATHER FORECAST:
${weather.map((d, i) => `Day ${i + 1} (${d.date}):
  Temp: High ${d.tempMax}°F / Low ${d.tempMin}°F | Feels like: ${d.feelsLikeMax}°F / ${d.feelsLikeMin}°F
  Precip: ${d.precipSum}mm total (${d.precipProb}% chance, ${d.precipHours}h of rain, timing: ${d.rainHours})${d.snowfall > 0 ? ` | Snow: ${d.snowfall}cm` : ""}
  Wind: ${d.windMax}mph sustained, gusts ${d.gustMax}mph from ${getWindDirection(d.windDirection)}
  UV Index: ${d.uvIndexMax} | Cloud cover: ${d.cloudCover}%
  Humidity: ${d.humidity}% | Dew point: ${d.dewPoint}°F
  Daylight: ${d.daylightHours}h (sunrise ${d.sunrise}, sunset ${d.sunset})`).join("\n\n")}

PACK ITEMS (${packItems.length} items):
${packItems.map((item) => `- ${item.brand} ${item.name} | ${item.category} | ${item.weightOz}oz | status: ${item.status}${item.tempRating ? ` | temp rating: ${item.tempRating}°F` : ""}${item.rValue ? ` | R-value: ${item.rValue}` : ""}${item.waterproof ? " | waterproof" : ""}`).join("\n")}

Provide your complete analysis as JSON. Be specific about which days, times, and items you're referencing.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.response.text();
    const jsonStr = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis: TripAnalysis = JSON.parse(jsonStr);

    return NextResponse.json({
      weather,
      location: { name: geo.name, region: geo.admin1, country: geo.country, elevation: geo.elevation },
      analysis,
    });
  } catch (error: unknown) {
    console.error("Trip Engine error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze trip";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
