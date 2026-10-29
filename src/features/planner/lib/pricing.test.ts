import { describe, expect, it } from "vitest";
import { getProduct } from "@/data/products";
import type { PlacedItem } from "@/types/planner";
import { formatPrice, shoppingList } from "./pricing";

const item = (uid: string, productId: string, colorId?: string): PlacedItem => ({ uid, productId, colorId, position: [0, 0, 0], rotationY: 0 });

describe("shoppingList", () => {
  it("groups by product and colour", () => {
    const { lines, count, total } = shoppingList([
      item("a", "chair-sit", "birch"),
      item("b", "chair-sit", "birch"),
      item("c", "chair-sit", "walnut"),
      item("d", "sofa-vila-3"),
    ]);
    const chair = getProduct("chair-sit")!.price;
    const sofa = getProduct("sofa-vila-3")!.price;

    expect(lines).toHaveLength(3);
    const birch = lines.find((l) => l.product.id === "chair-sit" && l.colorId === "birch")!;
    expect(birch.quantity).toBe(2);
    expect(birch.uids).toEqual(["a", "b"]);
    expect(birch.lineTotal).toBe(2 * chair);
    expect(count).toBe(4);
    expect(total).toBe(3 * chair + sofa);
  });

  it("treats a missing colour as the product's default colour", () => {
    const { lines } = shoppingList([item("a", "chair-sit"), item("b", "chair-sit", "birch")]);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(2);
  });

  it("ignores unknown products", () => {
    expect(shoppingList([item("a", "nope")])).toEqual({ lines: [], count: 0, total: 0 });
  });
});

describe("formatPrice", () => {
  it("formats THB without decimals", () => {
    expect(formatPrice(48950)).toMatch(/48,950/);
    expect(formatPrice(48950)).toMatch(/฿/);
  });
});
