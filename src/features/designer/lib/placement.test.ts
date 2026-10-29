import { describe, expect, it } from "vitest";
import { getCatalogItem } from "@/features/designer/data/catalog";
import { emptyPlanSpec, planSpecs } from "@/features/designer/data/plans";
import type { DItem } from "@/features/designer/types";
import { checkItems, withDescendants, type Ctx } from "./collision";
import { resolvePlan } from "./geometry";
import { distanceLines } from "./measure";
import { alignSnap, findFreeSpot, placeFlat, placeOnFace, reseatForCeiling, tryMoveSet, wallFaces } from "./placement";

const room = resolvePlan(emptyPlanSpec(4, 4));
const ctxOf = (items: DItem[], plan = room, ceiling = 2.6): Ctx => ({ plan, ceiling, items });
const item = (uid: string, itemId: string, x: number, z: number, extra: Partial<DItem> = {}): DItem => ({ uid, itemId, colorId: "", x, y: 0, z, rot: 0, ...extra });

describe("collisions", () => {
  it("rejects overlapping furniture and reports the blocker", () => {
    const bed = item("bed", "bed-double", 2, 2);
    const desk = item("desk", "desk", 2.2, 2.4);
    const r = checkItems(ctxOf([bed]), [desk]);
    expect(r.valid).toBe(false);
    expect(r.blockers).toContain("item:bed");
  });

  it("allows furniture touching edge to edge", () => {
    const a = item("a", "desk", 1, 1); // 1.2 wide
    const b = item("b", "desk", 2.2, 1);
    expect(checkItems(ctxOf([a]), [b]).valid).toBe(true);
  });

  it("rejects furniture through a wall or outside the room", () => {
    const r = checkItems(ctxOf([]), [item("w", "wardrobe", 0.2, 2)]);
    expect(r.valid).toBe(false);
    expect(r.blockers.some((b) => b.startsWith("wall:"))).toBe(true);
  });

  it("lets a rug lie under a bed", () => {
    const bed = item("bed", "bed-double", 2, 2);
    expect(checkItems(ctxOf([bed]), [item("rug", "rug", 2, 2)]).valid).toBe(true);
  });

  it("lets a pendant hang over a bed but not a wardrobe reach into a pendant", () => {
    const bed = item("bed", "bed-double", 2, 2);
    const pendant = placeFlat(ctxOf([bed]), item("p", "pendant", 0, 0), getCatalogItem("pendant")!, 2, 2, 0, new Set());
    expect(pendant.y).toBeCloseTo(2.6 - 0.7);
    expect(checkItems(ctxOf([bed]), [pendant]).valid).toBe(true);
    const ward = item("w", "wardrobe", 2, 1);
    const hang = placeFlat(ctxOf([]), item("p2", "pendant", 0, 0), getCatalogItem("pendant")!, 2, 1, 0, new Set());
    expect(checkItems(ctxOf([ward]), [hang]).valid).toBe(false);
  });

  it("blocks built-in fixtures", () => {
    const plan = resolvePlan(planSpecs.find((p) => p.id === "1br-30")!);
    const r = checkItems(ctxOf([], plan), [item("s", "stool", 0.51, 0.51)]);
    expect(r.blockers).toContain("fixture:shower");
  });
});

describe("stacking", () => {
  it("puts a lamp on a desk and moves it with the desk", () => {
    const desk = item("desk", "desk", 2, 2);
    const ctx = ctxOf([desk]);
    const lamp = placeFlat(ctx, item("lamp", "table-lamp", 0, 0), getCatalogItem("table-lamp")!, 2.3, 2.1, 0, new Set(["lamp"]));
    expect(lamp.on).toBe("desk");
    expect(lamp.y).toBeCloseTo(0.75);
    expect(checkItems(ctx, [lamp]).valid).toBe(true);

    const items = [desk, lamp];
    const set = withDescendants(items, ["desk"]);
    expect([...set].sort()).toEqual(["desk", "lamp"]);
    const r = tryMoveSet(ctxOf(items), set, 0.5, 0, Math.PI / 2, [2, 2]);
    expect(r.valid).toBe(true);
    const movedLamp = r.items.find((i) => i.uid === "lamp")!;
    // offset (0.3, 0.1) from the desk turns to (0.1, -0.3), then moves 0.5 along x
    expect(movedLamp.x).toBeCloseTo(2.6);
    expect(movedLamp.z).toBeCloseTo(1.7);
    expect(movedLamp.y).toBeCloseTo(0.75);
  });

  it("does not stack non-stackable items", () => {
    const desk = item("desk", "desk", 2, 2);
    const chair = placeFlat(ctxOf([desk]), item("c", "chair", 0, 0), getCatalogItem("chair")!, 2, 2, 0, new Set(["c"]));
    expect(chair.on).toBeUndefined();
    expect(chair.y).toBe(0);
  });
});

