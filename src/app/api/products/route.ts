import type { NextRequest } from "next/server";
import { filterProducts } from "@/data/products";

export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const maxPrice = params.get("maxPrice");
  const products = filterProducts({
    category: params.get("category"),
    q: params.get("q"),
    maxPrice: maxPrice && !Number.isNaN(Number(maxPrice)) ? Number(maxPrice) : null,
  });
  return Response.json({ products });
}
