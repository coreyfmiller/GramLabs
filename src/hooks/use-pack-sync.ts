"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePackStore, PackItem, Loadout } from "@/store/pack-store";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";

/**
 * Syncs Pack Lab's Zustand store to Supabase.
 *
 * - On mount: loads loadouts from Supabase into the store
 * - On store changes: debounces writes back to Supabase
 * - Supabase is the sole source of truth
 */
export function usePackSync() {
  const { user } = useAuth();
  const supabase = createClient();
  const syncingRef = useRef(false);
  const initializedRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load from Supabase on first mount when authenticated
  const loadFromServer = useCallback(async () => {
    if (!user || initializedRef.current) return;
    initializedRef.current = true;
    syncingRef.current = true;

    try {
      // Fetch user's loadouts
      const { data: loadoutsData } = await supabase
        .from("loadouts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!loadoutsData || loadoutsData.length === 0) {
        // No server data — new user, nothing to load
        syncingRef.current = false;
        return;
      }

      // Fetch all loadout items
      const loadoutIds = loadoutsData.map((l) => l.id);
      const { data: itemsData } = await supabase
        .from("loadout_items")
        .select("*")
        .in("loadout_id", loadoutIds);

      // Fetch the linked user_gear items to get gear details
      const userGearIds = [
        ...new Set((itemsData || []).map((i) => i.user_gear_id)),
      ];

      let gearMap = new Map<string, { gear_item_id: string | null; custom_name: string | null; custom_brand: string | null; custom_weight_oz: number | null; custom_category: string | null }>();

      if (userGearIds.length > 0) {
        const { data: userGearData } = await supabase
          .from("user_gear")
          .select("id, gear_item_id, custom_name, custom_brand, custom_weight_oz, custom_category")
          .in("id", userGearIds);

        if (userGearData) {
          gearMap = new Map(userGearData.map((g) => [g.id, g]));
        }

        // Also fetch the actual gear_items for linked items
        const linkedGearIds = userGearData
          ?.map((g) => g.gear_item_id)
          .filter((id): id is string => id !== null) || [];

        if (linkedGearIds.length > 0) {
          const { data: gearItemsData } = await supabase
            .from("gear_items")
            .select("id, name, brand, category, weight_oz, price_usd, description, url, tier, subcategory")
            .in("id", linkedGearIds);

          if (gearItemsData) {
            const gearItemsMap = new Map(gearItemsData.map((g) => [g.id, g]));

            // Assemble loadouts in the store format
            const storeLoadouts: Loadout[] = loadoutsData.map((loadout) => {
              const loadoutItems = (itemsData || []).filter(
                (i) => i.loadout_id === loadout.id
              );

              const packItems: PackItem[] = loadoutItems
                .map((li) => {
                  const userGear = gearMap.get(li.user_gear_id);
                  if (!userGear) return null;

                  if (userGear.gear_item_id) {
                    // Linked to database
                    const gearItem = gearItemsMap.get(userGear.gear_item_id);
                    if (!gearItem) return null;

                    return {
                      gearId: gearItem.id,
                      item: {
                        id: gearItem.id,
                        name: gearItem.name,
                        brand: gearItem.brand,
                        category: gearItem.category,
                        subcategory: gearItem.subcategory || undefined,
                        tier: gearItem.tier || "mid",
                        weightOz: gearItem.weight_oz,
                        priceUsd: gearItem.price_usd,
                        description: gearItem.description || "",
                        url: gearItem.url || undefined,
                      },
                      status: li.status as "packed" | "worn" | "consumable",
                      quantity: li.quantity || 1,
                      starred: false,
                    } as PackItem;
                  } else {
                    // Custom item
                    const customId = `custom-${li.user_gear_id}`;
                    return {
                      gearId: customId,
                      item: {
                        id: customId,
                        name: userGear.custom_name || "Unknown",
                        brand: userGear.custom_brand || "",
                        category: userGear.custom_category || "accessories",
                        tier: "mid",
                        weightOz: userGear.custom_weight_oz || 0,
                        priceUsd: 0,
                        description: "",
                      },
                      status: li.status as "packed" | "worn" | "consumable",
                      quantity: li.quantity || 1,
                      starred: false,
                    } as PackItem;
                  }
                })
                .filter((item): item is PackItem => item !== null);

              return {
                id: loadout.id,
                name: loadout.name,
                items: packItems,
              };
            });

            if (storeLoadouts.length > 0) {
              // Replace store loadouts with server data
              usePackStore.setState({
                loadouts: storeLoadouts,
                activeLoadoutId: storeLoadouts[0].id,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn("[pack-sync] Failed to load from server:", err);
    } finally {
      syncingRef.current = false;
    }
  }, [user, supabase]);

  // Save current store state to Supabase
  const saveToServer = useCallback(async () => {
    if (!user || syncingRef.current) return;
    syncingRef.current = true;

    try {
      const state = usePackStore.getState();

      for (const loadout of state.loadouts) {
        // Upsert loadout
        const { data: existingLoadout } = await supabase
          .from("loadouts")
          .select("id")
          .eq("id", loadout.id)
          .single();

        if (existingLoadout) {
          // Update existing
          await supabase
            .from("loadouts")
            .update({ name: loadout.name, updated_at: new Date().toISOString() })
            .eq("id", loadout.id);
        } else {
          // Insert new — generate a proper UUID-friendly ID from the store ID
          await supabase.from("loadouts").insert({
            id: loadout.id.length < 36
              ? crypto.randomUUID()
              : loadout.id,
            user_id: user.id,
            name: loadout.name,
            slug: loadout.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          });

          // If we generated a new UUID, update the store
          if (loadout.id.length < 36) {
            // Skip — this gets complex. For now, only sync loadouts that came from the server.
          }
        }

        // Sync items: delete existing items for this loadout, then re-insert
        if (existingLoadout) {
          await supabase
            .from("loadout_items")
            .delete()
            .eq("loadout_id", loadout.id);

          for (const packItem of loadout.items) {
            // Find or create the user_gear entry
            const isDBItem =
              !packItem.gearId.startsWith("quick-") &&
              !packItem.gearId.startsWith("lp-") &&
              !packItem.gearId.startsWith("shared-") &&
              !packItem.gearId.startsWith("custom-");

            let userGearId: string | null = null;

            if (isDBItem) {
              // Check if user already has this gear in their closet
              const { data: existing } = await supabase
                .from("user_gear")
                .select("id")
                .eq("gear_item_id", packItem.gearId)
                .single();

              if (existing) {
                userGearId = existing.id;
              } else {
                // Add to closet
                const { data: newGear } = await supabase
                  .from("user_gear")
                  .insert({
                    user_id: user.id,
                    gear_item_id: packItem.gearId,
                  })
                  .select("id")
                  .single();
                userGearId = newGear?.id || null;
              }
            } else {
              // Custom item — find or create
              const { data: existing } = await supabase
                .from("user_gear")
                .select("id")
                .eq("user_id", user.id)
                .eq("custom_name", packItem.item.name)
                .eq("custom_weight_oz", packItem.item.weightOz)
                .single();

              if (existing) {
                userGearId = existing.id;
              } else {
                const { data: newGear } = await supabase
                  .from("user_gear")
                  .insert({
                    user_id: user.id,
                    custom_name: packItem.item.name,
                    custom_brand: packItem.item.brand || null,
                    custom_weight_oz: packItem.item.weightOz,
                    custom_category: packItem.item.category || "accessories",
                  })
                  .select("id")
                  .single();
                userGearId = newGear?.id || null;
              }
            }

            if (userGearId) {
              await supabase.from("loadout_items").insert({
                loadout_id: loadout.id,
                user_gear_id: userGearId,
                status: packItem.status,
                quantity: packItem.quantity,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn("[pack-sync] Failed to save to server:", err);
    } finally {
      syncingRef.current = false;
    }
  }, [user, supabase]);

  // Debounced save — triggers on store changes
  const debouncedSave = useCallback(() => {
    if (!user || syncingRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveToServer();
    }, 3000); // 3s debounce to batch rapid changes
  }, [user, saveToServer]);

  // Subscribe to store changes
  useEffect(() => {
    if (!user) return;

    // Load from server on mount
    loadFromServer();

    // Subscribe to future changes
    const unsub = usePackStore.subscribe(() => {
      if (!syncingRef.current) {
        debouncedSave();
      }
    });

    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user, loadFromServer, debouncedSave]);
}
