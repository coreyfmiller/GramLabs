"use client";

import { Trash2 } from "lucide-react";
import { usePackStore, ItemStatus, PackItem } from "@/store/pack-store";
import { formatWeight } from "@/store/pack-store";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/data/gear-database";

export default function PackList() {
  const { items, removeItem, updateItemStatus, weightUnit } = usePackStore();

  const packedItems = items.filter((i) => i.status === "packed");
  const wornItems = items.filter((i) => i.status === "worn");
  const consumableItems = items.filter((i) => i.status === "consumable");

  if (items.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 text-center">
        <p className="text-[15px] text-white/40 mb-2">Your pack is empty</p>
        <p className="text-[13px] text-white/25">
          Search the gear database and add items to start building your loadout.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {packedItems.length > 0 && (
        <PackSection
          title="Packed"
          subtitle={`${packedItems.length} items`}
          items={packedItems}
          onRemove={removeItem}
          onStatusChange={updateItemStatus}
          weightUnit={weightUnit}
        />
      )}
      {wornItems.length > 0 && (
        <PackSection
          title="Worn"
          subtitle={`${wornItems.length} items`}
          items={wornItems}
          onRemove={removeItem}
          onStatusChange={updateItemStatus}
          weightUnit={weightUnit}
        />
      )}
      {consumableItems.length > 0 && (
        <PackSection
          title="Consumable"
          subtitle={`${consumableItems.length} items`}
          items={consumableItems}
          onRemove={removeItem}
          onStatusChange={updateItemStatus}
          weightUnit={weightUnit}
        />
      )}
    </div>
  );
}

function PackSection({
  title,
  subtitle,
  items,
  onRemove,
  onStatusChange,
  weightUnit,
}: {
  title: string;
  subtitle: string;
  items: PackItem[];
  onRemove: (id: string) => void;
  onStatusChange: (id: string, status: ItemStatus) => void;
  weightUnit: "oz" | "g";
}) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[13px] font-bold tracking-[0.15em] text-white uppercase">
            {title}
          </h3>
          <span className="text-[11px] text-white/30">{subtitle}</span>
        </div>
        <span className="text-[11px] font-[family-name:var(--font-jetbrains-mono)] text-white/50">
          {formatWeight(items.reduce((s, i) => s + i.item.weightOz * i.quantity, 0), weightUnit)}
        </span>
      </div>
      <div className="divide-y divide-white/5">
        {items.map((packItem) => (
          <div
            key={packItem.gearId}
            className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[packItem.item.category] }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-medium text-white block truncate">
                  {packItem.item.brand} {packItem.item.name}
                </span>
                <span className="text-[10px] text-white/30 uppercase tracking-wide">
                  {CATEGORY_LABELS[packItem.item.category]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[12px] font-[family-name:var(--font-jetbrains-mono)] text-white/60">
                {formatWeight(packItem.item.weightOz, weightUnit)}
              </span>

              {/* Status toggle */}
              <select
                value={packItem.status}
                onChange={(e) =>
                  onStatusChange(packItem.gearId, e.target.value as ItemStatus)
                }
                className="bg-white/[0.05] border border-white/10 rounded px-2 py-1 text-[10px] text-white/60 outline-none uppercase tracking-wide"
              >
                <option value="packed">Packed</option>
                <option value="worn">Worn</option>
                <option value="consumable">Consumable</option>
              </select>

              {/* Remove */}
              <button
                onClick={() => onRemove(packItem.gearId)}
                className="p-1 text-white/20 hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
