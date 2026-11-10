import { describe, expect, it } from "vitest";
import { emptyPlanSpec } from "@/features/designer/data/plans";
import type { DItem } from "@/features/designer/types";
import { checkItems } from "./collision";
import { doorSwings, resolvePlan } from "./geometry";

// 4 x 4 m room: window centred on the front wall (z = 0), door at x 2.8–3.7 on the back wall (z = 4).
const room = resolvePlan(emptyPlanSpec(4, 4));
const item = (uid: string, itemId: string, x: number, z: number, rot = 0): DItem => ({ uid, itemId, colorId: "", x, y: 0, z, rot });
const check = (it: DItem, plan = room) => checkItems({ plan, ceiling: 2.6, items: [it] }, [it]);

describe("opening clearances", () => {
  it("swings doors into the room", () => {
    const [sw] = doorSwings(room);
    expect(sw.open[1]).toBeCloseTo(-1);
    expect(sw.radius).toBeCloseTo(0.9);
  });

  it("keeps furniture out of a door's swing", () => {
    const r = check(item("a", "sofa", 3.2, 3.4));
    expect(r.valid).toBe(false);
    expect(r.blockers.some((b) => b.startsWith("door:"))).toBe(true);
  });

  it("allows furniture just outside the swing", () => {
    expect(check(item("a", "sofa", 1.2, 3.4)).valid).toBe(true);
  });

  it("lets low furniture stand under a window but not tall furniture", () => {
    expect(check(item("a", "desk", 2, 0.4)).valid).toBe(true);
    const r = check(item("a", "wardrobe-fjell", 2, 0.36));
    expect(r.valid).toBe(false);
    expect(r.blockers.some((b) => b.startsWith("window:"))).toBe(true);
  });

  it("keeps a walkway in front of a sliding door", () => {
    const spec = { ...emptyPlanSpec(4, 4), openings: [{ type: "slider" as const, at: [2, 0] as [number, number], width: 1.8 }] };
    const plan = resolvePlan(spec);
    const r = check(item("a", "sofa", 2, 0.6), plan);
    expect(r.valid).toBe(false);
    expect(r.blockers.some((b) => b.startsWith("slider:"))).toBe(true);
    expect(check(item("a", "sofa", 2, 1.3), plan).valid).toBe(true);
  });
});
