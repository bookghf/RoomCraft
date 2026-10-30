import { describe, expect, it } from "vitest";
import { getCatalogItem, getPlanSpec } from "@/features/designer/content";
import { showroomSize, showroomSpecs } from "@/features/designer/data/showrooms";
import { checkItems } from "./collision";
import { cachedPlan } from "./geometry";
import { presetItems } from "./presets";

describe("showroom presets", () => {
  it("are reachable through getPlanSpec", () => {
    for (const spec of showroomSpecs) expect(getPlanSpec(spec.id)).toBe(spec);
  });

  it("use only catalog items and colours", () => {
    for (const spec of showroomSpecs) {
      for (const p of spec.showroom!.items) {
        const cat = getCatalogItem(p.itemId);
        expect(cat, `${spec.id}: ${p.itemId}`).toBeDefined();
        if (p.colorId) expect(cat!.colors.map((c) => c.id), `${spec.id}: ${p.itemId}`).toContain(p.colorId);
      }
    }
  });

  it("place every item without collisions", () => {
    for (const spec of showroomSpecs) {
      const items = presetItems(spec);
      expect(items, spec.id).toHaveLength(spec.showroom!.items.length);
      const result = checkItems({ plan: cachedPlan(spec), ceiling: spec.ceiling, items }, items);
      expect(result.blockers, spec.id).toEqual([]);
      expect(result.valid, spec.id).toBe(true);
    }
  });

  it("hang wall items on a wall and keep floor items where the showroom put them", () => {
    for (const spec of showroomSpecs) {
      const items = presetItems(spec);
      spec.showroom!.items.forEach((p, i) => {
        const cat = getCatalogItem(p.itemId)!;
        const it = items[i];
        if (cat.mount === "wall") {
          expect(it.wallId, `${spec.id}: ${p.itemId}`).toBeDefined();
          expect(it.y).toBeCloseTo(cat.mountHeight!, 5);
        } else {
          expect(it.x).toBeCloseTo(p.x, 5);
          expect(it.z).toBeCloseTo(p.z, 5);
        }
        if (cat.mount === "ceiling") expect(it.y + cat.size.h).toBeCloseTo(spec.ceiling, 5);
      });
    }
  });

  it("keep the inner room size", () => {
    expect(showroomSize(getPlanSpec("bedroom-calm")!)).toEqual({ w: 4, d: 3.5 });
  });
});
