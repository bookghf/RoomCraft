import { WALL_T } from "@/features/designer/lib/geometry";
import type { FloorMat, OpeningSpec, PlanSpec, RoomType, Showroom, Text, XZ } from "@/features/designer/types";

/**
 * Seed data for the API (`roomcraft-api/tools/export-seed.ts`) and test fixtures. The app loads
 * room types and showrooms from the API at runtime (see ../content.ts).
 *
 * Styled showrooms: single rectangular rooms that open furnished. Room sizes are inner
 * (wall-face to wall-face) dimensions; the plan's wall centre-lines sit half a wall outside.
 */

const t = (en: string, th: string, zh: string): Text => ({ en, th, zh });

export const roomTypes: { id: RoomType; name: Text; blurb: Text; gradient: string }[] = [
  { id: "bedroom", name: t("Bedroom", "ห้องนอน", "卧室"), blurb: t("Restful spaces to wind down", "พื้นที่พักผ่อนให้ผ่อนคลาย", "放松身心的休憩空间"), gradient: "linear-gradient(135deg,#e9e1d4,#c9b79c)" },
  { id: "living-room", name: t("Living room", "ห้องนั่งเล่น", "客厅"), blurb: t("Gather, lounge and unwind", "รวมตัว นั่งเล่น และพักผ่อน", "相聚、休闲与放松"), gradient: "linear-gradient(135deg,#dfe6dc,#9aab92)" },
  { id: "dining", name: t("Dining", "ห้องทานอาหาร", "餐厅"), blurb: t("Tables for every occasion", "โต๊ะสำหรับทุกโอกาส", "适合各种场合的餐桌"), gradient: "linear-gradient(135deg,#f0dfd2,#c98b6b)" },
  { id: "home-office", name: t("Home office", "ห้องทำงาน", "家庭办公室"), blurb: t("Focus-friendly work corners", "มุมทำงานที่ช่วยให้มีสมาธิ", "助你专注的工作角"), gradient: "linear-gradient(135deg,#dde3ea,#6b8fa8)" },
  { id: "kids", name: t("Kids room", "ห้องเด็ก", "儿童房"), blurb: t("Playful and practical", "สนุกและใช้งานได้จริง", "有趣又实用"), gradient: "linear-gradient(135deg,#f5ecc8,#e0b75a)" },
];

type Side = "front" | "right" | "back" | "left";
interface RawOpening {
  side: Side;
  type: "door" | "window";
  /** Metres from the wall start, walking clockwise: front from x=0, right from z=0, back from x=w, left from z=d. */
  offset: number;
  width: number;
  height: number;
  sill?: number;
}

const floors: Record<"oak" | "walnut" | "tile-grey" | "carpet-beige", { material: FloorMat; color: string }> = {
  oak: { material: "wood", color: "#c9a77c" },
  walnut: { material: "wood", color: "#6e4b32" },
  "tile-grey": { material: "tile", color: "#b9b9b5" },
  "carpet-beige": { material: "carpet", color: "#d6c8b0" },
};

/** Opening centre on the wall centre-line of an inner w×d room. */
function openingSpec(o: RawOpening, w: number, d: number): OpeningSpec {
  const h = WALL_T / 2;
  const mid = o.offset + o.width / 2;
  const at: XZ = o.side === "front" ? [mid, -h] : o.side === "right" ? [w + h, mid] : o.side === "back" ? [w - mid, d + h] : [-h, d - mid];
  return { type: o.type, at, width: o.width, height: o.height, sill: o.sill };
}

function showroom(s: {
  id: string;
  type: RoomType;
  name: Text;
  description: Text;
  thumbnail: string;
  w: number;
  d: number;
  floor: keyof typeof floors;
  wallColor: string;
  openings: RawOpening[];
  items: Showroom["items"];
}): PlanSpec {
  const h = WALL_T / 2;
  const type = roomTypes.find((r) => r.id === s.type)!;
  return {
    id: s.id,
    name: s.name,
    area: Math.round(s.w * s.d * 10) / 10,
    zones: [
      {
        id: "room",
        kind: "room",
        name: type.name,
        polygon: [
          [-h, -h],
          [s.w + h, -h],
          [s.w + h, s.d + h],
          [-h, s.d + h],
        ],
      },
    ],
    openings: s.openings.map((o) => openingSpec(o, s.w, s.d)),
    fixtures: [],
    // Showroom ceilings are 2.60 m, the same as the unit plans' default.
    ceiling: 2.6,
    showroom: {
      type: s.type,
      description: s.description,
      thumbnail: s.thumbnail,
      floor: floors[s.floor],
      wall: { material: "paint", color: s.wallColor.toLowerCase() },
      items: s.items,
    },
  };
}

const H = Math.PI;
const HALF = Math.PI / 2;

