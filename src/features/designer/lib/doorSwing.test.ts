import { describe, expect, it } from "vitest";
import { emptyPlanSpec } from "@/features/designer/data/plans";
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
