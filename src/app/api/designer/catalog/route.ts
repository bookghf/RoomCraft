import { loadContent } from "@/features/designer/api";

/** The published catalog from the RoomCraft API, in its response shape. */
export async function GET() {
  const { catalogVersion, categories, items } = await loadContent();
  return Response.json({ success: true, data: { version: catalogVersion, categories, items } });
}
