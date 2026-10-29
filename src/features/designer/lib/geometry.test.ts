import { describe, expect, it } from "vitest";
import { emptyPlanSpec, planSpecs } from "@/features/designer/data/plans";
import { outlineRuns, resolvePlan, wallGeom, zoneAt } from "./geometry";

describe("resolvePlan", () => {
  it("builds four walls with a door and a window for the empty room", () => {
    const plan = resolvePlan(emptyPlanSpec(4, 4));
    expect(plan.walls).toHaveLength(4);
    expect(plan.walls.every((w) => w.exterior && w.kind === "solid")).toBe(true);
    const openings = plan.walls.flatMap((w) => w.openings.map((o) => o.type));
    expect(openings.sort()).toEqual(["door", "window"]);
    expect(plan.outline).toHaveLength(4);
  });

  it("assigns every opening of every plan to a wall", () => {
    for (const spec of planSpecs) {
      const plan = resolvePlan(spec);
      const count = plan.walls.reduce((n, w) => n + w.openings.length, 0);
      expect(count, spec.id).toBe(spec.openings.length);
      for (const w of plan.walls) {
        const len = wallGeom(w).length;
        for (const o of w.openings) {
          expect(o.offset).toBeGreaterThanOrEqual(0);
          expect(o.offset + o.width).toBeLessThanOrEqual(len + 1e-9);
        }
      }
    }
  });

  it("drops open-plan edges and turns balcony edges into railings", () => {
    const plan = resolvePlan(planSpecs.find((p) => p.id === "1br-30")!);
    const kitchenLiving = plan.walls.find((w) => w.sides.includes("kitchen") && w.sides.includes("living"));
    expect(kitchenLiving).toBeUndefined();
    const railings = plan.walls.filter((w) => w.kind === "railing");
    expect(railings.length).toBe(3);
    expect(railings.every((w) => w.sides.includes("balcony") && w.exterior)).toBe(true);
    const sliderWall = plan.walls.find((w) => w.sides.includes("balcony") && w.sides.includes("living"));
    expect(sliderWall?.kind).toBe("solid");
    expect(sliderWall?.openings[0]?.type).toBe("slider");
  });

  it("finds the zone under a point, including L-shaped zones", () => {
    const plan = resolvePlan(planSpecs.find((p) => p.id === "2br-65")!);
    expect(zoneAt(plan.zones, 4, 3)?.id).toBe("living");
    expect(zoneAt(plan.zones, 4, 5.5)?.id).toBe("bath");
    expect(zoneAt(plan.zones, 8, 7)?.id).toBe("balcony");
    expect(zoneAt(plan.zones, 1, 7)).toBeUndefined();
  });

  it("merges collinear exterior walls into single outline runs", () => {
    const plan = resolvePlan(planSpecs.find((p) => p.id === "1br-30")!);
    const runs = outlineRuns(plan.walls);
    // x = 0 runs the whole depth (bath, living, balcony)
    const left = runs.find((r) => r.a[0] === 0 && r.b[0] === 0);
    expect(left).toMatchObject({ a: [0, 0], b: [0, 5], out: [-1, 0] });
  });
});
