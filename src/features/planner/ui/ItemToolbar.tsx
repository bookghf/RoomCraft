"use client";

import { Copy, Move, Repeat, RotateCw, Trash2 } from "lucide-react";
import { getProduct } from "@/data/products";
import { formatPrice } from "@/features/planner/lib/pricing";
import { usePlannerStore } from "@/features/planner/store/usePlannerStore";

const iconBtn = "inline-flex size-8 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100";

export default function ItemToolbar() {
  const item = usePlannerStore((s) => s.design?.items.find((i) => i.uid === s.selectedUid));
  const rotateItem = usePlannerStore((s) => s.rotateItem);
  const duplicateItem = usePlannerStore((s) => s.duplicateItem);
  const removeItem = usePlannerStore((s) => s.removeItem);
  const setItemColor = usePlannerStore((s) => s.setItemColor);
  const setMode = usePlannerStore((s) => s.setMode);
  const setCatalogOpen = usePlannerStore((s) => s.setCatalogOpen);
  const product = item && getProduct(item.productId);
  if (!item || !product) return null;
  const colorId = item.colorId ?? product.colors[0]?.id;

  return (
    <div
      className="flex select-none flex-col items-center gap-1.5"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-xs shadow-md ring-1 ring-stone-200">
        <span className="font-medium text-stone-900">{product.name}</span>
        <span className="text-stone-500">{formatPrice(product.price)}</span>
        {product.colors.length > 1 && (
          <span className="flex gap-1 border-l border-stone-200 pl-2">
            {product.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                aria-label={`Colour ${c.label}`}
                onClick={() => setItemColor(item.uid, c.id)}
                className={`size-4 rounded-full ring-offset-1 ${c.id === colorId ? "ring-2 ring-stone-900" : "ring-1 ring-stone-300"}`}
                style={{ background: c.hex }}
              />
            ))}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5 rounded-full bg-white p-1 shadow-lg ring-1 ring-stone-200">
        <span className={`${iconBtn} cursor-grab`} title="Drag the item to move it" aria-label="Move: drag the item">
          <Move className="size-4" />
        </span>
        {product.mount !== "wall" && (
          <button type="button" className={iconBtn} title="Rotate 90° (R)" aria-label="Rotate 90°" onClick={() => rotateItem(item.uid)}>
            <RotateCw className="size-4" />
          </button>
        )}
        <button type="button" className={iconBtn} title="Duplicate (D)" aria-label="Duplicate" onClick={() => duplicateItem(item.uid)}>
          <Copy className="size-4" />
        </button>
        <button
          type="button"
          className={iconBtn}
          title="Swap for a similar product"
          aria-label="Swap"
          onClick={() => {
            setMode("swapping");
            setCatalogOpen(true);
          }}
        >
          <Repeat className="size-4" />
        </button>
        <button
          type="button"
          className={`${iconBtn} text-red-600 hover:bg-red-50`}
          title="Delete (Del)"
          aria-label="Delete"
          onClick={() => removeItem(item.uid)}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
