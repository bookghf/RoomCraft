"use client";

import {
  AirVent,
  Archive,
  Armchair,
  BedDouble,
  BedSingle,
  BookOpen,
  Box,
  Clock,
  Fan,
  Flower2,
  Frame,
  Lamp,
  LampCeiling,
  LampDesk,
  LampFloor,
  LampWallUp,
  Monitor,
  Search,
  Shirt,
  Sofa,
  Sprout,
  Table2,
  Tv,
  Wine,
  X,
  type LucideIcon,
} from "lucide-react";
import { createElement, useMemo } from "react";
import { catalog, categories, formatPrice, getCatalogItem, searchCatalog } from "@/features/designer/data/catalog";
import { tx, useLang, useT } from "@/features/designer/i18n";
import { designerStorage } from "@/features/designer/lib/storage";
import { useDesigner } from "@/features/designer/store";
import type { CatalogItem } from "@/features/designer/types";

export const ITEM_DRAG_TYPE = "application/x-roomcraft-designer-item";

const icons: Record<string, LucideIcon> = {
  "bed-double": BedDouble,
  "bed-single": BedSingle,
  "dressing-table": Frame,
  bookshelf: BookOpen,
  "clothes-rack": Shirt,
  sofa: Sofa,
  armchair: Armchair,
  "office-chair": Armchair,
  "floor-lamp": LampFloor,
  "table-lamp": LampDesk,
  plant: Flower2,
  "plant-small": Sprout,
  vase: Wine,
  "wall-art": Frame,
  mirror: Frame,
  "wall-tv": Tv,
  "air-conditioner": AirVent,
  "wall-lamp": LampWallUp,
  pendant: LampCeiling,
  "ceiling-lamp": Lamp,
  "ceiling-fan": Fan,
  "desk-shelves": Monitor,
};

const categoryIcon: Record<string, LucideIcon> = {
  bedroom: BedDouble,
  storage: Archive,
  seating: Armchair,
  tables: Table2,
  decor: Flower2,
  wall: Frame,
  ceiling: LampCeiling,
};

function itemIcon(item: CatalogItem | undefined): LucideIcon {
  if (!item) return Box;
  return icons[item.id] ?? categoryIcon[item.category] ?? Box;
}

export function ItemIcon({ item, className, strokeWidth }: { item: CatalogItem | undefined; className?: string; strokeWidth?: number }) {
  return createElement(itemIcon(item), { className, strokeWidth });
}

const cm = (m: number) => Math.round(m * 100);

export default function CatalogPanel() {
  const t = useT();
  const lang = useLang();
  const tab = useDesigner((s) => s.catalogTab);
  const search = useDesigner((s) => s.search);
  const patch = useDesigner((s) => s.patch);
  const addItem = useDesigner((s) => s.addItem);
  const itemCount = useDesigner((s) => s.doc?.items.length);

  const list = useMemo(() => {
    if (search.trim()) return searchCatalog(search);
    if (tab === "recent") return designerStorage().recentItems().flatMap((id) => getCatalogItem(id) ?? []);
    return catalog.filter((c) => c.category === tab && !c.hidden);
    // itemCount refreshes the Recently used tab after adding
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab, itemCount]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-3 pt-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => patch({ search: e.target.value })}
            placeholder={t("search")}
            className="w-full rounded-full border border-stone-200 bg-stone-50 py-2 pl-9 pr-9 text-sm outline-none [&::-webkit-search-cancel-button]:hidden focus:border-stone-400 focus:bg-white"
          />
          {search && (
            <button type="button" onClick={() => patch({ search: "" })} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700" aria-label={t("close")}>
              <X className="size-4" />
            </button>
          )}
        </label>
      </div>

      {!search.trim() && (
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] md:flex-wrap">
          <Chip active={tab === "recent"} onClick={() => patch({ catalogTab: "recent" })} icon={Clock}>
            {t("recentlyUsed")}
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={tab === c.id} onClick={() => patch({ catalogTab: c.id })} icon={categoryIcon[c.id]}>
              {tx(c.name, lang)}
            </Chip>
          ))}
        </div>
      )}

      <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-3 gap-2 overflow-y-auto px-3 pb-4 pt-1 sm:grid-cols-4 md:grid-cols-2">
        {list.map((item) => (
          <ItemCard key={item.id} item={item} name={tx(item.name, lang)} price={formatPrice(item.price, lang)} onPick={() => addItem(item.id)} />
        ))}
        {list.length === 0 && <p className="col-span-full py-8 text-center text-sm text-stone-500">{search.trim() ? t("noResults") : t("noRecentItems")}</p>}
      </div>
      <p className="hidden border-t border-stone-100 px-4 py-2 text-[11px] text-stone-400 md:block">{t("dropHint")}</p>
    </div>
  );
}

function Chip({ active, onClick, children, icon: Icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: LucideIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
      }`}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  );
}

function ItemCard({ item, name, price, onPick }: { item: CatalogItem; name: string; price: string; onPick: () => void }) {
  const [c1, c2] = [item.colors[0]?.hex ?? "#ddd", item.colors[1]?.hex ?? item.colors[0]?.hex ?? "#bbb"];
  const { w, d, h } = item.size;
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(ITEM_DRAG_TYPE, item.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={onPick}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white text-left transition hover:border-stone-400 hover:shadow-md active:scale-[0.98]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center" style={{ background: `linear-gradient(135deg, ${c1}55, ${c2}aa)` }}>
        <ItemIcon item={item} className="size-8 text-stone-700/70 transition group-hover:scale-110" strokeWidth={1.5} />
        <div className="absolute bottom-1.5 left-1.5 flex gap-1">
          {item.colors.map((c) => (
            <span key={c.id} className="size-2.5 rounded-full ring-1 ring-white" style={{ background: c.hex }} />
          ))}
        </div>
      </div>
      <div className="p-1.5 sm:p-2">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-stone-900">{name}</p>
        <p className="text-[10px] text-stone-500">
          {cm(w)}×{cm(d)}×{cm(h)} cm
        </p>
        <p className="mt-0.5 text-xs font-semibold tabular-nums text-stone-900">{price}</p>
      </div>
    </button>
  );
}
