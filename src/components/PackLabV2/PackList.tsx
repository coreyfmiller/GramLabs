"use client";

import { useState } from "react";
import { GripVertical, Minus, Plus, Shirt, Trash2 } from "lucide-react";
import {
  GearCategory,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/data/gear-database";
import { usePackStore, PackItem } from "@/store/pack-store";
import { formatWeight } from "@/utils/format";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: GearCategory[] = [
  "shelter",
  "insulation",
  "sleeping-pad",
  "sleep-system",
  "pack",
  "clothing",
  "cooking",
  "water",
  "electronics",
  "hygiene",
  "navigation",
  "safety",
  "accessories",
];

export function PackList() {
  const getItems = usePackStore((s) => s.getItems);
  const getPackName = usePackStore((s) => s.getPackName);
  const getBaseWeight = usePackStore((s) => s.getBaseWeight);
  const removeItem = usePackStore((s) => s.removeItem);
  const updateItemStatus = usePackStore((s) => s.updateItemStatus);
  const updateItemQuantity = usePackStore((s) => s.updateItemQuantity);

  const items = getItems();
  const packName = getPackName();
  const baseWeight = getBaseWeight();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const groups = CATEGORY_ORDER.map((id) => ({
    category: id,
    items: items.filter((i) => i.item.category === id),
  })).filter((g) => g.items.length > 0);

  function endDrag() {
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 p-4 md:px-6">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            My Pack
          </h2>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            {packName}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <Metric
            label="Items"
            value={String(items.reduce((s, i) => s + i.quantity, 0))}
          />
          <span
            aria-hidden="true"
            className="hidden h-8 w-px bg-white/10 sm:block"
          />
          <div className="hidden sm:block">
            <Metric
              label="Base weight"
              value={formatWeight(baseWeight)}
              accent
            />
          </div>
        </div>
      </header>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4 md:px-6">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-10 text-center">
            <p className="text-sm font-medium">Your pack is empty</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add gear from the library to start tracking your base weight.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 pb-4">
            {groups.map(({ category, items: groupItems }) => {
              const groupWeight = groupItems.reduce(
                (s, i) => s + i.item.weightOz * i.quantity,
                0
              );
              const share =
                baseWeight > 0 ? groupWeight / baseWeight : 0;

              return (
                <section key={category} className="rounded-xl transition-colors">
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[category],
                      }}
                    />
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      {CATEGORY_LABELS[category]}
                    </h3>
                    <span className="num text-[11px] text-muted-foreground">
                      {groupItems.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-px flex-1 bg-white/[0.07]"
                    />
                    <span className="num text-[11px] text-muted-foreground">
                      {(share * 100).toFixed(0)}%
                    </span>
                    <span className="num text-sm font-medium">
                      {groupWeight.toFixed(1)} oz
                    </span>
                  </div>

                  <ul className="flex flex-col gap-1.5">
                    {groupItems.map((packItem) => (
                      <li
                        key={packItem.gearId}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData(
                            "text/plain",
                            packItem.gearId
                          );
                          setDraggingId(packItem.gearId);
                        }}
                        onDragEnd={endDrag}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setOverId(packItem.gearId);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Reorder is visual-only (no store persistence yet)
                          endDrag();
                        }}
                        aria-grabbed={draggingId === packItem.gearId}
                      >
                        <PackRow
                          packItem={packItem}
                          color={CATEGORY_COLORS[category]}
                          dragging={draggingId === packItem.gearId}
                          dropTarget={
                            overId === packItem.gearId &&
                            draggingId !== packItem.gearId
                          }
                          onRemove={() => removeItem(packItem.gearId)}
                          onQty={(delta) =>
                            updateItemQuantity(
                              packItem.gearId,
                              Math.max(1, packItem.quantity + delta)
                            )
                          }
                          onToggleWorn={() =>
                            updateItemStatus(
                              packItem.gearId,
                              packItem.status === "worn" ? "packed" : "worn"
                            )
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "num text-base font-semibold leading-tight",
          accent ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PackRow({
  packItem,
  color,
  dragging,
  dropTarget,
  onRemove,
  onQty,
  onToggleWorn,
}: {
  packItem: PackItem;
  color: string;
  dragging: boolean;
  dropTarget: boolean;
  onRemove: () => void;
  onQty: (delta: number) => void;
  onToggleWorn: () => void;
}) {
  const isWorn = packItem.status === "worn";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2 py-2.5 transition-all duration-200 sm:gap-3 sm:px-3",
        "hover:border-white/20 hover:bg-white/[0.05]",
        dragging && "opacity-40",
        dropTarget && "border-primary/60 bg-primary/[0.06]"
      )}
    >
      <span
        aria-hidden="true"
        className="hidden cursor-grab text-muted-foreground/40 transition-colors group-hover:text-muted-foreground active:cursor-grabbing sm:block"
      >
        <GripVertical className="size-4" />
      </span>

      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-pretty text-sm font-medium leading-tight">
            {packItem.item.name}
          </p>
          {isWorn && (
            <span className="shrink-0 rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-primary">
              Worn
            </span>
          )}
        </div>
        <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
          {packItem.item.brand}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:focus-within:opacity-100 sm:group-hover:opacity-100">
        <IconButton
          label={`Decrease quantity of ${packItem.item.name}`}
          onClick={() => onQty(-1)}
          icon={<Minus className="size-3.5" />}
        />
        <span className="num w-4 text-center text-xs text-muted-foreground">
          {packItem.quantity}
        </span>
        <IconButton
          label={`Increase quantity of ${packItem.item.name}`}
          onClick={() => onQty(1)}
          icon={<Plus className="size-3.5" />}
        />
      </div>

      <div className="shrink-0 text-right">
        <span className="num text-sm font-medium">
          {(packItem.item.weightOz * packItem.quantity).toFixed(1)}
        </span>
        <span className="ml-1 text-[10px] text-muted-foreground">oz</span>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton
          label={
            isWorn
              ? `Mark ${packItem.item.name} as packed`
              : `Mark ${packItem.item.name} as worn`
          }
          onClick={onToggleWorn}
          active={isWorn}
          icon={<Shirt className="size-3.5" />}
        />
        <IconButton
          label={`Remove ${packItem.item.name} from pack`}
          onClick={onRemove}
          danger
          icon={<Trash2 className="size-3.5" />}
        />
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  icon,
  active,
  danger,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-7 items-center justify-center rounded-md transition-colors active:scale-95",
        active
          ? "bg-primary/15 text-primary"
          : danger
            ? "text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
            : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
      )}
    >
      {icon}
    </button>
  );
}
