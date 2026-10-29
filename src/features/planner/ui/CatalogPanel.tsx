"use client";

import { PanelLeftClose, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { categories, filterProducts, getProduct } from "@/data/products";
import { formatPrice } from "@/features/planner/lib/pricing";
import { usePlannerStore } from "@/features/planner/store/usePlannerStore";
import type { Product } from "@/types/planner";
import { categoryIcons } from "./icons";

export const PRODUCT_DRAG_TYPE = "application/x-roomcraft-product";

const priceOptions = [
  { label: "Any price", value: "" },
  { label: "Under ฿1,000", value: "1000" },
  { label: "Under ฿3,000", value: "3000" },
  { label: "Under ฿8,000", value: "8000" },
  { label: "Under ฿15,000", value: "15000" },
];

export default function CatalogPanel() {
  const mode = usePlannerStore((s) => s.mode);
  const selectedUid = usePlannerStore((s) => s.selectedUid);
  const selectedProductId = usePlannerStore((s) => s.design?.items.find((i) => i.uid === s.selectedUid)?.productId);
  const category = usePlannerStore((s) => s.catalogCategory);
  const setCatalogOpen = usePlannerStore((s) => s.setCatalogOpen);
  const setMode = usePlannerStore((s) => s.setMode);
  const addItem = usePlannerStore((s) => s.addItem);
  const swapItem = usePlannerStore((s) => s.swapItem);
  const [q, setQ] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const swapping = mode === "swapping" && !!selectedUid;
  const swapFrom = swapping && selectedProductId ? getProduct(selectedProductId) : undefined;

  const list = useMemo(
    () =>
      filterProducts({
        category: swapFrom ? swapFrom.category : category,
        q,
        maxPrice: maxPrice ? Number(maxPrice) : null,
      }).filter((p) => p.id !== swapFrom?.id),
    [swapFrom, category, q, maxPrice],
  );

  function pick(p: Product) {
    if (swapping && selectedUid) swapItem(selectedUid, p.id);
    else addItem(p.id);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        {swapFrom ? (
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Swap mode</p>
            <h2 className="truncate text-base font-semibold text-stone-900">Swap {swapFrom.name}</h2>
          </div>
        ) : (
          <h2 className="text-base font-semibold text-stone-900">Products</h2>
        )}
        {swapFrom ? (
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="inline-flex items-center gap-1 rounded-full border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
          >
            <X className="size-3.5" /> Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCatalogOpen(false)}
            className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100"
            aria-label="Close catalog"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      <div className="space-y-2 px-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-stone-400 focus:bg-white"
          />
        </label>
        <select
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-full rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
          aria-label="Filter by price"
        >
          {priceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {!swapFrom && (
        <div className="flex gap-1.5 overflow-x-auto px-4 py-3 md:flex-wrap">
          <Chip active={!category} onClick={() => setCatalogOpen(true, null)}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCatalogOpen(true, c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
      )}

      <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2.5 overflow-y-auto px-4 pb-4 pt-1">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} onPick={() => pick(p)} />
        ))}
        {list.length === 0 && <p className="col-span-2 py-8 text-center text-sm text-stone-500">No products match.</p>}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
        active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
      }`}
    >
      {children}
    </button>
  );
}

function ProductCard({ product, onPick }: { product: Product; onPick: () => void }) {
  const Icon = categoryIcons[product.category];
  const [c1, c2] = [product.colors[0]?.hex ?? "#ddd", product.colors[1]?.hex ?? product.colors[0]?.hex ?? "#bbb"];
  const { w, d, h } = product.dimensions;
  const cm = (m: number) => Math.round(m * 100);
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(PRODUCT_DRAG_TYPE, product.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={onPick}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white text-left transition hover:border-stone-400 hover:shadow-md"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center" style={{ background: `linear-gradient(135deg, ${c1}55, ${c2}aa)` }}>
        <Icon className="size-9 text-stone-700/70 transition group-hover:scale-110" strokeWidth={1.5} />
        <div className="absolute bottom-1.5 left-1.5 flex gap-1">
          {product.colors.map((c) => (
            <span key={c.id} className="size-2.5 rounded-full ring-1 ring-white" style={{ background: c.hex }} title={c.label} />
          ))}
        </div>
      </div>
      <div className="p-2">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-stone-900">{product.name}</p>
        <p className="mt-0.5 text-sm font-semibold text-stone-900">{formatPrice(product.price)}</p>
        <p className="text-[10px] text-stone-500">
          {cm(w)}×{cm(d)}×{cm(h)} cm
        </p>
      </div>
    </button>
  );
}
