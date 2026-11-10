import { describe, expect, it } from "vitest";
import { emptyPlanSpec, planSpecs } from "@/features/designer/data/plans";
import type { DItem, OpeningSpecType } from "@/features/designer/types";
import { checkItems } from "./collision";
import { doorSwings, parseOpeningType, resolvePlan, zoneRuns } from "./geometry";

// 4 x 4 m room with a door at x 2.8–3.7 on the back wall (z = 4).
const room = resolvePlan(emptyPlanSpec(4, 4));
const withDoor = (type: OpeningSpecType) => {
  const spec = emptyPlanSpec(4, 4);
  return resolvePlan({ ...spec, openings: spec.openings.map((o) => (o.type === "door" ? { ...o, type } : o)) });
};
const plantAt = (x: number, z: number): DItem => ({ uid: "a", itemId: "plant", colorId: "", x, y: 0, z, rot: 0 });

describe("door swings", () => {
  it("swing into the room by default", () => {
    const [sw] = doorSwings(room);
    expect(sw.open[1]).toBeCloseTo(-1);
    expect(sw.radius).toBeCloseTo(0.9);
  });

  it("read the swing from the door type", () => {
    expect(parseOpeningType("door:out:right")).toEqual({ type: "door", swing: { dir: "out", hinge: "right" } });
    expect(parseOpeningType("door")).toEqual({ type: "door" });
    expect(parseOpeningType("slider")).toEqual({ type: "slider" });
  });

  it("hinge on the left or right as seen from the room, opening in or out", () => {
    // Facing the back wall from inside the room, left is +x, so a left hinge sits at x 3.7.
    const inLeft = doorSwings(withDoor("door:in:left"))[0];
    expect(inLeft.hinge[0]).toBeCloseTo(3.7);
    expect(inLeft.open[1]).toBeCloseTo(-1);
    const outRight = doorSwings(withDoor("door:out:right"))[0];
    expect(outRight.hinge[0]).toBeCloseTo(2.8);
    expect(outRight.open[1]).toBeCloseTo(1);
  });

  it("keep furniture out of the swing", () => {
    const it = plantAt(3.25, 3.65);
    const r = checkItems({ plan: room, ceiling: 2.6, items: [it] }, [it]);
    expect(r.valid).toBe(false);
    expect(r.blockers.some((b) => b.startsWith("door:"))).toBe(true);
  });

  it("free the room side when the door opens out", () => {
    const plan = withDoor("door:out:left");
    const it = plantAt(3.25, 3.65);
    expect(checkItems({ plan, ceiling: 2.6, items: [it] }, [it]).valid).toBe(true);
  });
});

describe("doorways", () => {
  it("block furniture placed across a door", () => {
    // A plant centred on the door gap (x 2.8–3.7, z = 4) sits in the doorway.
    const it = plantAt(3.25, 4);
    const r = checkItems({ plan: room, ceiling: 2.6, items: [it] }, [it]);
    expect(r.valid).toBe(false);
    expect(r.blockers.some((b) => b.startsWith("opening:"))).toBe(true);
  });

  it("block furniture straddling a slider between two rooms", () => {
    const plan = resolvePlan(planSpecs.find((p) => p.id === "1br-30")!);
    // The slider at x 0.5–2.5 on z = 4 joins the room and the balcony.
    const it = plantAt(1.5, 4);
    const r = checkItems({ plan, ceiling: 2.6, items: [it] }, [it]);
    expect(r.valid).toBe(false);
    expect(r.blockers.some((b) => b.startsWith("opening:"))).toBe(true);
  });

  it("allow furniture beside a door", () => {
    const it = plantAt(2.4, 3.65);
    expect(checkItems({ plan: room, ceiling: 2.6, items: [it] }, [it]).valid).toBe(true);
  });
});

describe("room size lines", () => {
  it("give a focused room one line per side, pointing out of the room", () => {
    const plan = resolvePlan(planSpecs.find((p) => p.id === "1br-30")!);
    const runs = zoneRuns(plan.zones.find((z) => z.id === "bedroom")!); // x 3–6, z 0–4
    expect(runs).toHaveLength(4);
    const lens = runs.map((r) => Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1])).sort();
    expect(lens).toEqual([3, 3, 4, 4]);
    for (const r of runs) {
      const mid = [(r.a[0] + r.b[0]) / 2 + r.out[0], (r.a[1] + r.b[1]) / 2 + r.out[1]];
      expect(mid[0] < 3 || mid[0] > 6 || mid[1] < 0 || mid[1] > 4).toBe(true);
    }
  });
});
