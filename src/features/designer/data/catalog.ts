import type { CatalogColor, CatalogItem, Category, Text } from "@/features/designer/types";

/**
 * Designer catalog, shaped like the future catalog API response (`catalogResponse`):
 * each item names a model template plus params, so new items need data only.
 * Ids that are not in the catalog render as placeholder boxes (see models.tsx).
 */

export const CATALOG_VERSION = "2026-10-29.1";

const t = (en: string, th: string, zh: string): Text => ({ en, th, zh });

const C = {
  white: { id: "white", hex: "#f2f0eb", name: t("White", "ขาว", "白色") },
  oak: { id: "oak", hex: "#c8a27a", name: t("Oak", "ไม้โอ๊ค", "橡木") },
  walnut: { id: "walnut", hex: "#6b4a33", name: t("Walnut", "วอลนัท", "胡桃木") },
  black: { id: "black", hex: "#2e2e2e", name: t("Black", "ดำ", "黑色") },
  grey: { id: "grey", hex: "#9a9a96", name: t("Grey", "เทา", "灰色") },
  beige: { id: "beige", hex: "#d9c9b0", name: t("Beige", "เบจ", "米色") },
  sage: { id: "sage", hex: "#8fa58a", name: t("Sage", "เขียวเสจ", "鼠尾草绿") },
  navy: { id: "navy", hex: "#3b4e66", name: t("Navy", "กรมท่า", "藏青") },
  terracotta: { id: "terracotta", hex: "#c46e4b", name: t("Terracotta", "ดินเผา", "陶土色") },
  pink: { id: "pink", hex: "#e3b5b0", name: t("Blush", "ชมพูอ่อน", "浅粉") },
  brass: { id: "brass", hex: "#c9a227", name: t("Brass", "ทองเหลือง", "黄铜") },
  charcoal: { id: "charcoal", hex: "#4a4a48", name: t("Charcoal", "เทาเข้ม", "炭灰") },
} satisfies Record<string, CatalogColor>;

export const categories: { id: Category; name: Text }[] = [
  { id: "bedroom", name: t("Bedroom", "ห้องนอน", "卧室") },
  { id: "storage", name: t("Storage", "ตู้และชั้น", "收纳") },
  { id: "seating", name: t("Seating", "ที่นั่ง", "座椅") },
  { id: "tables", name: t("Tables", "โต๊ะ", "桌子") },
  { id: "decor", name: t("Decor", "ของตกแต่ง", "装饰") },
  { id: "wall", name: t("Wall", "ติดผนัง", "墙面") },
  { id: "ceiling", name: t("Ceiling", "ติดเพดาน", "吊顶") },
];

