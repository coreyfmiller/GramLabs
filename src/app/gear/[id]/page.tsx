import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { GearDetailClient } from "./gear-detail-client";

// === TYPES ===

export interface GearDetailData {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  tier: string;
  weight_oz: number;
  price_usd: number;
  description: string;
  url: string | null;
  youtube_video_ids: string[] | null;
  // Shelter
  shelter_type: string | null;
  capacity: number | null;
  seasons: string | null;
  setup_type: string | null;
  floor_area: number | null;
  peak_height: number | null;
  packed_size: string | null;
  fabric: string | null;
  fabric_denier: number | null;
  stakes_needed: number | null;
  doors: number | null;
  vestibule_area: number | null;
  // Sleep
  temp_rating: number | null;
  r_value: number | null;
  fill_power: number | null;
  fill_type: string | null;
  fill_weight: number | null;
  sleep_style: string | null;
  thickness: number | null;
  pad_width: number | null;
  pad_length: number | null;
  // Pack
  volume: number | null;
  frame_type: string | null;
  hip_belt: string | null;
  max_carry_weight: number | null;
  // Kitchen
  fuel_type: string | null;
  boil_time: number | null;
  // Electronics
  lumens: number | null;
  battery_type: string | null;
  runtime: number | null;
  // Accessories
  pole_material: string | null;
  waterproof: boolean | null;
  hood_type: string | null;
  // Community
  community_rating: number | null;
}

export interface SimilarItem {
  id: string;
  name: string;
  brand: string;
  weight_oz: number;
  price_usd: number;
  tier: string;
}

// === DATA FETCHING ===

async function getGearItem(id: string): Promise<GearDetailData | null> {
  const { data, error } = await supabase
    .from("gear_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as GearDetailData;
}

async function getSimilarItems(item: GearDetailData): Promise<SimilarItem[]> {
  // Find items in the same category + subcategory, excluding current item
  let query = supabase
    .from("gear_items")
    .select("id, name, brand, weight_oz, price_usd, tier")
    .eq("category", item.category)
    .neq("id", item.id)
    .order("weight_oz", { ascending: true })
    .limit(6);

  if (item.subcategory) {
    query = query.eq("subcategory", item.subcategory);
  }

  const { data } = await query;
  return (data as SimilarItem[]) || [];
}

// === METADATA ===

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getGearItem(id);

  if (!item) {
    return { title: "Gear Not Found | HikeMind" };
  }

  const title = `${item.brand} ${item.name} — ${item.weight_oz}oz, $${item.price_usd} | HikeMind`;
  const description = buildDescription(item);

  return {
    title,
    description,
    openGraph: {
      title: `${item.brand} ${item.name}`,
      description,
      type: "website",
      siteName: "HikeMind",
      url: `https://hikemind.app/gear/${item.id}`,
    },
    twitter: {
      card: "summary",
      title: `${item.brand} ${item.name} — ${item.weight_oz}oz`,
      description,
    },
    alternates: {
      canonical: `https://hikemind.app/gear/${item.id}`,
    },
  };
}

function buildDescription(item: GearDetailData): string {
  const parts: string[] = [];
  parts.push(`${item.brand} ${item.name}: ${item.weight_oz}oz, $${item.price_usd}.`);

  if (item.temp_rating != null) parts.push(`Rated to ${item.temp_rating}°F.`);
  if (item.r_value != null) parts.push(`R-value ${item.r_value}.`);
  if (item.fill_power != null) parts.push(`${item.fill_power}FP ${item.fill_type || "down"}.`);
  if (item.capacity != null) parts.push(`${item.capacity}-person.`);
  if (item.seasons) parts.push(`${item.seasons}-season.`);
  if (item.volume != null) parts.push(`${item.volume}L.`);
  if (item.lumens != null) parts.push(`${item.lumens} lumens.`);

  parts.push("Full specs, video reviews, and comparison tools on HikeMind.");

  return parts.join(" ").slice(0, 160);
}

// === JSON-LD STRUCTURED DATA ===

function buildJsonLd(item: GearDetailData) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${item.brand} ${item.name}`,
    brand: {
      "@type": "Brand",
      name: item.brand,
    },
    description: item.description || `${item.brand} ${item.name} — ultralight backpacking gear`,
    category: item.category,
    offers: {
      "@type": "Offer",
      price: item.price_usd,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Weight",
        value: `${item.weight_oz} oz`,
      },
      ...(item.temp_rating != null
        ? [{ "@type": "PropertyValue", name: "Temperature Rating", value: `${item.temp_rating}°F` }]
        : []),
      ...(item.r_value != null
        ? [{ "@type": "PropertyValue", name: "R-Value", value: `${item.r_value}` }]
        : []),
      ...(item.volume != null
        ? [{ "@type": "PropertyValue", name: "Volume", value: `${item.volume}L` }]
        : []),
      ...(item.capacity != null
        ? [{ "@type": "PropertyValue", name: "Capacity", value: `${item.capacity}-person` }]
        : []),
    ],
    ...(item.community_rating != null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: item.community_rating,
        bestRating: 10,
        worstRating: 1,
      },
    }),
    ...(item.url && { url: item.url }),
  };
}

// === PAGE COMPONENT (Server) ===

export default async function GearDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await getGearItem(id);

  if (!item) {
    notFound();
  }

  const similarItems = await getSimilarItems(item);
  const jsonLd = buildJsonLd(item);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GearDetailClient item={item} similarItems={similarItems} />
    </>
  );
}
