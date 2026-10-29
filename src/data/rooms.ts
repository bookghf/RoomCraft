import type { Design, Room, RoomType } from "@/types/planner";

export const roomTypes: { id: RoomType; label: string; blurb: string; gradient: string }[] = [
  { id: "bedroom", label: "Bedroom", blurb: "Restful spaces to wind down", gradient: "linear-gradient(135deg,#e9e1d4,#c9b79c)" },
  { id: "living-room", label: "Living room", blurb: "Gather, lounge and unwind", gradient: "linear-gradient(135deg,#dfe6dc,#9aab92)" },
  { id: "dining", label: "Dining", blurb: "Tables for every occasion", gradient: "linear-gradient(135deg,#f0dfd2,#c98b6b)" },
  { id: "home-office", label: "Home office", blurb: "Focus-friendly work corners", gradient: "linear-gradient(135deg,#dde3ea,#6b8fa8)" },
  { id: "kids", label: "Kids room", blurb: "Playful and practical", gradient: "linear-gradient(135deg,#f5ecc8,#e0b75a)" },
];

/** Rectangular room helper: walls run clockwise from origin, w1 along +x at z=0. */
function rectWalls(w: number, d: number, h: number, openings: Partial<Record<"w1" | "w2" | "w3" | "w4", Room["walls"][number]["openings"]>>): Room["walls"] {
  return [
    { id: "w1", start: [0, 0], end: [w, 0], height: h, openings: openings.w1 },
    { id: "w2", start: [w, 0], end: [w, d], height: h, openings: openings.w2 },
    { id: "w3", start: [w, d], end: [0, d], height: h, openings: openings.w3 },
    { id: "w4", start: [0, d], end: [0, 0], height: h, openings: openings.w4 },
  ];
}

function rectRoom(base: Omit<Room, "walls" | "floor" | "viewpoints"> & { w: number; d: number; h?: number; openings: Parameters<typeof rectWalls>[3]; material: Room["floor"]["material"] }): Room {
  const { w, d, h = 2.6, openings, material, ...rest } = base;
  return {
    ...rest,
    walls: rectWalls(w, d, h, openings),
    floor: { polygon: [[0, 0], [w, 0], [w, d], [0, d]], material },
    viewpoints: [
      { id: "door", label: "Door", position: [w * 0.2, 1.6, d - 0.25], target: [w * 0.6, 0.8, d * 0.2] },
      { id: "window", label: "Window", position: [w * 0.5, 1.6, 0.3], target: [w * 0.5, 0.8, d * 0.85] },
      { id: "corner", label: "Corner", position: [w - 0.3, 2.2, d - 0.3], target: [w * 0.35, 0.5, d * 0.35] },
      { id: "top", label: "Top", position: [w / 2, Math.max(w, d) * 1.6, d / 2 + 0.01], target: [w / 2, 0, d / 2] },
    ],
  };
}