export const catalog: CatalogItem[] = [
  // Bedroom
  { id: "bed-double", category: "bedroom", mount: "floor", name: t("Double bed", "เตียงคู่", "双人床"), size: { w: 1.6, d: 2.05, h: 0.95 }, colors: [C.oak, C.white, C.grey], model: { template: "planner", params: { shape: "bed" } } },
  { id: "bed-single", category: "bedroom", mount: "floor", name: t("Single bed", "เตียงเดี่ยว", "单人床"), size: { w: 0.95, d: 2.05, h: 0.9 }, colors: [C.white, C.oak, C.navy], model: { template: "planner", params: { shape: "bed" } } },
  { id: "bedside-table", category: "bedroom", mount: "floor", name: t("Bedside table", "โต๊ะข้างเตียง", "床头柜"), size: { w: 0.45, d: 0.4, h: 0.55 }, colors: [C.oak, C.white, C.walnut], surface: true, model: { template: "drawers", params: { rows: 2, cols: 1, legH: 0.12 } } },
  { id: "dressing-table", category: "bedroom", mount: "floor", name: t("Dressing table", "โต๊ะเครื่องแป้ง", "梳妆台"), size: { w: 1, d: 0.45, h: 1.45 }, colors: [C.white, C.oak, C.pink], model: { template: "dressingTable" } },

  // Storage
  { id: "wardrobe", category: "storage", mount: "floor", name: t("Wardrobe", "ตู้เสื้อผ้า", "衣柜"), size: { w: 1, d: 0.58, h: 2 }, colors: [C.white, C.oak, C.walnut], surface: true, model: { template: "wardrobe", params: { doors: 2 } } },
  { id: "wardrobe-small", category: "storage", mount: "floor", name: t("Small wardrobe", "ตู้เสื้อผ้าเล็ก", "小衣柜"), size: { w: 0.8, d: 0.55, h: 1.8 }, colors: [C.white, C.oak, C.sage], surface: true, model: { template: "wardrobe", params: { doors: 2 } } },
  { id: "wardrobe-3door", category: "storage", mount: "floor", name: t("3-door wardrobe", "ตู้เสื้อผ้า 3 บาน", "三门衣柜"), size: { w: 1.5, d: 0.58, h: 2 }, colors: [C.white, C.oak, C.walnut], surface: true, model: { template: "wardrobe", params: { doors: 3 } } },
  { id: "wardrobe-sliding", category: "storage", mount: "floor", name: t("Sliding-door wardrobe", "ตู้เสื้อผ้าบานเลื่อน", "推拉门衣柜"), size: { w: 1.8, d: 0.62, h: 2.1 }, colors: [C.white, C.charcoal, C.oak], surface: true, model: { template: "wardrobe", params: { doors: 2, sliding: true } } },
  { id: "wardrobe-mirror", category: "storage", mount: "floor", name: t("Mirrored wardrobe", "ตู้เสื้อผ้าบานกระจก", "镜门衣柜"), size: { w: 1, d: 0.58, h: 2 }, colors: [C.white, C.oak, C.black], surface: true, model: { template: "wardrobe", params: { doors: 2, mirror: true } } },
  { id: "clothes-rack", category: "storage", mount: "floor", name: t("Clothes rack", "ราวแขวนผ้า", "衣架"), size: { w: 1, d: 0.45, h: 1.6 }, colors: [C.black, C.white, C.brass], model: { template: "rack" } },
  { id: "shoe-cabinet", category: "storage", mount: "floor", name: t("Shoe cabinet", "ตู้รองเท้า", "鞋柜"), size: { w: 0.8, d: 0.3, h: 1 }, colors: [C.white, C.oak, C.grey], surface: true, model: { template: "drawers", params: { rows: 3, cols: 1, legH: 0.05 } } },
  { id: "dresser", category: "storage", mount: "floor", name: t("Chest of drawers", "ตู้ลิ้นชัก", "五斗柜"), size: { w: 1.2, d: 0.48, h: 0.8 }, colors: [C.oak, C.white, C.walnut], surface: true, model: { template: "drawers", params: { rows: 3, cols: 2, legH: 0.1 } } },
  { id: "bookshelf", category: "storage", mount: "floor", name: t("Bookshelf", "ชั้นหนังสือ", "书架"), size: { w: 0.8, d: 0.3, h: 1.8 }, colors: [C.white, C.oak, C.black], surface: true, model: { template: "planner", params: { shape: "bookcase" } } },
  { id: "tv-bench", category: "storage", mount: "floor", name: t("TV bench", "ชั้นวางทีวี", "电视柜"), size: { w: 1.6, d: 0.4, h: 0.5 }, colors: [C.walnut, C.white, C.oak], surface: true, model: { template: "drawers", params: { rows: 1, cols: 3, legH: 0.12 } } },

  // Seating
  { id: "sofa", category: "seating", mount: "floor", name: t("Sofa", "โซฟา", "沙发"), size: { w: 2, d: 0.9, h: 0.85 }, colors: [C.beige, C.grey, C.sage], model: { template: "planner", params: { shape: "sofa" } } },
  { id: "armchair", category: "seating", mount: "floor", name: t("Armchair", "อาร์มแชร์", "扶手椅"), size: { w: 0.85, d: 0.85, h: 0.85 }, colors: [C.terracotta, C.beige, C.navy], model: { template: "planner", params: { shape: "armchair" } } },
  { id: "chair", category: "seating", mount: "floor", name: t("Chair", "เก้าอี้", "椅子"), size: { w: 0.45, d: 0.5, h: 0.85 }, colors: [C.oak, C.black, C.white], model: { template: "planner", params: { shape: "chair" } } },
  { id: "dining-chair", category: "seating", mount: "floor", name: t("Dining chair", "เก้าอี้ทานอาหาร", "餐椅"), size: { w: 0.48, d: 0.52, h: 0.9 }, colors: [C.walnut, C.sage, C.white], model: { template: "planner", params: { shape: "chair" } } },
  { id: "office-chair", category: "seating", mount: "floor", name: t("Office chair", "เก้าอี้สำนักงาน", "办公椅"), size: { w: 0.62, d: 0.62, h: 1.1 }, colors: [C.black, C.grey, C.navy], model: { template: "officeChair" } },
  { id: "bar-stool", category: "seating", mount: "floor", name: t("Bar stool", "สตูลบาร์", "吧凳"), size: { w: 0.4, d: 0.4, h: 0.75 }, colors: [C.black, C.oak, C.brass], model: { template: "stool", params: { bar: true } } },
  { id: "stool", category: "seating", mount: "floor", name: t("Stool", "สตูล", "凳子"), size: { w: 0.36, d: 0.36, h: 0.45 }, colors: [C.oak, C.white, C.terracotta], surface: true, model: { template: "stool" } },
  { id: "bench", category: "seating", mount: "floor", name: t("Bench", "ม้านั่ง", "长凳"), size: { w: 1.2, d: 0.38, h: 0.45 }, colors: [C.oak, C.walnut, C.black], surface: true, model: { template: "bench" } },
  { id: "pouffe", category: "seating", mount: "floor", name: t("Pouffe", "พูฟ", "坐墩"), size: { w: 0.5, d: 0.5, h: 0.42 }, colors: [C.beige, C.terracotta, C.sage], model: { template: "pouffe" } },

  // Tables
  { id: "desk", category: "tables", mount: "floor", name: t("Desk", "โต๊ะทำงาน", "书桌"), size: { w: 1.2, d: 0.6, h: 0.75 }, colors: [C.oak, C.white, C.black], surface: true, model: { template: "planner", params: { shape: "table" } } },
  { id: "desk-compact", category: "tables", mount: "floor", name: t("Compact desk", "โต๊ะทำงานเล็ก", "小书桌"), size: { w: 0.9, d: 0.5, h: 0.75 }, colors: [C.white, C.oak, C.sage], surface: true, model: { template: "planner", params: { shape: "table" } } },
  { id: "desk-drawers", category: "tables", mount: "floor", name: t("Desk with drawers", "โต๊ะทำงานมีลิ้นชัก", "带抽屉书桌"), size: { w: 1.4, d: 0.65, h: 0.75 }, colors: [C.white, C.oak, C.walnut], surface: true, model: { template: "planner", params: { shape: "desk" } } },
  { id: "desk-standing", category: "tables", mount: "floor", name: t("Standing desk", "โต๊ะยืนทำงาน", "升降桌"), size: { w: 1.4, d: 0.7, h: 1.05 }, colors: [C.oak, C.white, C.black], surface: true, model: { template: "standingDesk" } },
  { id: "desk-shelves", category: "tables", mount: "floor", name: t("Desk with shelves", "โต๊ะทำงานมีชั้นวาง", "带书架书桌"), size: { w: 1.2, d: 0.6, h: 1.45 }, colors: [C.white, C.oak, C.black], model: { template: "deskShelves" } },
  { id: "coffee-table", category: "tables", mount: "floor", name: t("Coffee table", "โต๊ะกลาง", "茶几"), size: { w: 1, d: 0.6, h: 0.42 }, colors: [C.oak, C.walnut, C.white], surface: true, model: { template: "planner", params: { shape: "coffee-table" } } },

  // Decor
  { id: "rug", category: "decor", mount: "floor", name: t("Rug", "พรม", "地毯"), size: { w: 1.6, d: 2.3, h: 0.012 }, colors: [C.beige, C.grey, C.terracotta], flat: true, model: { template: "planner", params: { shape: "rug" } } },
  { id: "floor-lamp", category: "decor", mount: "floor", name: t("Floor lamp", "โคมไฟตั้งพื้น", "落地灯"), size: { w: 0.4, d: 0.4, h: 1.6 }, colors: [C.black, C.brass, C.white], light: true, model: { template: "floorLamp" } },
  { id: "plant", category: "decor", mount: "floor", name: t("Plant", "ต้นไม้", "绿植"), size: { w: 0.5, d: 0.5, h: 1.2 }, colors: [C.terracotta, C.white, C.charcoal], model: { template: "planner", params: { shape: "plant" } } },
  { id: "table-lamp", category: "decor", mount: "floor", name: t("Table lamp", "โคมไฟตั้งโต๊ะ", "台灯"), size: { w: 0.28, d: 0.28, h: 0.45 }, colors: [C.white, C.brass, C.sage], stackable: true, light: true, model: { template: "tableLamp" } },
  { id: "plant-small", category: "decor", mount: "floor", name: t("Small plant", "ต้นไม้เล็ก", "小绿植"), size: { w: 0.2, d: 0.2, h: 0.3 }, colors: [C.white, C.terracotta, C.charcoal], stackable: true, model: { template: "planner", params: { shape: "plant" } } },
  { id: "vase", category: "decor", mount: "floor", name: t("Vase", "แจกัน", "花瓶"), size: { w: 0.15, d: 0.15, h: 0.3 }, colors: [C.white, C.terracotta, C.navy], stackable: true, model: { template: "vase" } },

  // Wall
  { id: "wall-art", category: "wall", mount: "wall", name: t("Wall art", "ภาพติดผนัง", "装饰画"), size: { w: 0.7, d: 0.03, h: 0.5 }, colors: [C.terracotta, C.navy, C.sage], mountHeight: 1.3, model: { template: "planner", params: { shape: "wall-art" } } },
  { id: "mirror", category: "wall", mount: "wall", name: t("Mirror", "กระจกเงา", "镜子"), size: { w: 0.6, d: 0.03, h: 0.9 }, colors: [C.brass, C.black, C.white], mountHeight: 1.1, model: { template: "planner", params: { shape: "mirror" } } },
  { id: "wall-shelf", category: "wall", mount: "wall", name: t("Wall shelf", "ชั้นติดผนัง", "墙架"), size: { w: 0.8, d: 0.22, h: 0.26 }, colors: [C.oak, C.white, C.black], mountHeight: 1.4, model: { template: "wallShelf" } },
  { id: "wall-cabinet", category: "wall", mount: "wall", name: t("Wall cabinet", "ตู้แขวนผนัง", "吊柜"), size: { w: 0.8, d: 0.32, h: 0.6 }, colors: [C.white, C.oak, C.sage], mountHeight: 1.45, model: { template: "wallCabinet" } },
  { id: "wall-tv", category: "wall", mount: "wall", name: t("Wall TV", "ทีวีติดผนัง", "壁挂电视"), size: { w: 1.25, d: 0.06, h: 0.72 }, colors: [C.black, C.charcoal], mountHeight: 1, model: { template: "tv" } },
  { id: "air-conditioner", category: "wall", mount: "wall", name: t("Air conditioner", "เครื่องปรับอากาศ", "空调"), size: { w: 0.9, d: 0.22, h: 0.3 }, colors: [C.white, C.grey], mountHeight: 2.15, model: { template: "aircon" } },
  { id: "wall-lamp", category: "wall", mount: "wall", name: t("Wall lamp", "โคมไฟติดผนัง", "壁灯"), size: { w: 0.18, d: 0.18, h: 0.3 }, colors: [C.brass, C.black, C.white], mountHeight: 1.7, light: true, model: { template: "wallLamp" } },

  // Ceiling
  { id: "pendant", category: "ceiling", mount: "ceiling", name: t("Pendant lamp", "โคมไฟห้อย", "吊灯"), size: { w: 0.4, d: 0.4, h: 0.7 }, colors: [C.black, C.brass, C.white], light: true, model: { template: "pendant" } },
  { id: "ceiling-lamp", category: "ceiling", mount: "ceiling", name: t("Ceiling lamp", "โคมไฟเพดาน", "吸顶灯"), size: { w: 0.45, d: 0.45, h: 0.12 }, colors: [C.white, C.brass, C.black], light: true, model: { template: "ceilingLamp" } },
  { id: "ceiling-fan", category: "ceiling", mount: "ceiling", name: t("Ceiling fan", "พัดลมเพดาน", "吊扇"), size: { w: 1.2, d: 1.2, h: 0.4 }, colors: [C.white, C.oak, C.black], model: { template: "fan" } },
];

const byId = new Map(catalog.map((c) => [c.id, c]));

export function getCatalogItem(id: string): CatalogItem | undefined {
  return byId.get(id);
}

export function colorOf(item: CatalogItem | undefined, colorId: string | undefined): string {
  return item?.colors.find((c) => c.id === colorId)?.hex ?? item?.colors[0]?.hex ?? "#bdbdbd";
}

/** Search names in every language, case-insensitive. */
export function searchCatalog(q: string): CatalogItem[] {
  const s = q.trim().toLowerCase();
  const visible = catalog.filter((c) => !c.hidden);
  if (!s) return visible;
  return visible.filter((c) => Object.values(c.name).some((n) => n.toLowerCase().includes(s)) || c.id.includes(s));
}

/** The response the catalog API route serves; the app reads the same shape. */
export function catalogResponse() {
  return { success: true, data: { version: CATALOG_VERSION, categories, items: catalog } };
}
