import { createClient } from "@/lib/supabase/client";

export interface Loadout {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  slug: string | null;
  createdAt: string;
  updatedAt: string;
  // Computed from items
  itemCount?: number;
  totalWeightOz?: number;
}

export interface LoadoutItem {
  id: string;
  loadoutId: string;
  userGearId: string;
  status: "packed" | "worn" | "consumable";
  quantity: number;
  sortOrder: number;
}

function mapLoadoutRow(row: Record<string, unknown>): Loadout {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string) || null,
    isPublic: row.is_public as boolean,
    slug: (row.slug as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getLoadouts(): Promise<Loadout[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loadouts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapLoadoutRow);
}

export async function getLoadoutWithItems(loadoutId: string): Promise<{
  loadout: Loadout | null;
  items: LoadoutItem[];
}> {
  const supabase = createClient();

  const { data: loadoutData, error: loadoutError } = await supabase
    .from("loadouts")
    .select("*")
    .eq("id", loadoutId)
    .single();

  if (loadoutError || !loadoutData) return { loadout: null, items: [] };

  const { data: itemsData } = await supabase
    .from("loadout_items")
    .select("*")
    .eq("loadout_id", loadoutId)
    .order("sort_order", { ascending: true });

  const items: LoadoutItem[] = (itemsData || []).map((row) => ({
    id: row.id,
    loadoutId: row.loadout_id,
    userGearId: row.user_gear_id,
    status: row.status as "packed" | "worn" | "consumable",
    quantity: row.quantity,
    sortOrder: row.sort_order,
  }));

  return { loadout: mapLoadoutRow(loadoutData), items };
}

export async function createLoadout(params: {
  name: string;
  description?: string;
}): Promise<Loadout | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const slug = params.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data, error } = await supabase
    .from("loadouts")
    .insert({
      user_id: user.id,
      name: params.name,
      description: params.description || null,
      slug,
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapLoadoutRow(data);
}

export async function deleteLoadout(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("loadouts").delete().eq("id", id);
  return !error;
}

export async function updateLoadout(
  id: string,
  updates: { name?: string; description?: string; isPublic?: boolean }
): Promise<boolean> {
  const supabase = createClient();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;

  const { error } = await supabase.from("loadouts").update(updateData).eq("id", id);
  return !error;
}

export async function addItemToLoadout(params: {
  loadoutId: string;
  userGearId: string;
  status?: "packed" | "worn" | "consumable";
}): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("loadout_items").insert({
    loadout_id: params.loadoutId,
    user_gear_id: params.userGearId,
    status: params.status || "packed",
  });
  return !error;
}

export async function removeItemFromLoadout(itemId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("loadout_items").delete().eq("id", itemId);
  return !error;
}
