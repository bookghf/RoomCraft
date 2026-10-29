import { describe, expect, it } from "vitest";
import { getProduct } from "@/data/products";
import { getRoom } from "@/data/rooms";
import type { PlacedItem, Product, Room } from "@/types/planner";
import {
  clampToRoom,
  findFreeSpot,
  placeCeilingItem,
  placeFloorItem,
  placeWallItem,
  rectsOverlap,
  type Neighbour,
} from "./placement";

const room = getRoom("bedroom-calm") as Room; // 4 x 3.5 m, window on w1 (offset 1.3, width 1.4, sill 0.9, h 1.3)
const p = (id: string) => getProduct(id) as Product;
const nightstand = p("nightstand-pip"); // 0.45 x 0.4
const bed = p("bed-linna-double"); // 1.6 x 2.1
const rug = p("rug-tova");
const art = p("art-horizon"); // 0.7 x 0.03 x 0.5
const pendant = p("lamp-glow-pendant"); // h 0.6

function n(product: Product, x: number, z: number, rotationY = 0): Neighbour {
  const item: PlacedItem = { uid: `${product.id}-${x}-${z}`, productId: product.id, position: [x, 0, z], rotationY };
  return { item, product };
}

describe("clamping", () => {
  it("keeps the footprint inside the room", () => {
    const r = clampToRoom(room, bed, -5, 10, 0);
    expect(r.x).toBeCloseTo(0.8);
    expect(r.z).toBeCloseTo(3.5 - 1.05);
  });

  it("uses the rotated footprint", () => {
    const r = clampToRoom(room, bed, -5, -5, Math.PI / 2);
    expect(r.x).toBeCloseTo(1.05);
    expect(r.z).toBeCloseTo(0.8);
  });

  it("placeFloorItem never leaves the room", () => {
    const r = placeFloorItem(room, bed, { x: 99, z: 99 }, 0, [], { wallSnap: false });
    expect(r.position[0]).toBeCloseTo(4 - 0.8);
    expect(r.position[2]).toBeCloseTo(3.5 - 1.05);
    expect(r.position[1]).toBe(0);
  });
});

describe("wall snap", () => {
  // back edge 5 cm from each wall, starting rotation deliberately "wrong"
  const cases = [
    { wall: "w1", desired: { x: 2, z: 0.25 }, expectPos: [2, 0.2], rot: 0 },
    { wall: "w2", desired: { x: 3.75, z: 1.75 }, expectPos: [3.8, 1.75], rot: -Math.PI / 2 },
    { wall: "w3", desired: { x: 2, z: 3.25 }, expectPos: [2, 3.3], rot: Math.PI },
    { wall: "w4", desired: { x: 0.25, z: 1.75 }, expectPos: [0.2, 1.75], rot: Math.PI / 2 },
  ];

  for (const c of cases) {
    it(`snaps flush to ${c.wall} and faces into the room`, () => {
      const r = placeFloorItem(room, nightstand, c.desired, 0.3, []);
      expect(r.wallId).toBe(c.wall);
      expect(r.position[0]).toBeCloseTo(c.expectPos[0]);
      expect(r.position[2]).toBeCloseTo(c.expectPos[1]);
      expect(Math.cos(r.rotationY)).toBeCloseTo(Math.cos(c.rot));
      expect(Math.sin(r.rotationY)).toBeCloseTo(Math.sin(c.rot));
    });
  }

  it("does not snap when the back edge is more than 10 cm away", () => {
    const r = placeFloorItem(room, nightstand, { x: 2, z: 0.45 }, 0.3, []);
    expect(r.wallId).toBeUndefined();
    expect(r.rotationY).toBe(0.3);
    expect(r.position[2]).toBeCloseTo(0.45);
  });

  it("can be disabled", () => {
    const r = placeFloorItem(room, nightstand, { x: 2, z: 0.25 }, 0, [], { wallSnap: false });
    expect(r.wallId).toBeUndefined();
    expect(r.position[2]).toBeCloseTo(0.25);
  });
});

