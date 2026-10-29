import { describe, expect, it } from "vitest";
import { getProduct } from "@/data/products";
import { getRoom, presetDesigns, rooms } from "@/data/rooms";
import { clampToRoom, collides, itemRect, placeWallItem, rectsOverlap, wallHeight } from "@/features/planner/lib/placement";

const TOL = 0.005;

describe("preset designs", () => {
  it("every room has a preset design", () => {
    for (const r of rooms) expect(presetDesigns.some((d) => d.id === r.presetDesignId && d.roomId === r.id), r.id).toBe(true);
  });

  for (const design of presetDesigns) {
    describe(design.id, () => {
      const room = getRoom(design.roomId);

      it("references an existing room and products, with unique uids", () => {
        expect(room).toBeDefined();
        for (const it of design.items) expect(getProduct(it.productId), it.productId).toBeDefined();
        expect(new Set(design.items.map((i) => i.uid)).size).toBe(design.items.length);
      });

      it("uses valid colour ids", () => {
        for (const it of design.items) {
          if (!it.colorId) continue;
          const product = getProduct(it.productId)!;
          expect(product.colors.map((c) => c.id), `${it.uid} ${it.productId}`).toContain(it.colorId);
        }
      });

      it("keeps every item inside the room / on its mount", () => {
        const violations: string[] = [];
        for (const it of design.items) {
          const product = getProduct(it.productId)!;
          const [x, y, z] = it.position;
          if (product.mount === "wall") {
            const r = placeWallItem(room!, product, it.position);
            const off = Math.hypot(r.position[0] - x, r.position[1] - y, r.position[2] - z);
            if (off > TOL || !r.valid) violations.push(`${it.uid} ${it.productId}: wall placement → ${r.position.map((v) => v.toFixed(3))} valid=${r.valid}`);
          } else if (product.mount === "ceiling") {
            const want = wallHeight(room!) - product.dimensions.h;
            if (Math.abs(y - want) > TOL) violations.push(`${it.uid} ${it.productId}: y should be ${want}`);
          } else {
            const c = clampToRoom(room!, product, x, z, it.rotationY);
            if (Math.abs(c.x - x) > TOL || Math.abs(c.z - z) > TOL) violations.push(`${it.uid} ${it.productId}: outside room, clamped → [${c.x.toFixed(3)}, 0, ${c.z.toFixed(3)}]`);
          }
        }
        expect(violations).toEqual([]);
      });

      it("has no overlapping floor furniture", () => {
        const floor = design.items.map((i) => ({ i, p: getProduct(i.productId)! })).filter(({ p }) => collides(p));
        const overlaps: string[] = [];
        for (let a = 0; a < floor.length; a++) {
          for (let b = a + 1; b < floor.length; b++) {
            const A = floor[a];
            const B = floor[b];
            if (rectsOverlap(itemRect(A.p, A.i.position[0], A.i.position[2], A.i.rotationY), itemRect(B.p, B.i.position[0], B.i.position[2], B.i.rotationY))) {
              overlaps.push(`${A.i.uid} ${A.p.id} ↔ ${B.i.uid} ${B.p.id}`);
            }
          }
        }
        expect(overlaps).toEqual([]);
      });
    });
  }
});