describe("wall items", () => {
  it("snaps to a face, faces into the room and avoids the window", () => {
    const faces = wallFaces(room);
    expect(faces).toHaveLength(4);
    const back = faces.find((f) => f.wall.a[1] === 0 && f.wall.b[1] === 0)!;
    const art = placeOnFace(ctxOf([]), item("art", "wall-art", 0, 0), getCatalogItem("wall-art")!, back, 2, 1.3);
    expect(art.z).toBeGreaterThan(0);
    expect(Math.cos(art.rot)).toBeCloseTo(1); // front faces +z, into the room
    // centre of the 1.6 m window at 0.9–2.2 m height
    expect(checkItems(ctxOf([]), [art]).valid).toBe(false);
    const low = placeOnFace(ctxOf([]), art, getCatalogItem("wall-art")!, back, 2, 0.3);
    expect(checkItems(ctxOf([]), [low]).valid).toBe(true);
  });

  it("lets a shelf hang over a desk but not into a wardrobe", () => {
    const back = wallFaces(room).find((f) => f.wall.a[1] === 4 && f.wall.b[1] === 4)!;
    const shelf = placeOnFace(ctxOf([]), item("s", "wall-shelf", 0, 0), getCatalogItem("wall-shelf")!, back, 1.5, 1.4);
    const desk = item("d", "desk", shelf.x, 4 - 0.06 - 0.3, { rot: Math.PI });
    expect(checkItems(ctxOf([desk]), [shelf]).valid).toBe(true);
    const ward = item("w", "wardrobe", shelf.x, 4 - 0.06 - 0.29, { rot: Math.PI });
    expect(checkItems(ctxOf([ward]), [shelf]).valid).toBe(false);
  });

  it("re-seats wall and ceiling items when the ceiling changes", () => {
    const pendant = item("p", "pendant", 2, 2, { y: 1.9 });
    const [moved] = reseatForCeiling(ctxOf([], room, 2.4), [pendant]);
    expect(moved.y).toBeCloseTo(1.7);
  });
});

describe("free spots and snapping", () => {
  it("finds a free spot in the focused zone", () => {
    const plan = resolvePlan(planSpecs.find((p) => p.id === "2br-65")!);
    const spot = findFreeSpot(ctxOf([], plan), getCatalogItem("bed-double")!, item("n", "bed-double", 0, 0), "master");
    expect(spot).not.toBeNull();
    expect(spot!.x).toBeLessThan(3.4);
    expect(spot!.z).toBeGreaterThan(3.6);
  });

  it("snaps to a neighbour's edge and flush to a wall", () => {
    const desk = item("desk", "desk", 2, 1);
    const cat = getCatalogItem("bedside-table")!;
    const r = alignSnap(ctxOf([desk]), cat, 0.06 + 0.225 + 0.03, 2.03, 0, new Set(["n"]));
    expect(r.x).toBeCloseTo(0.06 + 0.225);
    expect(r.guides.length).toBeGreaterThan(0);
  });
});

describe("distance lines", () => {
  it("measures to the walls and hides touching sides", () => {
    const desk = item("desk", "desk", 0.06 + 0.6, 2); // touching the left wall
    const lines = distanceLines(ctxOf([desk]), "desk");
    expect(lines).toHaveLength(3);
    const right = lines.find((l) => l.b[0] > l.a[0])!;
    expect(right.d).toBeCloseTo(4 - 0.06 - (0.06 + 1.2));
  });
});
