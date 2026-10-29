"use client";

import { ChevronUp, ShoppingCart, Trash2, X } from "lucide-react";
import { useMemo } from "react";
import { formatPrice, shoppingList } from "@/features/planner/lib/pricing";
import { usePlannerStore } from "@/features/planner/store/usePlannerStore";
import { categoryIcons } from "./icons";
import { toast } from "./Toast";

function useList() {
  const items = usePlannerStore((s) => s.design?.items);
  return useMemo(() => shoppingList(items ?? []), [items]);
}

/** Persistent bottom bar with item count + total. */
export function ListBar() {
  const { count, total } = useList();
  const setListOpen = usePlannerStore((s) => s.setListOpen);
  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-t border-stone-200 bg-white px-4">
      <p className="flex items-center gap-2 text-sm text-stone-700">
        <ShoppingCart className="size-4" />
        <span>
          <span className="font-semibold text-stone-900">{count}</span> {count === 1 ? "item" : "items"} ·{" "}
          <span className="font-semibold text-stone-900">{formatPrice(total)}</span>
        </span>
      </p>
      <button
        type="button"
        onClick={() => setListOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
      >
        View list <ChevronUp className="size-4" />
      </button>
    </div>
  );
}

export default function ShoppingListDrawer() {
  const open = usePlannerStore((s) => s.listOpen);
  const setListOpen = usePlannerStore((s) => s.setListOpen);
  const removeItems = usePlannerStore((s) => s.removeItems);
  const { lines, count, total } = useList();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-stone-900/30 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setListOpen(false)}
        aria-hidden
      />
      <section
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[80vh] max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        aria-label="Shopping list"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-base font-semibold text-stone-900">Shopping list · {count} items</h2>
          <button type="button" onClick={() => setListOpen(false)} className="rounded-full p-1.5 hover:bg-stone-100" aria-label="Close shopping list">
            <X className="size-4" />
          </button>
        </div>

        <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto px-5">
          {lines.map((l) => {
            const Icon = categoryIcons[l.product.category];
            const color = l.product.colors.find((c) => c.id === l.colorId);
            return (
              <li key={`${l.product.id}:${l.colorId}`} className="flex items-center gap-3 py-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color?.hex ?? "#ddd"}66` }}>
                  <Icon className="size-6 text-stone-700" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{l.product.name}</p>
                  <p className="text-xs text-stone-500">
                    {color?.label ?? "Default"} · {l.product.sku} · {l.quantity} × {formatPrice(l.product.price)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-stone-900">{formatPrice(l.lineTotal)}</p>
                <button
                  type="button"
                  onClick={() => removeItems(l.uids)}
                  className="rounded-full p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${l.product.name} from room`}
                  title="Remove from room"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
          {lines.length === 0 && <li className="py-10 text-center text-sm text-stone-500">Your room is empty. Add products from the catalog.</li>}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-5 py-4">
          <div>
            <p className="text-xs text-stone-500">Total</p>
            <p className="text-lg font-semibold text-stone-900">{formatPrice(total)}</p>
          </div>
          <button
            type="button"
            disabled={count === 0}
            onClick={() => {
              toast(`Added ${count} items to cart (demo)`);
              setListOpen(false);
            }}
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40"
          >
            Add all to cart
          </button>
        </div>
      </section>
    </>
  );
}
