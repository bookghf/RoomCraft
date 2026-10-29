import type { Product, ProductCategory } from "@/types/planner";

const wood = [
  { id: "birch", label: "Birch", hex: "#d9c3a0" },
  { id: "walnut", label: "Walnut", hex: "#6b4a33" },
  { id: "white", label: "White", hex: "#f2f0ec" },
];
const fabric = [
  { id: "oat", label: "Oat", hex: "#d8cdb8" },
  { id: "sage", label: "Sage", hex: "#9aab92" },
  { id: "charcoal", label: "Charcoal", hex: "#4a4a4d" },
];
const metal = [
  { id: "black", label: "Black", hex: "#2b2b2b" },
  { id: "brass", label: "Brass", hex: "#b8954f" },
];

export const products: Product[] = [
  // Beds
  { id: "bed-linna-double", sku: "RC-1001", name: "Linna double bed", category: "beds", price: 12990, currency: "THB", shape: "bed", dimensions: { w: 1.6, d: 2.1, h: 1.0 }, mount: "floor", colors: wood },
  { id: "bed-solo-single", sku: "RC-1002", name: "Solo single bed", category: "beds", price: 6490, currency: "THB", shape: "bed", dimensions: { w: 0.95, d: 2.05, h: 0.9 }, mount: "floor", colors: wood },
  { id: "bed-haven-king", sku: "RC-1003", name: "Haven king bed", category: "beds", price: 18990, currency: "THB", shape: "bed", dimensions: { w: 1.9, d: 2.15, h: 1.1 }, mount: "floor", colors: fabric },
  // Storage
  { id: "wardrobe-fjell", sku: "RC-2001", name: "Fjell wardrobe", category: "storage", price: 9990, currency: "THB", shape: "wardrobe", dimensions: { w: 1.0, d: 0.58, h: 2.0 }, mount: "floor", colors: wood },
  { id: "dresser-rau", sku: "RC-2002", name: "Rau 6-drawer dresser", category: "storage", price: 5990, currency: "THB", shape: "dresser", dimensions: { w: 1.2, d: 0.48, h: 0.8 }, mount: "floor", colors: wood },
  { id: "nightstand-pip", sku: "RC-2003", name: "Pip nightstand", category: "storage", price: 1490, currency: "THB", shape: "nightstand", dimensions: { w: 0.45, d: 0.4, h: 0.55 }, mount: "floor", colors: wood },
  { id: "bookcase-stav", sku: "RC-2004", name: "Stav bookcase", category: "storage", price: 3290, currency: "THB", shape: "bookcase", dimensions: { w: 0.8, d: 0.3, h: 1.8 }, mount: "floor", colors: wood },
  { id: "shelf-lift", sku: "RC-2005", name: "Lift wall shelf", category: "storage", price: 690, currency: "THB", shape: "shelf", dimensions: { w: 0.8, d: 0.22, h: 0.04 }, mount: "wall", mountHeight: 1.4, colors: wood },
  // Lighting
  { id: "lamp-arc-floor", sku: "RC-3001", name: "Arc floor lamp", category: "lighting", price: 2490, currency: "THB", shape: "floor-lamp", dimensions: { w: 0.4, d: 0.4, h: 1.6 }, mount: "floor", colors: metal },
  { id: "lamp-dot-table", sku: "RC-3002", name: "Dot table lamp", category: "lighting", price: 790, currency: "THB", shape: "table-lamp", dimensions: { w: 0.25, d: 0.25, h: 0.45 }, mount: "floor", colors: metal },
  { id: "lamp-glow-pendant", sku: "RC-3003", name: "Glow pendant", category: "lighting", price: 1290, currency: "THB", shape: "pendant", dimensions: { w: 0.4, d: 0.4, h: 0.6 }, mount: "ceiling", colors: metal },
  // Textiles
  { id: "rug-tova", sku: "RC-4001", name: "Tova flatwoven rug", category: "textiles", price: 2990, currency: "THB", shape: "rug", dimensions: { w: 2.0, d: 1.4, h: 0.01 }, mount: "floor", colors: fabric },
  { id: "rug-mira-round", sku: "RC-4002", name: "Mira short-pile rug", category: "textiles", price: 1990, currency: "THB", shape: "rug", dimensions: { w: 1.6, d: 1.0, h: 0.01 }, mount: "floor", colors: fabric },
  // Decor
  { id: "plant-fiddle", sku: "RC-5001", name: "Fiddle plant in pot", category: "decor", price: 890, currency: "THB", shape: "plant", dimensions: { w: 0.4, d: 0.4, h: 1.2 }, mount: "floor", colors: [{ id: "terracotta", label: "Terracotta", hex: "#b7653f" }, { id: "white", label: "White", hex: "#eeeeee" }] },
  { id: "art-horizon", sku: "RC-5002", name: "Horizon framed print", category: "decor", price: 990, currency: "THB", shape: "wall-art", dimensions: { w: 0.7, d: 0.03, h: 0.5 }, mount: "wall", mountHeight: 1.3, colors: [{ id: "dusk", label: "Dusk", hex: "#c98b6b" }, { id: "sea", label: "Sea", hex: "#6b8fa8" }] },
  { id: "mirror-oval", sku: "RC-5003", name: "Oval wall mirror", category: "decor", price: 1590, currency: "THB", shape: "mirror", dimensions: { w: 0.5, d: 0.03, h: 0.9 }, mount: "wall", mountHeight: 1.0, colors: metal },
  // Tables
  { id: "table-ek-dining", sku: "RC-6001", name: "Ek dining table", category: "tables", price: 7990, currency: "THB", shape: "table", dimensions: { w: 1.6, d: 0.9, h: 0.75 }, mount: "floor", colors: wood },
  { id: "desk-plan", sku: "RC-6002", name: "Plan work desk", category: "tables", price: 3990, currency: "THB", shape: "desk", dimensions: { w: 1.2, d: 0.6, h: 0.74 }, mount: "floor", colors: wood },
  { id: "coffee-table-rund", sku: "RC-6003", name: "Rund coffee table", category: "tables", price: 2490, currency: "THB", shape: "coffee-table", dimensions: { w: 0.9, d: 0.6, h: 0.42 }, mount: "floor", colors: wood },
  // Chairs
  { id: "chair-sit", sku: "RC-7001", name: "Sit dining chair", category: "chairs", price: 1290, currency: "THB", shape: "chair", dimensions: { w: 0.45, d: 0.5, h: 0.85 }, mount: "floor", colors: wood },
  { id: "chair-mjuk-arm", sku: "RC-7002", name: "Mjuk armchair", category: "chairs", price: 4990, currency: "THB", shape: "armchair", dimensions: { w: 0.8, d: 0.8, h: 0.8 }, mount: "floor", colors: fabric },
  // Sofas
  { id: "sofa-vila-3", sku: "RC-8001", name: "Vila 3-seat sofa", category: "sofas", price: 15990, currency: "THB", shape: "sofa", dimensions: { w: 2.1, d: 0.9, h: 0.8 }, mount: "floor", colors: fabric },
  { id: "sofa-vila-2", sku: "RC-8002", name: "Vila 2-seat sofa", category: "sofas", price: 11990, currency: "THB", shape: "sofa", dimensions: { w: 1.6, d: 0.9, h: 0.8 }, mount: "floor", colors: fabric },
];

export const categories: { id: ProductCategory; label: string }[] = [
  { id: "beds", label: "Beds" },
  { id: "sofas", label: "Sofas" },
  { id: "storage", label: "Storage" },
  { id: "lighting", label: "Lighting" },
  { id: "textiles", label: "Textiles" },
  { id: "decor", label: "Decor" },
  { id: "tables", label: "Tables" },
  { id: "chairs", label: "Chairs" },
];

const byId = new Map(products.map((p) => [p.id, p]));

export function getProduct(id: string): Product | undefined {
  return byId.get(id);
}

export function filterProducts(opts: { category?: string | null; q?: string | null; maxPrice?: number | null }): Product[] {
  const q = opts.q?.trim().toLowerCase();
  return products.filter(
    (p) =>
      (!opts.category || p.category === opts.category) &&
      (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
      (opts.maxPrice == null || p.price <= opts.maxPrice),
  );
}
