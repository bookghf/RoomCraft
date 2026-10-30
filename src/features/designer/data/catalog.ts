import type { CatalogColor, CatalogItem, Category, Text } from "@/features/designer/types";

/**
 * Seed data for the API (`roomcraft-api/tools/export-seed.ts`) and test fixtures. The app loads
 * the published catalog from the API at runtime (see ../content.ts).
 *
 * Designer catalog, shaped like the catalog API response:
 * each item names a model template plus params, so new items need data only.
 * Ids that are not in the catalog render as placeholder boxes (see models.tsx).
 */

export const CATALOG_VERSION = "2026-10-29.2";

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

/** Finishes of the branded showroom products. */
const wood = [
  { id: "birch", hex: "#d9c3a0", name: t("Birch", "ไม้เบิร์ช", "桦木") },
  { id: "walnut", hex: "#6b4a33", name: t("Walnut", "วอลนัท", "胡桃木") },
  { id: "white", hex: "#f2f0ec", name: t("White", "ขาว", "白色") },
];
const fabric = [
  { id: "oat", hex: "#d8cdb8", name: t("Oat", "สีข้าวโอ๊ต", "燕麦色") },
  { id: "sage", hex: "#9aab92", name: t("Sage", "เขียวเสจ", "鼠尾草绿") },
  { id: "charcoal", hex: "#4a4a4d", name: t("Charcoal", "เทาเข้ม", "炭灰") },
];
const metal = [
  { id: "black", hex: "#2b2b2b", name: t("Black", "ดำ", "黑色") },
  { id: "brass", hex: "#b8954f", name: t("Brass", "ทองเหลือง", "黄铜") },
];

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
  { id: "bed-double", price: 9990, category: "bedroom", mount: "floor", name: t("Double bed", "เตียงคู่", "双人床"), size: { w: 1.6, d: 2.05, h: 0.95 }, colors: [C.oak, C.white, C.grey], model: { template: "shape", params: { shape: "bed" } } },
  { id: "bed-single", price: 5490, category: "bedroom", mount: "floor", name: t("Single bed", "เตียงเดี่ยว", "单人床"), size: { w: 0.95, d: 2.05, h: 0.9 }, colors: [C.white, C.oak, C.navy], model: { template: "shape", params: { shape: "bed" } } },
  { id: "bedside-table", price: 1290, category: "bedroom", mount: "floor", name: t("Bedside table", "โต๊ะข้างเตียง", "床头柜"), size: { w: 0.45, d: 0.4, h: 0.55 }, colors: [C.oak, C.white, C.walnut], surface: true, model: { template: "drawers", params: { rows: 2, cols: 1, legH: 0.12 } } },
  { id: "dressing-table", price: 4590, category: "bedroom", mount: "floor", name: t("Dressing table", "โต๊ะเครื่องแป้ง", "梳妆台"), size: { w: 1, d: 0.45, h: 1.45 }, colors: [C.white, C.oak, C.pink], model: { template: "dressingTable" } },

  // Storage
  { id: "wardrobe", price: 7990, category: "storage", mount: "floor", name: t("Wardrobe", "ตู้เสื้อผ้า", "衣柜"), size: { w: 1, d: 0.58, h: 2 }, colors: [C.white, C.oak, C.walnut], surface: true, model: { template: "wardrobe", params: { doors: 2 } } },
  { id: "wardrobe-small", price: 5990, category: "storage", mount: "floor", name: t("Small wardrobe", "ตู้เสื้อผ้าเล็ก", "小衣柜"), size: { w: 0.8, d: 0.55, h: 1.8 }, colors: [C.white, C.oak, C.sage], surface: true, model: { template: "wardrobe", params: { doors: 2 } } },
  { id: "wardrobe-3door", price: 11990, category: "storage", mount: "floor", name: t("3-door wardrobe", "ตู้เสื้อผ้า 3 บาน", "三门衣柜"), size: { w: 1.5, d: 0.58, h: 2 }, colors: [C.white, C.oak, C.walnut], surface: true, model: { template: "wardrobe", params: { doors: 3 } } },
  { id: "wardrobe-sliding", price: 14990, category: "storage", mount: "floor", name: t("Sliding-door wardrobe", "ตู้เสื้อผ้าบานเลื่อน", "推拉门衣柜"), size: { w: 1.8, d: 0.62, h: 2.1 }, colors: [C.white, C.charcoal, C.oak], surface: true, model: { template: "wardrobe", params: { doors: 2, sliding: true } } },
  { id: "wardrobe-mirror", price: 9490, category: "storage", mount: "floor", name: t("Mirrored wardrobe", "ตู้เสื้อผ้าบานกระจก", "镜门衣柜"), size: { w: 1, d: 0.58, h: 2 }, colors: [C.white, C.oak, C.black], surface: true, model: { template: "wardrobe", params: { doors: 2, mirror: true } } },
  { id: "clothes-rack", price: 1490, category: "storage", mount: "floor", name: t("Clothes rack", "ราวแขวนผ้า", "衣架"), size: { w: 1, d: 0.45, h: 1.6 }, colors: [C.black, C.white, C.brass], model: { template: "rack" } },
  { id: "shoe-cabinet", price: 2490, category: "storage", mount: "floor", name: t("Shoe cabinet", "ตู้รองเท้า", "鞋柜"), size: { w: 0.8, d: 0.3, h: 1 }, colors: [C.white, C.oak, C.grey], surface: true, model: { template: "drawers", params: { rows: 3, cols: 1, legH: 0.05 } } },
  { id: "dresser", price: 5490, category: "storage", mount: "floor", name: t("Chest of drawers", "ตู้ลิ้นชัก", "五斗柜"), size: { w: 1.2, d: 0.48, h: 0.8 }, colors: [C.oak, C.white, C.walnut], surface: true, model: { template: "drawers", params: { rows: 3, cols: 2, legH: 0.1 } } },
  { id: "bookshelf", price: 2990, category: "storage", mount: "floor", name: t("Bookshelf", "ชั้นหนังสือ", "书架"), size: { w: 0.8, d: 0.3, h: 1.8 }, colors: [C.white, C.oak, C.black], surface: true, model: { template: "shape", params: { shape: "bookcase" } } },
  { id: "tv-bench", price: 3990, category: "storage", mount: "floor", name: t("TV bench", "ชั้นวางทีวี", "电视柜"), size: { w: 1.6, d: 0.4, h: 0.5 }, colors: [C.walnut, C.white, C.oak], surface: true, model: { template: "drawers", params: { rows: 1, cols: 3, legH: 0.12 } } },

  // Seating
  { id: "sofa", price: 13990, category: "seating", mount: "floor", name: t("Sofa", "โซฟา", "沙发"), size: { w: 2, d: 0.9, h: 0.85 }, colors: [C.beige, C.grey, C.sage], model: { template: "shape", params: { shape: "sofa" } } },
  { id: "armchair", price: 4490, category: "seating", mount: "floor", name: t("Armchair", "อาร์มแชร์", "扶手椅"), size: { w: 0.85, d: 0.85, h: 0.85 }, colors: [C.terracotta, C.beige, C.navy], model: { template: "shape", params: { shape: "armchair" } } },
  { id: "chair", price: 990, category: "seating", mount: "floor", name: t("Chair", "เก้าอี้", "椅子"), size: { w: 0.45, d: 0.5, h: 0.85 }, colors: [C.oak, C.black, C.white], model: { template: "shape", params: { shape: "chair" } } },
  { id: "dining-chair", price: 1190, category: "seating", mount: "floor", name: t("Dining chair", "เก้าอี้ทานอาหาร", "餐椅"), size: { w: 0.48, d: 0.52, h: 0.9 }, colors: [C.walnut, C.sage, C.white], model: { template: "shape", params: { shape: "chair" } } },
  { id: "office-chair", price: 3490, category: "seating", mount: "floor", name: t("Office chair", "เก้าอี้สำนักงาน", "办公椅"), size: { w: 0.62, d: 0.62, h: 1.1 }, colors: [C.black, C.grey, C.navy], model: { template: "officeChair" } },
  { id: "bar-stool", price: 1290, category: "seating", mount: "floor", name: t("Bar stool", "สตูลบาร์", "吧凳"), size: { w: 0.4, d: 0.4, h: 0.75 }, colors: [C.black, C.oak, C.brass], model: { template: "stool", params: { bar: true } } },
  { id: "stool", price: 590, category: "seating", mount: "floor", name: t("Stool", "สตูล", "凳子"), size: { w: 0.36, d: 0.36, h: 0.45 }, colors: [C.oak, C.white, C.terracotta], surface: true, model: { template: "stool" } },
  { id: "bench", price: 2290, category: "seating", mount: "floor", name: t("Bench", "ม้านั่ง", "长凳"), size: { w: 1.2, d: 0.38, h: 0.45 }, colors: [C.oak, C.walnut, C.black], surface: true, model: { template: "bench" } },
  { id: "pouffe", price: 1190, category: "seating", mount: "floor", name: t("Pouffe", "พูฟ", "坐墩"), size: { w: 0.5, d: 0.5, h: 0.42 }, colors: [C.beige, C.terracotta, C.sage], model: { template: "pouffe" } },

  // Tables
  { id: "desk", price: 3490, category: "tables", mount: "floor", name: t("Desk", "โต๊ะทำงาน", "书桌"), size: { w: 1.2, d: 0.6, h: 0.75 }, colors: [C.oak, C.white, C.black], surface: true, model: { template: "shape", params: { shape: "table" } } },
  { id: "desk-compact", price: 2290, category: "tables", mount: "floor", name: t("Compact desk", "โต๊ะทำงานเล็ก", "小书桌"), size: { w: 0.9, d: 0.5, h: 0.75 }, colors: [C.white, C.oak, C.sage], surface: true, model: { template: "shape", params: { shape: "table" } } },
  { id: "desk-drawers", price: 4990, category: "tables", mount: "floor", name: t("Desk with drawers", "โต๊ะทำงานมีลิ้นชัก", "带抽屉书桌"), size: { w: 1.4, d: 0.65, h: 0.75 }, colors: [C.white, C.oak, C.walnut], surface: true, model: { template: "shape", params: { shape: "desk" } } },
  { id: "desk-standing", price: 9990, category: "tables", mount: "floor", name: t("Standing desk", "โต๊ะยืนทำงาน", "升降桌"), size: { w: 1.4, d: 0.7, h: 1.05 }, colors: [C.oak, C.white, C.black], surface: true, model: { template: "standingDesk" } },
  { id: "desk-shelves", price: 5490, category: "tables", mount: "floor", name: t("Desk with shelves", "โต๊ะทำงานมีชั้นวาง", "带书架书桌"), size: { w: 1.2, d: 0.6, h: 1.45 }, colors: [C.white, C.oak, C.black], model: { template: "deskShelves" } },
  { id: "coffee-table", price: 2290, category: "tables", mount: "floor", name: t("Coffee table", "โต๊ะกลาง", "茶几"), size: { w: 1, d: 0.6, h: 0.42 }, colors: [C.oak, C.walnut, C.white], surface: true, model: { template: "shape", params: { shape: "coffee-table" } } },

  // Decor
  { id: "rug", price: 2490, category: "decor", mount: "floor", name: t("Rug", "พรม", "地毯"), size: { w: 1.6, d: 2.3, h: 0.012 }, colors: [C.beige, C.grey, C.terracotta], flat: true, model: { template: "shape", params: { shape: "rug" } } },
  { id: "floor-lamp", price: 1990, category: "decor", mount: "floor", name: t("Floor lamp", "โคมไฟตั้งพื้น", "落地灯"), size: { w: 0.4, d: 0.4, h: 1.6 }, colors: [C.black, C.brass, C.white], light: true, model: { template: "floorLamp" } },
  { id: "plant", price: 790, category: "decor", mount: "floor", name: t("Plant", "ต้นไม้", "绿植"), size: { w: 0.5, d: 0.5, h: 1.2 }, colors: [C.terracotta, C.white, C.charcoal], model: { template: "shape", params: { shape: "plant" } } },
  { id: "table-lamp", price: 690, category: "decor", mount: "floor", name: t("Table lamp", "โคมไฟตั้งโต๊ะ", "台灯"), size: { w: 0.28, d: 0.28, h: 0.45 }, colors: [C.white, C.brass, C.sage], stackable: true, light: true, model: { template: "tableLamp" } },
  { id: "plant-small", price: 290, category: "decor", mount: "floor", name: t("Small plant", "ต้นไม้เล็ก", "小绿植"), size: { w: 0.2, d: 0.2, h: 0.3 }, colors: [C.white, C.terracotta, C.charcoal], stackable: true, model: { template: "shape", params: { shape: "plant" } } },
  { id: "vase", price: 390, category: "decor", mount: "floor", name: t("Vase", "แจกัน", "花瓶"), size: { w: 0.15, d: 0.15, h: 0.3 }, colors: [C.white, C.terracotta, C.navy], stackable: true, model: { template: "vase" } },

  // Wall
  { id: "wall-art", price: 890, category: "wall", mount: "wall", name: t("Wall art", "ภาพติดผนัง", "装饰画"), size: { w: 0.7, d: 0.03, h: 0.5 }, colors: [C.terracotta, C.navy, C.sage], mountHeight: 1.3, model: { template: "shape", params: { shape: "wall-art" } } },
  { id: "mirror", price: 1490, category: "wall", mount: "wall", name: t("Mirror", "กระจกเงา", "镜子"), size: { w: 0.6, d: 0.03, h: 0.9 }, colors: [C.brass, C.black, C.white], mountHeight: 1.1, model: { template: "shape", params: { shape: "mirror" } } },
  { id: "wall-shelf", price: 590, category: "wall", mount: "wall", name: t("Wall shelf", "ชั้นติดผนัง", "墙架"), size: { w: 0.8, d: 0.22, h: 0.26 }, colors: [C.oak, C.white, C.black], mountHeight: 1.4, model: { template: "wallShelf" } },
  { id: "wall-cabinet", price: 2490, category: "wall", mount: "wall", name: t("Wall cabinet", "ตู้แขวนผนัง", "吊柜"), size: { w: 0.8, d: 0.32, h: 0.6 }, colors: [C.white, C.oak, C.sage], mountHeight: 1.45, model: { template: "wallCabinet" } },
  { id: "wall-tv", price: 15990, category: "wall", mount: "wall", name: t("Wall TV", "ทีวีติดผนัง", "壁挂电视"), size: { w: 1.25, d: 0.06, h: 0.72 }, colors: [C.black, C.charcoal], mountHeight: 1, model: { template: "tv" } },
  { id: "air-conditioner", price: 12990, category: "wall", mount: "wall", name: t("Air conditioner", "เครื่องปรับอากาศ", "空调"), size: { w: 0.9, d: 0.22, h: 0.3 }, colors: [C.white, C.grey], mountHeight: 2.15, model: { template: "aircon" } },
  { id: "wall-lamp", price: 990, category: "wall", mount: "wall", name: t("Wall lamp", "โคมไฟติดผนัง", "壁灯"), size: { w: 0.18, d: 0.18, h: 0.3 }, colors: [C.brass, C.black, C.white], mountHeight: 1.7, light: true, model: { template: "wallLamp" } },

  // Ceiling
  { id: "pendant", price: 1190, category: "ceiling", mount: "ceiling", name: t("Pendant lamp", "โคมไฟห้อย", "吊灯"), size: { w: 0.4, d: 0.4, h: 0.7 }, colors: [C.black, C.brass, C.white], light: true, model: { template: "pendant" } },
  { id: "ceiling-lamp", price: 890, category: "ceiling", mount: "ceiling", name: t("Ceiling lamp", "โคมไฟเพดาน", "吸顶灯"), size: { w: 0.45, d: 0.45, h: 0.12 }, colors: [C.white, C.brass, C.black], light: true, model: { template: "ceilingLamp" } },
  { id: "ceiling-fan", price: 3990, category: "ceiling", mount: "ceiling", name: t("Ceiling fan", "พัดลมเพดาน", "吊扇"), size: { w: 1.2, d: 1.2, h: 0.4 }, colors: [C.white, C.oak, C.black], model: { template: "fan" } },
  // Showroom products (named ranges used in the styled showrooms)
  { id: "bed-linna-double", sku: "RC-1001", price: 12990, category: "bedroom", mount: "floor", name: t("Linna double bed", "เตียงคู่ ลินนา", "Linna 双人床"), size: { w: 1.6, d: 2.1, h: 1 }, colors: wood, model: { template: "shape", params: { shape: "bed" } } },
  { id: "bed-solo-single", sku: "RC-1002", price: 6490, category: "bedroom", mount: "floor", name: t("Solo single bed", "เตียงเดี่ยว โซโล", "Solo 单人床"), size: { w: 0.95, d: 2.05, h: 0.9 }, colors: wood, model: { template: "shape", params: { shape: "bed" } } },
  { id: "bed-haven-king", sku: "RC-1003", price: 18990, category: "bedroom", mount: "floor", name: t("Haven king bed", "เตียงคิงไซส์ เฮเวน", "Haven 特大双人床"), size: { w: 1.9, d: 2.15, h: 1.1 }, colors: fabric, model: { template: "shape", params: { shape: "bed" } } },
  { id: "nightstand-pip", sku: "RC-2003", price: 1490, category: "bedroom", mount: "floor", name: t("Pip nightstand", "โต๊ะข้างเตียง พิป", "Pip 床头柜"), size: { w: 0.45, d: 0.4, h: 0.55 }, colors: wood, surface: true, model: { template: "shape", params: { shape: "nightstand" } } },
  { id: "wardrobe-fjell", sku: "RC-2001", price: 9990, category: "storage", mount: "floor", name: t("Fjell wardrobe", "ตู้เสื้อผ้า เฟียล", "Fjell 衣柜"), size: { w: 1, d: 0.58, h: 2 }, colors: wood, surface: true, model: { template: "shape", params: { shape: "wardrobe" } } },
  { id: "dresser-rau", sku: "RC-2002", price: 5990, category: "storage", mount: "floor", name: t("Rau 6-drawer dresser", "ตู้ 6 ลิ้นชัก ราว", "Rau 六斗柜"), size: { w: 1.2, d: 0.48, h: 0.8 }, colors: wood, surface: true, model: { template: "shape", params: { shape: "dresser" } } },
  { id: "bookcase-stav", sku: "RC-2004", price: 3290, category: "storage", mount: "floor", name: t("Stav bookcase", "ชั้นหนังสือ สตาฟ", "Stav 书柜"), size: { w: 0.8, d: 0.3, h: 1.8 }, colors: wood, surface: true, model: { template: "shape", params: { shape: "bookcase" } } },
  { id: "sofa-vila-3", sku: "RC-8001", price: 15990, category: "seating", mount: "floor", name: t("Vila 3-seat sofa", "โซฟา 3 ที่นั่ง วีลา", "Vila 三人沙发"), size: { w: 2.1, d: 0.9, h: 0.8 }, colors: fabric, model: { template: "shape", params: { shape: "sofa" } } },
  { id: "sofa-vila-2", sku: "RC-8002", price: 11990, category: "seating", mount: "floor", name: t("Vila 2-seat sofa", "โซฟา 2 ที่นั่ง วีลา", "Vila 双人沙发"), size: { w: 1.6, d: 0.9, h: 0.8 }, colors: fabric, model: { template: "shape", params: { shape: "sofa" } } },
  { id: "chair-mjuk-arm", sku: "RC-7002", price: 4990, category: "seating", mount: "floor", name: t("Mjuk armchair", "อาร์มแชร์ มยุก", "Mjuk 扶手椅"), size: { w: 0.8, d: 0.8, h: 0.8 }, colors: fabric, model: { template: "shape", params: { shape: "armchair" } } },
  { id: "chair-sit", sku: "RC-7001", price: 1290, category: "seating", mount: "floor", name: t("Sit dining chair", "เก้าอี้ทานอาหาร ซิท", "Sit 餐椅"), size: { w: 0.45, d: 0.5, h: 0.85 }, colors: wood, model: { template: "shape", params: { shape: "chair" } } },
  { id: "table-ek-dining", sku: "RC-6001", price: 7990, category: "tables", mount: "floor", name: t("Ek dining table", "โต๊ะทานอาหาร เอ็ก", "Ek 餐桌"), size: { w: 1.6, d: 0.9, h: 0.75 }, colors: wood, surface: true, model: { template: "shape", params: { shape: "table" } } },
  { id: "desk-plan", sku: "RC-6002", price: 3990, category: "tables", mount: "floor", name: t("Plan work desk", "โต๊ะทำงาน แพลน", "Plan 书桌"), size: { w: 1.2, d: 0.6, h: 0.74 }, colors: wood, surface: true, model: { template: "shape", params: { shape: "desk" } } },
  { id: "coffee-table-rund", sku: "RC-6003", price: 2490, category: "tables", mount: "floor", name: t("Rund coffee table", "โต๊ะกลาง รุนด์", "Rund 茶几"), size: { w: 0.9, d: 0.6, h: 0.42 }, colors: wood, surface: true, model: { template: "shape", params: { shape: "coffee-table" } } },
  { id: "rug-tova", sku: "RC-4001", price: 2990, category: "decor", mount: "floor", name: t("Tova flatwoven rug", "พรมทอเรียบ โทวา", "Tova 平织地毯"), size: { w: 2, d: 1.4, h: 0.01 }, colors: fabric, flat: true, model: { template: "shape", params: { shape: "rug" } } },
  { id: "rug-mira-round", sku: "RC-4002", price: 1990, category: "decor", mount: "floor", name: t("Mira short-pile rug", "พรมขนสั้น มิรา", "Mira 短绒地毯"), size: { w: 1.6, d: 1, h: 0.01 }, colors: fabric, flat: true, model: { template: "shape", params: { shape: "rug" } } },
  { id: "lamp-arc-floor", sku: "RC-3001", price: 2490, category: "decor", mount: "floor", name: t("Arc floor lamp", "โคมไฟตั้งพื้น อาร์ค", "Arc 落地灯"), size: { w: 0.4, d: 0.4, h: 1.6 }, colors: metal, light: true, model: { template: "shape", params: { shape: "floor-lamp" } } },
  { id: "lamp-dot-table", sku: "RC-3002", price: 790, category: "decor", mount: "floor", name: t("Dot table lamp", "โคมไฟตั้งโต๊ะ ดอท", "Dot 台灯"), size: { w: 0.25, d: 0.25, h: 0.45 }, colors: metal, stackable: true, light: true, model: { template: "shape", params: { shape: "table-lamp" } } },
  { id: "plant-fiddle", sku: "RC-5001", price: 890, category: "decor", mount: "floor", name: t("Fiddle plant in pot", "ต้นไทรใบสักในกระถาง", "琴叶榕盆栽"), size: { w: 0.4, d: 0.4, h: 1.2 }, colors: [{ id: "terracotta", hex: "#b7653f", name: t("Terracotta", "ดินเผา", "陶土色") }, { id: "white", hex: "#eeeeee", name: t("White", "ขาว", "白色") }], model: { template: "shape", params: { shape: "plant" } } },
  { id: "art-horizon", sku: "RC-5002", price: 990, category: "wall", mount: "wall", name: t("Horizon framed print", "ภาพพิมพ์มีกรอบ ฮอไรซัน", "Horizon 装框画"), size: { w: 0.7, d: 0.03, h: 0.5 }, colors: [{ id: "dusk", hex: "#c98b6b", name: t("Dusk", "ยามเย็น", "暮色") }, { id: "sea", hex: "#6b8fa8", name: t("Sea", "ทะเล", "海蓝") }], mountHeight: 1.3, model: { template: "shape", params: { shape: "wall-art" } } },
  { id: "mirror-oval", sku: "RC-5003", price: 1590, category: "wall", mount: "wall", name: t("Oval wall mirror", "กระจกติดผนังทรงรี", "椭圆壁镜"), size: { w: 0.5, d: 0.03, h: 0.9 }, colors: metal, mountHeight: 1, model: { template: "shape", params: { shape: "mirror" } } },
  { id: "shelf-lift", sku: "RC-2005", price: 690, category: "wall", mount: "wall", name: t("Lift wall shelf", "ชั้นติดผนัง ลิฟต์", "Lift 墙面搁板"), size: { w: 0.8, d: 0.22, h: 0.04 }, colors: wood, mountHeight: 1.4, model: { template: "shape", params: { shape: "shelf" } } },
  { id: "lamp-glow-pendant", sku: "RC-3003", price: 1290, category: "ceiling", mount: "ceiling", name: t("Glow pendant", "โคมไฟห้อย โกลว์", "Glow 吊灯"), size: { w: 0.4, d: 0.4, h: 0.6 }, colors: metal, light: true, model: { template: "shape", params: { shape: "pendant" } } },
];