export const rooms: Room[] = [
  rectRoom({
    id: "bedroom-calm", type: "bedroom", name: "Calm Scandinavian bedroom",
    description: "Soft neutrals, light birch and a cosy reading corner.",
    thumbnail: "linear-gradient(135deg,#efe9df,#d6c6aa)", wallColor: "#EDE8E0", presetDesignId: "bedroom-calm-default",
    w: 4, d: 3.5, material: "oak",
    openings: { w1: [{ type: "window", offset: 1.3, width: 1.4, height: 1.3, sill: 0.9 }], w3: [{ type: "door", offset: 0.3, width: 0.9, height: 2.1 }] },
  }),
  rectRoom({
    id: "bedroom-dusk", type: "bedroom", name: "Dusky green retreat",
    description: "Deep sage walls with walnut accents.",
    thumbnail: "linear-gradient(135deg,#a8b5a0,#5e6b58)", wallColor: "#A8B5A0", presetDesignId: "bedroom-dusk-default",
    w: 4.4, d: 3.8, material: "walnut",
    openings: { w2: [{ type: "window", offset: 1.2, width: 1.6, height: 1.4, sill: 0.8 }], w3: [{ type: "door", offset: 3.2, width: 0.9, height: 2.1 }] },
  }),
  rectRoom({
    id: "living-airy", type: "living-room", name: "Airy family living room",
    description: "A generous sofa, round rug and plenty of plants.",
    thumbnail: "linear-gradient(135deg,#eef0ea,#b9c4b0)", wallColor: "#F2F1EC", presetDesignId: "living-airy-default",
    w: 5.2, d: 4.2, material: "oak",
    openings: { w1: [{ type: "window", offset: 1.0, width: 2.2, height: 1.6, sill: 0.6 }], w4: [{ type: "door", offset: 0.4, width: 0.9, height: 2.1 }] },
  }),
  rectRoom({
    id: "dining-warm", type: "dining", name: "Warm dining nook",
    description: "Terracotta tones around a six-seat table.",
    thumbnail: "linear-gradient(135deg,#f0dfd2,#c98b6b)", wallColor: "#E9D8C8", presetDesignId: "dining-warm-default",
    w: 4.0, d: 3.6, material: "tile-grey",
    openings: { w1: [{ type: "window", offset: 1.2, width: 1.6, height: 1.3, sill: 0.9 }], w2: [{ type: "door", offset: 2.4, width: 0.9, height: 2.1 }] },
  }),
  rectRoom({
    id: "office-focus", type: "home-office", name: "Focused home office",
    description: "Desk by the window, storage within reach.",
    thumbnail: "linear-gradient(135deg,#dde3ea,#7f98ad)", wallColor: "#DDE3EA", presetDesignId: "office-focus-default",
    w: 3.2, d: 3.0, material: "carpet-beige",
    openings: { w1: [{ type: "window", offset: 0.8, width: 1.4, height: 1.3, sill: 0.9 }], w3: [{ type: "door", offset: 0.3, width: 0.85, height: 2.1 }] },
  }),
  rectRoom({
    id: "kids-play", type: "kids", name: "Sunny kids room",
    description: "A single bed, open storage and room to play.",
    thumbnail: "linear-gradient(135deg,#f5ecc8,#e0b75a)", wallColor: "#F5ECC8", presetDesignId: "kids-play-default",
    w: 3.6, d: 3.2, material: "carpet-beige",
    openings: { w1: [{ type: "window", offset: 1.0, width: 1.2, height: 1.2, sill: 0.9 }], w3: [{ type: "door", offset: 2.4, width: 0.9, height: 2.1 }] },
  }),
];

const H = Math.PI;
const HALF = Math.PI / 2;
const now = "2026-01-01T00:00:00.000Z";

