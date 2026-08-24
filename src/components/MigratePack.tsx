"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { addToCloset } from "@/lib/closet-api";
import { createLoadout, addItemToLoadout } from "@/lib/loadout-api";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Check, Loader2 } from "lucide-react";

interface LocalPackItem {
  gearId: string;
  item: {
    id: string;
    name: string;
    brand: string;
    category: string;
    weightOz: number;
    priceUsd: number;
  };
  status: "packed" | "worn" | "consumable";
  quantity: number;
}

interface LocalLoadout {
  id: string;
  name: string;
  items: LocalPackItem[];
}

interface LocalStoreData {
  state: {
    loadouts: LocalLoadout[];
    activeLoadoutId: string;
  };
}

/**
 * Detects existing localStorage pack data and offers to migrate it
 * to the user's server-side account (closet + loadouts).
 *
 * Renders as a banner at the top of /closet or /loadouts pages.
 */
export function MigratePack() {
  const { user } = useAuth();
  const [localData, setLocalData] = useState<LocalStoreData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ closetItems: 0, loadouts: 0 });

  useEffect(() => {
    if (!user) return;
    // Check if we already migrated
    const migrated = localStorage.getItem("hikemind-migration-done");
    if (migrated) {
      setDismissed(true);
      return;
    }

    // Check for existing pack data
    try {
      const raw = localStorage.getItem("hikemind-pack-v2");
      if (!raw) return;
      const parsed = JSON.parse(raw) as LocalStoreData;
      const totalItems = parsed.state.loadouts.reduce(
        (sum, l) => sum + l.items.length,
        0
      );
      if (totalItems === 0) return;
      setLocalData(parsed);
    } catch {
      // Invalid data, ignore
    }
  }, [user]);

  if (!localData || dismissed || done) return null;

  const totalItems = localData.state.loadouts.reduce(
    (sum, l) => sum + l.items.length,
    0
  );
  const loadoutCount = localData.state.loadouts.length;

  async function handleMigrate() {
    if (!localData || !user) return;
    setMigrating(true);

    const supabase = createClient();
    let closetItemCount = 0;
    let loadoutsMigrated = 0;

    try {
      // Step 1: Add all unique items to the gear closet
      // Track gearId → user_gear_id mapping for loadout assembly
      const gearIdToUserGearId = new Map<string, string>();

      // Collect unique items across all loadouts
      const seen = new Set<string>();
      const uniqueItems: LocalPackItem[] = [];
      for (const loadout of localData.state.loadouts) {
        for (const item of loadout.items) {
          if (!seen.has(item.gearId)) {
            seen.add(item.gearId);
            uniqueItems.push(item);
          }
        }
      }

      // Add each to closet
      for (const packItem of uniqueItems) {
        const isFromDB =
          !packItem.gearId.startsWith("quick-") &&
          !packItem.gearId.startsWith("lp-") &&
          !packItem.gearId.startsWith("shared-");

        let result;
        if (isFromDB) {
          // Try linking to the gear database
          result = await addToCloset({ gearItemId: packItem.gearId });
        }

        if (!result) {
          // Add as custom item
          result = await addToCloset({
            customName: packItem.item.name,
            customBrand: packItem.item.brand || undefined,
            customWeightOz: packItem.item.weightOz,
            customCategory: packItem.item.category,
          });
        }

        if (result) {
          gearIdToUserGearId.set(packItem.gearId, result.id);
          closetItemCount++;
        }
      }

      // Step 2: Create loadouts and populate them
      for (const localLoadout of localData.state.loadouts) {
        if (localLoadout.items.length === 0) continue;

        const newLoadout = await createLoadout({ name: localLoadout.name });
        if (!newLoadout) continue;

        for (const packItem of localLoadout.items) {
          const userGearId = gearIdToUserGearId.get(packItem.gearId);
          if (userGearId) {
            await addItemToLoadout({
              loadoutId: newLoadout.id,
              userGearId,
              status: packItem.status,
            });
          }
        }
        loadoutsMigrated++;
      }

      // Mark migration as done
      localStorage.setItem("hikemind-migration-done", "true");
      setStats({ closetItems: closetItemCount, loadouts: loadoutsMigrated });
      setDone(true);
    } catch (err) {
      console.error("Migration error:", err);
    } finally {
      setMigrating(false);
    }
  }

  if (done) {
    return (
      <div className="mx-4 mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-3">
          <Check className="size-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-300">Migration complete</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Added {stats.closetItems} items to your closet and created {stats.loadouts} loadout{stats.loadouts !== 1 ? "s" : ""}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Upload className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">
              Migrate your existing pack data
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              We found {totalItems} items across {loadoutCount} loadout{loadoutCount !== 1 ? "s" : ""} saved in your browser.
              Import them to your account so they sync across devices.
            </p>
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-medium hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {migrating ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>Import to my account</>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md hover:bg-white/5 text-zinc-500"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