describe("rectsOverlap (OBB)", () => {
  const a = { cx: 0, cz: 0, hw: 0.5, hd: 0.5, rot: 0 };

  it("detects axis-aligned overlap", () => {
    expect(rectsOverlap(a, { ...a, cx: 0.9 })).toBe(true);
  });

  it("treats touching edges as not overlapping", () => {
    expect(rectsOverlap(a, { ...a, cx: 1 })).toBe(false);
  });

  it("separated rects do not overlap", () => {
    expect(rectsOverlap(a, { ...a, cx: 2, cz: 2 })).toBe(false);
  });

  it("handles rotated rects", () => {
    const diamond = { ...a, rot: Math.PI / 4 }; // reaches x = ±0.707
    expect(rectsOverlap(diamond, { ...a, cx: 1.1 })).toBe(true);
    expect(rectsOverlap(diamond, { ...a, cx: 1.25 })).toBe(false);
  });

  it("long rotated rect vs offset rect", () => {
    const plank = { cx: 0, cz: 0, hw: 1, hd: 0.05, rot: Math.PI / 2 }; // now runs along z
    expect(rectsOverlap(plank, { ...a, cx: 0, cz: 1.2, hw: 0.3, hd: 0.3 })).toBe(true);
    expect(rectsOverlap(plank, { ...a, cx: 0.5, cz: 0, hw: 0.3, hd: 0.3 })).toBe(false);
  });
});

describe("collision validity", () => {
  it("flags overlapping furniture as invalid", () => {
    const r = placeFloorItem(room, nightstand, { x: 2, z: 1.75 }, 0, [n(bed, 2, 1.75)], { wallSnap: false });
    expect(r.valid).toBe(false);
  });

  it("accepts a free spot", () => {
    const r = placeFloorItem(room, nightstand, { x: 0.5, z: 1.75 }, 0, [n(bed, 2.5, 1.75)], { wallSnap: false });
    expect(r.valid).toBe(true);
  });

  it("rugs never collide, in either direction", () => {
    expect(placeFloorItem(room, rug, { x: 2, z: 1.75 }, 0, [n(bed, 2, 1.75)], { wallSnap: false }).valid).toBe(true);
    expect(placeFloorItem(room, bed, { x: 2, z: 1.75 }, 0, [n(rug, 2, 1.75)], { wallSnap: false }).valid).toBe(true);
  });
});

describe("wall items", () => {
  it("lands on the nearest wall facing into the room", () => {
    const r = placeWallItem(room, art, [3.9, 1.3, 1.75]);
    expect(r.wallId).toBe("w2");
    expect(r.position[0]).toBeCloseTo(4 - 0.015);
    expect(r.position[2]).toBeCloseTo(1.75);
    expect(r.position[1]).toBeCloseTo(1.3);
    expect(r.rotationY).toBeCloseTo(-Math.PI / 2);
    expect(r.valid).toBe(true);
  });

  it("is invalid over a window", () => {
    const r = placeWallItem(room, art, [2, 1.3, 0.1]);
    expect(r.wallId).toBe("w1");
    expect(r.position[2]).toBeCloseTo(0.015);
    expect(r.rotationY).toBeCloseTo(0);
    expect(r.valid).toBe(false);
  });

  it("is valid beside the window and kept within the wall length", () => {
    const r = placeWallItem(room, art, [0.3, 1.3, 0.02]);
    expect(r.wallId).toBe("w1");
    expect(r.position[0]).toBeCloseTo(0.35);
    expect(r.valid).toBe(true);
  });

  it("clamps height below the ceiling", () => {
    const r = placeWallItem(room, art, [3.9, 9, 1.75]);
    expect(r.position[1]).toBeCloseTo(2.6 - 0.5 - 0.05);
  });
});

describe("ceiling items", () => {
  it("hang with their top at the ceiling", () => {
    const r = placeCeilingItem(room, pendant, { x: 2, z: 1.75 }, 0);
    expect(r.position[1]).toBeCloseTo(2.6 - 0.6);
    expect(r.valid).toBe(true);
  });
});

describe("findFreeSpot", () => {
  it("finds a non-overlapping spot in a crowded room", () => {
    const others = [n(bed, 2, 1.75), n(p("wardrobe-fjell"), 0.5, 0.3), n(p("dresser-rau"), 3.4, 3.2)];
    const r = findFreeSpot(room, nightstand, others);
    expect(r.valid).toBe(true);
    const placed = { cx: r.position[0], cz: r.position[2], hw: 0.225, hd: 0.2, rot: r.rotationY };
    for (const o of others) {
      const rect = { cx: o.item.position[0], cz: o.item.position[2], hw: o.product.dimensions.w / 2, hd: o.product.dimensions.d / 2, rot: o.item.rotationY };
      expect(rectsOverlap(placed, rect)).toBe(false);
    }
  });

  it("finds a wall spot that avoids openings", () => {
    const r = findFreeSpot(room, art, []);
    expect(r.valid).toBe(true);
    expect(r.wallId).toBeDefined();
  });
});