export const showroomSpecs: PlanSpec[] = [
  showroom({
    id: "bedroom-calm",
    type: "bedroom",
    name: t("Calm Scandinavian bedroom", "ห้องนอนสแกนดิเนเวียนสงบ", "宁静北欧风卧室"),
    description: t("Soft neutrals, light birch and a cosy reading corner.", "โทนสีกลางนุ่มนวล ไม้เบิร์ชสีอ่อน และมุมอ่านหนังสือแสนอบอุ่น", "柔和中性色、浅色桦木和温馨的阅读角。"),
    thumbnail: "linear-gradient(135deg,#efe9df,#d6c6aa)",
    w: 4,
    d: 3.5,
    floor: "oak",
    wallColor: "#EDE8E0",
    openings: [
      { side: "front", type: "window", offset: 1.3, width: 1.4, height: 1.3, sill: 0.9 },
      { side: "back", type: "door", offset: 0.3, width: 0.9, height: 2.1 },
    ],
    items: [
      { itemId: "bed-linna-double", x: 2.95, z: 1.75, rot: -HALF },
      { itemId: "nightstand-pip", x: 3.78, z: 0.6, rot: -HALF },
      { itemId: "nightstand-pip", x: 3.78, z: 2.9, rot: -HALF },
      { itemId: "wardrobe-fjell", x: 0.29, z: 1.2, rot: HALF },
      { itemId: "rug-tova", x: 2.1, z: 1.75, rot: HALF },
      { itemId: "plant-fiddle", x: 0.4, z: 0.4, rot: 0, colorId: "terracotta" },
      { itemId: "art-horizon", x: 3.985, z: 1.75, rot: -HALF },
      { itemId: "lamp-glow-pendant", x: 2, z: 1.75, rot: 0 },
    ],
  }),
  showroom({
    id: "bedroom-dusk",
    type: "bedroom",
    name: t("Dusky green retreat", "ห้องนอนโทนเขียวหม่น", "暮绿静居"),
    description: t("Deep sage walls with walnut accents.", "ผนังสีเขียวเสจเข้มตัดกับไม้วอลนัท", "深鼠尾草绿墙面搭配胡桃木点缀。"),
    thumbnail: "linear-gradient(135deg,#a8b5a0,#5e6b58)",
    w: 4.4,
    d: 3.8,
    floor: "walnut",
    wallColor: "#A8B5A0",
    openings: [
      { side: "right", type: "window", offset: 1.2, width: 1.6, height: 1.4, sill: 0.8 },
      { side: "back", type: "door", offset: 3.2, width: 0.9, height: 2.1 },
    ],
    items: [
      { itemId: "bed-haven-king", x: 2.2, z: 1.075, rot: 0, colorId: "charcoal" },
      { itemId: "nightstand-pip", x: 0.9, z: 0.2, rot: 0, colorId: "walnut" },
      { itemId: "nightstand-pip", x: 3.5, z: 0.2, rot: 0, colorId: "walnut" },
      { itemId: "dresser-rau", x: 2.6, z: 3.56, rot: H, colorId: "walnut" },
      { itemId: "chair-mjuk-arm", x: 3.6, z: 3.0, rot: H + HALF / 2 },
      { itemId: "lamp-arc-floor", x: 4.1, z: 3.5, rot: 0, colorId: "brass" },
      { itemId: "mirror-oval", x: 2.6, z: 3.785, rot: H, colorId: "brass" },
    ],
  }),
  showroom({
    id: "living-airy",
    type: "living-room",
    name: t("Airy family living room", "ห้องนั่งเล่นครอบครัวโปร่งสบาย", "通透的家庭客厅"),
    description: t("A generous sofa, soft rug and plenty of plants.", "โซฟาตัวใหญ่ พรมนุ่ม และต้นไม้มากมาย", "宽大的沙发、柔软的地毯和许多绿植。"),
    thumbnail: "linear-gradient(135deg,#eef0ea,#b9c4b0)",
    w: 5.2,
    d: 4.2,
    floor: "oak",
    wallColor: "#F2F1EC",
    openings: [
      { side: "front", type: "window", offset: 1.0, width: 2.2, height: 1.6, sill: 0.6 },
      { side: "left", type: "door", offset: 0.4, width: 0.9, height: 2.1 },
    ],
    items: [
      { itemId: "sofa-vila-3", x: 2.6, z: 3.75, rot: H },
      { itemId: "rug-mira-round", x: 2.6, z: 2.5, rot: 0, colorId: "sage" },
      { itemId: "coffee-table-rund", x: 2.6, z: 2.5, rot: 0 },
      { itemId: "chair-mjuk-arm", x: 1.0, z: 2.3, rot: HALF },
      { itemId: "bookcase-stav", x: 5.05, z: 2.0, rot: -HALF },
      { itemId: "plant-fiddle", x: 4.7, z: 0.4, rot: 0 },
      { itemId: "lamp-arc-floor", x: 4.0, z: 3.8, rot: 0 },
      { itemId: "art-horizon", x: 2.6, z: 4.185, rot: H, colorId: "sea" },
      { itemId: "shelf-lift", x: 5.09, z: 3.3, rot: -HALF },
    ],
  }),
  showroom({
    id: "dining-warm",
    type: "dining",
    name: t("Warm dining nook", "มุมทานอาหารอบอุ่น", "温馨用餐角"),
    description: t("Terracotta tones around a dining table for four.", "โทนสีดินเผารอบโต๊ะทานอาหารสี่ที่นั่ง", "陶土色调环绕四人餐桌。"),
    thumbnail: "linear-gradient(135deg,#f0dfd2,#c98b6b)",
    w: 4.0,
    d: 3.6,
    floor: "tile-grey",
    wallColor: "#E9D8C8",
    openings: [
      { side: "front", type: "window", offset: 1.2, width: 1.6, height: 1.3, sill: 0.9 },
      { side: "right", type: "door", offset: 2.4, width: 0.9, height: 2.1 },
    ],
    items: [
      { itemId: "table-ek-dining", x: 2.0, z: 1.8, rot: 0 },
      { itemId: "chair-sit", x: 1.5, z: 1.1, rot: 0 },
      { itemId: "chair-sit", x: 2.5, z: 1.1, rot: 0 },
      { itemId: "chair-sit", x: 1.5, z: 2.5, rot: H },
      { itemId: "chair-sit", x: 2.5, z: 2.5, rot: H },
      { itemId: "lamp-glow-pendant", x: 2.0, z: 1.8, rot: 0, colorId: "brass" },
      { itemId: "dresser-rau", x: 0.24, z: 2.0, rot: HALF, colorId: "walnut" },
      { itemId: "plant-fiddle", x: 3.6, z: 3.2, rot: 0 },
      { itemId: "art-horizon", x: 0.015, z: 2.0, rot: HALF },
    ],
  }),
  showroom({
    id: "office-focus",
    type: "home-office",
    name: t("Focused home office", "ห้องทำงานที่บ้านเพื่อสมาธิ", "专注的家庭办公室"),
    description: t("Desk by the window, storage within reach.", "โต๊ะทำงานริมหน้าต่าง ที่เก็บของอยู่ใกล้มือ", "窗边书桌，收纳触手可及。"),
    thumbnail: "linear-gradient(135deg,#dde3ea,#7f98ad)",
    w: 3.2,
    d: 3.0,
    floor: "carpet-beige",
    wallColor: "#DDE3EA",
    openings: [
      { side: "front", type: "window", offset: 0.8, width: 1.4, height: 1.3, sill: 0.9 },
      { side: "back", type: "door", offset: 0.3, width: 0.85, height: 2.1 },
    ],
    items: [
      { itemId: "desk-plan", x: 1.5, z: 0.3, rot: 0 },
      { itemId: "chair-sit", x: 1.5, z: 0.85, rot: H },
      { itemId: "bookcase-stav", x: 2.95, z: 1.5, rot: -HALF },
      { itemId: "lamp-dot-table", x: 0.2, z: 2.2, rot: 0 },
      { itemId: "shelf-lift", x: 0.11, z: 1.5, rot: HALF },
      { itemId: "plant-fiddle", x: 0.3, z: 0.3, rot: 0, colorId: "white" },
    ],
  }),
  showroom({
    id: "kids-play",
    type: "kids",
    name: t("Sunny kids room", "ห้องเด็กสดใส", "阳光儿童房"),
    description: t("A single bed, open storage and room to play.", "เตียงเดี่ยว ชั้นเก็บของแบบเปิด และพื้นที่ให้เล่น", "单人床、开放式收纳和玩耍空间。"),
    thumbnail: "linear-gradient(135deg,#f5ecc8,#e0b75a)",
    w: 3.6,
    d: 3.2,
    floor: "carpet-beige",
    wallColor: "#F5ECC8",
    openings: [
      { side: "front", type: "window", offset: 1.0, width: 1.2, height: 1.2, sill: 0.9 },
      { side: "back", type: "door", offset: 2.4, width: 0.9, height: 2.1 },
    ],
    items: [
      { itemId: "bed-solo-single", x: 1.025, z: 1.6, rot: HALF, colorId: "white" },
      { itemId: "bookcase-stav", x: 3.3, z: 1.6, rot: -HALF, colorId: "white" },
      { itemId: "rug-tova", x: 2.2, z: 1.6, rot: HALF, colorId: "sage" },
      { itemId: "desk-plan", x: 2.4, z: 0.3, rot: 0, colorId: "white" },
      { itemId: "chair-sit", x: 2.4, z: 0.85, rot: H, colorId: "white" },
      { itemId: "art-horizon", x: 2.4, z: 3.185, rot: H },
    ],
  }),
];

/** Inner room size in metres (wall face to wall face). */
export { showroomSize } from "@/features/designer/lib/plans";
