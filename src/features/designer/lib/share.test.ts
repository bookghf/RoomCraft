import { describe, expect, it } from "vitest";
import type { DesignDoc } from "@/features/designer/types";
import { decodeShare, encodeShare } from "./share";

const doc: DesignDoc = {
  id: "abc",
  planId: "bedroom-calm",
  name: "My room",
  items: [{ uid: "a", itemId: "bed-linna-double", colorId: "walnut", x: 2, y: 0, z: 1.5, rot: 1.5708 }],
  floor: { material: "wood", color: "#c9a77c" },
  wall: { material: "paint", color: "#ede8e0" },
  ceiling: 2.6,
  updatedAt: "2026-10-29T00:00:00.000Z",
};

describe("share links", () => {
  it("round-trip the design content without ids or timestamps", () => {
    const encoded = encodeShare(doc);
    expect(encoded).toMatch(/^[A-Za-z0-9+\-$]+$/);
    const { planId, name, items, floor, wall, ceiling } = doc;
    expect(decodeShare(encoded)).toEqual({ planId, name, items, floor, wall, ceiling });
  });

  it("reject garbage and malformed designs", () => {
    expect(decodeShare("not-a-design")).toBeNull();
    expect(decodeShare("")).toBeNull();
  });
});
