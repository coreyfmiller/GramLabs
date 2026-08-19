import { NextRequest, NextResponse } from "next/server";

export interface GeoSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  admin2?: string;
  elevation?: number;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Open-Meteo geocoding with multiple results for fuzzy matching
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`;
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results: GeoSearchResult[] = data.results.map((r: {
      id: number;
      name: string;
      latitude: number;
      longitude: number;
      country: string;
      admin1?: string;
      admin2?: string;
      elevation?: number;
    }) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
      admin1: r.admin1,
      admin2: r.admin2,
      elevation: r.elevation,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
