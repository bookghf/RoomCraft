import { describe, expect, it } from "vitest";
import { emptyPlanSpec, planSpecs } from "@/features/designer/data/plans";
import type { DItem } from "@/features/designer/types";
import { checkItems } from "./collision";
import { doorSwings, resolvePlan } from "./geometry";

// 4 x 4 m room with a door at x 2.8–3.7 on the back wall (z = 4).
const room = resolvePlan(emptyPlanSpec(4, 4));

describe("door swings", () => {
  it("swing into the room", () => {
    const [sw] = doorSwings(room);
    expect(sw.open[1]).toBeCloseTo(-1);
    expect(sw.radius).toBeCloseTo(0.9);
  });

  it("do not block furniture", () => {
    const sofa: DItem = { uid: "a", itemId: "sofa", colorId: "", x: 2.9, y: 0, z: 3.4, rot: 0 };
    expect(checkItems({ plan: room, ceiling: 2.6, items: [sofa] }, [sofa]).valid).toBe(true);
  });
});

describe("doorways", () => {
  it("block furniture placed across a door", () => {
    // Door gap spans x 2.8–3.7 on the back wall (z = 4); a plant centred on it sits in the doorway.
    const plant: DItem = { uid: "a", itemId: "plant", colorId: "", x: 3.25, y: 0, z: 4, rot: 0 };
    const r = checkItems({ plan: room, ceiling: 2.6, items: [plant] }, [plant]);
    expect(r.valid).toBe(false);
    expect(r.blockers.some((b) => b.startsWith("opening:"))).toBe(true);
  });

  it("block furniture straddling a slider between two rooms", () => {
    const plan = resolvePlan(planSpecs.find((p) => p.id === "1br-30")!);
    // The slider at x 0.5–2.5 on z = 4 joins the room and the balcony.
    const plant: DItem = { uid: "a", itemId: "plant", colorId: "", x: 1.5, y: 0, z: 4, rot: 0 };
    const r = checkItems({ plan, ceiling: 2.6, items: [plant] }, [plant]);
    expect(r.valid).toBe(false);
    expect(r.blockers.some((b) => b.startsWith("opening:"))).toBe(true);
  });

  it("allow furniture beside a door", () => {
    const plant: DItem = { uid: "a", itemId: "plant", colorId: "", x: 3.25, y: 0, z: 3.65, rot: 0 };
    expect(checkItems({ plan: room, ceiling: 2.6, items: [plant] }, [plant]).valid).toBe(true);
  });
});
