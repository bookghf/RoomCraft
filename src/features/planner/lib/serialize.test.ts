import { describe, expect, it } from "vitest";
import { presetDesigns } from "@/data/rooms";
import { decodeDesign, encodeDesign, parseDesign } from "./serialize";

const design = presetDesigns[0];

describe("serialize", () => {
  it("roundtrips through the share encoding", () => {
    const encoded = encodeDesign(design);
    expect(encoded).toMatch(/^[A-Za-z0-9+\-$_]+$/); // URL-safe
    expect(decodeDesign(encoded)).toEqual(design);
  });

  it("rejects garbage", () => {
    expect(decodeDesign("not-a-design")).toBeNull();
    expect(decodeDesign("")).toBeNull();
  });

  it("rejects malformed designs", () => {
    expect(parseDesign({ ...design, wallColor: "red" })).toBeNull();
    expect(parseDesign({ ...design, floorMaterial: "marble" })).toBeNull();
    expect(parseDesign({ ...design, items: [{ uid: "x", productId: "y", position: [0, 0], rotationY: 0 }] })).toBeNull();
    expect(parseDesign({ ...design, id: undefined })).toBeNull();
  });

  it("accepts every preset design", () => {
    for (const d of presetDesigns) expect(parseDesign(d)).not.toBeNull();
  });
});
