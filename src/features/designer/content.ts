import { clearPlanCache } from "./lib/geometry";
import { EMPTY_PLAN_ID, emptyPlanSpec } from "./lib/plans";
import type { CatalogItem, Category, Lang, PlanSpec, RoomType, Text } from "./types";

/**
 * Catalog, plans and room types loaded from the RoomCraft API (see api.ts).
 *
 * Server pages install them after loading; client components get them from <ContentProvider>,
 * which installs them before its children render. Everything else reads them synchronously
 * through the lookups below, so 3D code, the store and plain helpers need no props.
 */

export interface RoomTypeInfo {
  id: RoomType;
  name: Text;
  blurb: Text;
  /** CSS gradient for gallery cards. */
  gradient: string;
}

export interface DesignerContent {
  /** Published catalog version, e.g. "2026-10-29.2". */
  catalogVersion: string;
  categories: { id: Category; name: Text }[];
  items: CatalogItem[];
  /** Unit floor plans and showrooms in the API's order. The empty room is generated locally. */
  plans: PlanSpec[];
  roomTypes: RoomTypeInfo[];
}

let content: DesignerContent = { catalogVersion: "", categories: [], items: [], plans: [], roomTypes: [] };
let byId = new Map<string, CatalogItem>();

export function installContent(next: DesignerContent) {
  if (next === content) return;
  content = next;
  byId = new Map(next.items.map((c) => [c.id, c]));
  clearPlanCache();
}

// ---- Catalog ----

export function catalogCategories() {
  return content.categories;
}

/** Items shown in the catalog panel (hidden items can still render in old designs). */
export function visibleCatalog(): CatalogItem[] {
  return content.items.filter((c) => !c.hidden);
}

export function getCatalogItem(id: string): CatalogItem | undefined {
  return byId.get(id);
}

export function colorOf(item: CatalogItem | undefined, colorId: string | undefined): string {
  return item?.colors.find((c) => c.id === colorId)?.hex ?? item?.colors[0]?.hex ?? "#bdbdbd";
}

/** Search names in every language, case-insensitive. */
export function searchCatalog(q: string): CatalogItem[] {
  const s = q.trim().toLowerCase();
  const visible = visibleCatalog();
  if (!s) return visible;
  return visible.filter((c) => Object.values(c.name).some((n) => n.toLowerCase().includes(s)) || c.id.includes(s) || !!c.sku?.toLowerCase().includes(s));
}

/** Thai baht, whole numbers, formatted for the current language. */
export function formatPrice(value: number, lang: Lang = "en"): string {
  const locale = lang === "th" ? "th-TH" : lang === "zh" ? "zh-CN" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);
}

/** Total price of placed items; unknown ids count as zero. */
export function totalPrice(items: { itemId: string }[]): number {
  return items.reduce((n, it) => n + (getCatalogItem(it.itemId)?.price ?? 0), 0);
}

// ---- Plans and showrooms ----

/** The empty room followed by the unit floor plans. */
export function unitPlanSpecs(): PlanSpec[] {
  return [emptyPlanSpec(), ...content.plans.filter((p) => !p.showroom)];
}

export function showroomSpecs(): PlanSpec[] {
  return content.plans.filter((p) => !!p.showroom);
}

/** Unit floor plans and furnished showrooms, everything the designer can open. */
export function allPlanSpecs(): PlanSpec[] {
  return [emptyPlanSpec(), ...content.plans];
}

export function getPlanSpec(id: string, size?: { w: number; d: number }): PlanSpec | undefined {
  if (id === EMPTY_PLAN_ID) return emptyPlanSpec(size?.w, size?.d);
  return content.plans.find((p) => p.id === id);
}

export function roomTypes(): RoomTypeInfo[] {
  return content.roomTypes;
}

export function showroomsOfType(type: string): PlanSpec[] {
  return showroomSpecs().filter((s) => s.showroom?.type === type);
}
