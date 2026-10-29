import type { NextRequest } from "next/server";
import { designs } from "../store";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/designs/[id]">) {
  const { id } = await ctx.params;
  const design = designs.get(id);
  if (!design) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(design);
}
