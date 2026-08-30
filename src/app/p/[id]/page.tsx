import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidPackId } from "@/lib/pack-id";
import type { SharePayload } from "@/lib/pack-share";
import { PackViewClient } from "./pack-view-client";

type Props = { params: Promise<{ id: string }> };

interface PackRow {
  id: string;
  name: string;
  payload: SharePayload;
  is_public: boolean;
}

async function getPack(id: string): Promise<PackRow | null> {
  if (!isValidPackId(id)) return null;
  const supabase = await createClient();
  // RLS returns the row only if is_public = true (or the caller owns it).
  const { data, error } = await supabase
    .from("user_packs")
    .select("id, name, payload, is_public")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as PackRow;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pack = await getPack(id);
  if (!pack) return { title: "Pack not found — HikeMind" };
  const count = Array.isArray(pack.payload?.i) ? pack.payload.i.length : 0;
  const title = `${pack.name} — HikeMind gear list`;
  const description = `A shared gear list with ${count} item${count === 1 ? "" : "s"}. View the breakdown and build your own for free.`;
  return {
    title,
    description,
    // The opengraph-image.tsx sibling is auto-attached by Next; large card shows it.
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicPackPage({ params }: Props) {
  const { id } = await params;
  const pack = await getPack(id);
  if (!pack) notFound();

  // Best-effort view bump; never blocks render.
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_pack_view", { p_id: id });
  } catch {
    /* ignore */
  }

  return <PackViewClient id={pack.id} name={pack.name} payload={pack.payload} />;
}
