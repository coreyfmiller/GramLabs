import { createClient } from "@/lib/supabase/client";
import { GearItem, GearCategory } from "@/data/gear-database";

export interface UserGearItem {
  id: string;
  userId: string;
  gearItemId: string | null;
  // Custom item fields
  customName: string | null;
  customBrand: string | null;
  customWeightOz: number | null;
  customCategory: string | null;
  // User-specific
  nickname: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  startingMiles: number;
  startingNights: number;
  condition: string;
  notes: string | null;
  retired: boolean;
  createdAt: string;
  // Joined gear data (populated when gear_item_id is not null)
  gearItem?: GearItem;
}

function mapUserGearRow(row: Record<string, unknown>): UserGearItem {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    gearItemId: (row.gear_item_id as string) || null,
    customName: (row.custom_name as string) || null,
    customBrand: (row.custom_brand as string) || null,
    customWeightOz: row.custom_weight_oz != null ? Number(row.custom_weight_oz) : null,
    customCategory: (row.custom_category as string) || null,
    nickname: (row.nickname as string) || null,
    purchaseDate: (row.purchase_date as string) || null,
    purchasePrice: row.purchase_price != null ? Number(row.purchase_price) : null,
    startingMiles: Number(row.starting_miles) || 0,
    startingNights: Number(row.starting_nights) || 0,
    condition: (row.condition as string) || "good",
    notes: (row.notes as string) || null,
    retired: row.retired as boolean,
    createdAt: row.created_at as string,
  };
}

export async function getClosetItems(): Promise<UserGearItem[]> {
  const supabase = createClient();

  // Fetch all user gear items
  const { data, error } = await supabase
    .from("user_gear")
    .select("*")
    .eq("retired", false)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapUserGearRow);
}

export async function getClosetItemsWithGear(): Promise<UserGearItem[]> {
  const supabase = createClient();

  // Get user gear
  const { data: userGearData, error } = await supabase
    .from("user_gear")
    .select("*")
    .eq("retired", false)
    .order("created_at", { ascending: false });

  if (error || !userGearData) return [];

  const items = userGearData.map(mapUserGearRow);

  // Fetch linked gear item details
  const gearItemIds = items
    .map((i) => i.gearItemId)
    .filter((id): id is string => id !== null);

  if (gearItemIds.length > 0) {
    const { data: gearData } = await supabase
      .from("gear_items")
      .select("*")
      .in("id", gearItemIds);

    if (gearData) {
      const gearMap = new Map(gearData.map((g) => [g.id, g]));
      items.forEach((item) => {
        if (item.gearItemId && gearMap.has(item.gearItemId)) {
          const row = gearMap.get(item.gearItemId)!;
          item.gearItem = {
            id: row.id,
            name: row.name,
            brand: row.brand,
            category: row.category as GearCategory,
            subcategory: row.subcategory || undefined,
            tier: row.tier,
            weightOz: row.weight_oz,
            priceUsd: row.price_usd,
            description: row.description,
            url: row.url || undefined,
          } as GearItem;
        }
      });
    }
  }

  return items;
}

export async function addToCloset(params: {
  gearItemId?: string;
  customName?: string;
  customBrand?: string;
  customWeightOz?: number;
  customCategory?: string;
  nickname?: string;
  notes?: string;
}): Promise<UserGearItem | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_gear")
    .insert({
      user_id: user.id,
      gear_item_id: params.gearItemId || null,
      custom_name: params.customName || null,
      custom_brand: params.customBrand || null,
      custom_weight_oz: params.customWeightOz || null,
      custom_category: params.customCategory || null,
      nickname: params.nickname || null,
      notes: params.notes || null,
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapUserGearRow(data);
}

export async function removeFromCloset(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_gear")
    .delete()
    .eq("id", id);
  return !error;
}

export async function updateClosetItem(
  id: string,
  updates: {
    nickname?: string | null;
    condition?: string;
    notes?: string | null;
    retired?: boolean;
    startingMiles?: number;
    startingNights?: number;
    purchaseDate?: string | null;
    purchasePrice?: number | null;
  }
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_gear")
    .update({
      nickname: updates.nickname,
      condition: updates.condition,
      notes: updates.notes,
      retired: updates.retired,
      starting_miles: updates.startingMiles,
      starting_nights: updates.startingNights,
      purchase_date: updates.purchaseDate,
      purchase_price: updates.purchasePrice,
    })
    .eq("id", id);
  return !error;
}
