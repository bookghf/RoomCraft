import { getProduct } from "@/data/products";
import type { PlacedItem, Product } from "@/types/planner";

export interface ListLine {
  product: Product;
  colorId?: string;
  quantity: number;
  uids: string[];
  lineTotal: number;
}

/** Group placed items by product + colour into shopping-list lines. */
export function shoppingList(items: PlacedItem[]): { lines: ListLine[]; count: number; total: number } {
  const map = new Map<string, ListLine>();
  for (const it of items) {
    const product = getProduct(it.productId);
    if (!product) continue;
    const colorId = it.colorId ?? product.colors[0]?.id;
    const key = `${product.id}:${colorId}`;
    const line = map.get(key) ?? { product, colorId, quantity: 0, uids: [], lineTotal: 0 };
    line.quantity += 1;
    line.uids.push(it.uid);
    line.lineTotal = line.quantity * product.price;
    map.set(key, line);
  }
  const lines = [...map.values()];
  return {
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    total: lines.reduce((n, l) => n + l.lineTotal, 0),
  };
}

const thb = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

export function formatPrice(value: number): string {
  return thb.format(value);
}