/** Floor item rotationY: 0 = front faces +z (back against w1 at z=0). */
export const presetDesigns: Design[] = [
  {
    id: "bedroom-calm-default", roomId: "bedroom-calm", wallColor: "#EDE8E0", floorMaterial: "oak", updatedAt: now,
    items: [
      { uid: "p1", productId: "bed-linna-double", position: [2.95, 0, 1.75], rotationY: -HALF },
      { uid: "p1b", productId: "nightstand-pip", position: [3.78, 0, 0.6], rotationY: -HALF },
      { uid: "p2", productId: "nightstand-pip", position: [3.78, 0, 2.9], rotationY: -HALF },
      { uid: "p3", productId: "wardrobe-fjell", position: [0.29, 0, 1.2], rotationY: HALF },
      { uid: "p4", productId: "rug-tova", position: [2.1, 0, 1.75], rotationY: HALF },
      { uid: "p5", productId: "plant-fiddle", position: [0.4, 0, 0.4], rotationY: 0, colorId: "terracotta" },
      { uid: "p6", productId: "art-horizon", position: [3.985, 1.3, 1.75], rotationY: -HALF },
      { uid: "p7", productId: "lamp-glow-pendant", position: [2, 2.0, 1.75], rotationY: 0 },
    ],
  },
  {
    id: "bedroom-dusk-default", roomId: "bedroom-dusk", wallColor: "#A8B5A0", floorMaterial: "walnut", updatedAt: now,
    items: [
      { uid: "p1", productId: "bed-haven-king", position: [2.2, 0, 1.075], rotationY: 0, colorId: "charcoal" },
      { uid: "p2", productId: "nightstand-pip", position: [0.9, 0, 0.2], rotationY: 0, colorId: "walnut" },
      { uid: "p3", productId: "nightstand-pip", position: [3.5, 0, 0.2], rotationY: 0, colorId: "walnut" },
      { uid: "p4", productId: "dresser-rau", position: [2.6, 0, 3.56], rotationY: H, colorId: "walnut" },
      { uid: "p5", productId: "chair-mjuk-arm", position: [3.6, 0, 3.0], rotationY: H + HALF / 2 },
      { uid: "p6", productId: "lamp-arc-floor", position: [4.1, 0, 3.5], rotationY: 0, colorId: "brass" },
      { uid: "p7", productId: "mirror-oval", position: [2.6, 1.0, 3.785], rotationY: H, colorId: "brass" },
    ],
  },
  {
    id: "living-airy-default", roomId: "living-airy", wallColor: "#F2F1EC", floorMaterial: "oak", updatedAt: now,
    items: [
      { uid: "p1", productId: "sofa-vila-3", position: [2.6, 0, 3.75], rotationY: H },
      { uid: "p2", productId: "coffee-table-rund", position: [2.6, 0, 2.5], rotationY: 0 },
      { uid: "p3", productId: "rug-mira-round", position: [2.6, 0, 2.5], rotationY: 0, colorId: "sage" },
      { uid: "p4", productId: "chair-mjuk-arm", position: [1.0, 0, 2.3], rotationY: HALF },
      { uid: "p5", productId: "bookcase-stav", position: [5.05, 0, 2.0], rotationY: -HALF },
      { uid: "p6", productId: "plant-fiddle", position: [4.7, 0, 0.4], rotationY: 0 },
      { uid: "p7", productId: "lamp-arc-floor", position: [4.0, 0, 3.8], rotationY: 0 },
      { uid: "p8", productId: "art-horizon", position: [2.6, 1.3, 4.185], rotationY: H, colorId: "sea" },
      { uid: "p9", productId: "shelf-lift", position: [5.09, 1.4, 3.3], rotationY: -HALF },
    ],
  },
  {
    id: "dining-warm-default", roomId: "dining-warm", wallColor: "#E9D8C8", floorMaterial: "tile-grey", updatedAt: now,
    items: [
      { uid: "p1", productId: "table-ek-dining", position: [2.0, 0, 1.8], rotationY: 0 },
      { uid: "c1", productId: "chair-sit", position: [1.5, 0, 1.1], rotationY: 0 },
      { uid: "c2", productId: "chair-sit", position: [2.5, 0, 1.1], rotationY: 0 },
      { uid: "c3", productId: "chair-sit", position: [1.5, 0, 2.5], rotationY: H },
      { uid: "c4", productId: "chair-sit", position: [2.5, 0, 2.5], rotationY: H },
      { uid: "p2", productId: "lamp-glow-pendant", position: [2.0, 2.0, 1.8], rotationY: 0, colorId: "brass" },
      { uid: "p3", productId: "dresser-rau", position: [0.24, 0, 2.0], rotationY: HALF, colorId: "walnut" },
      { uid: "p4", productId: "plant-fiddle", position: [3.6, 0, 3.2], rotationY: 0 },
      { uid: "p5", productId: "art-horizon", position: [0.015, 1.4, 2.0], rotationY: HALF },
    ],
  },
  {
    id: "office-focus-default", roomId: "office-focus", wallColor: "#DDE3EA", floorMaterial: "carpet-beige", updatedAt: now,
    items: [
      { uid: "p1", productId: "desk-plan", position: [1.5, 0, 0.3], rotationY: 0 },
      { uid: "p2", productId: "chair-sit", position: [1.5, 0, 0.85], rotationY: H },
      { uid: "p3", productId: "bookcase-stav", position: [2.95, 0, 1.5], rotationY: -HALF },
      { uid: "p4", productId: "lamp-dot-table", position: [0.2, 0, 2.2], rotationY: 0 },
      { uid: "p5", productId: "shelf-lift", position: [0.11, 1.4, 1.5], rotationY: HALF },
      { uid: "p6", productId: "plant-fiddle", position: [0.3, 0, 0.3], rotationY: 0, colorId: "white" },
    ],
  },
  {
    id: "kids-play-default", roomId: "kids-play", wallColor: "#F5ECC8", floorMaterial: "carpet-beige", updatedAt: now,
    items: [
      { uid: "p1", productId: "bed-solo-single", position: [1.025, 0, 1.6], rotationY: HALF, colorId: "white" },
      { uid: "p2", productId: "bookcase-stav", position: [3.3, 0, 1.6], rotationY: -HALF, colorId: "white" },
      { uid: "p3", productId: "rug-tova", position: [2.2, 0, 1.6], rotationY: HALF, colorId: "sage" },
      { uid: "p4", productId: "desk-plan", position: [2.4, 0, 0.3], rotationY: 0, colorId: "white" },
      { uid: "p5", productId: "chair-sit", position: [2.4, 0, 0.85], rotationY: H, colorId: "white" },
      { uid: "p6", productId: "art-horizon", position: [2.4, 1.3, 3.185], rotationY: H },
    ],
  },
];

export function getRoom(id: string): Room | undefined {
  return rooms.find((r) => r.id === id);
}

export function getRoomsByType(type: string): Room[] {
  return rooms.filter((r) => r.type === type);
}

export function getPresetDesign(roomId: string): Design | undefined {
  const room = getRoom(roomId);
  return presetDesigns.find((d) => d.id === room?.presetDesignId);
}
