import { catalogResponse } from "@/features/designer/data/catalog";

/** Designer catalog in the shape the future catalog API will serve. */
export function GET() {
  return Response.json(catalogResponse());
}
