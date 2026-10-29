import type { NextRequest } from "next/server";
import { catalog } from "@/features/designer/data/catalog";

/** Catalog items filtered by category, search text (any language, id or SKU) and maximum price in THB. */
export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const category = params.get("category");
  const q = params.get("q")?.trim().toLowerCase();
  const maxPrice = Number(params.get("maxPrice"));
  const products = catalog.filter(
    (c) =>
      !c.hidden &&
      (!category || c.category === category) &&
      (!q || c.id.includes(q) || !!c.sku?.toLowerCase().includes(q) || Object.values(c.name).some((n) => n.toLowerCase().includes(q))) &&
      (!params.get("maxPrice") || Number.isNaN(maxPrice) || c.price <= maxPrice),
  );
  return Response.json({ products });
}
