import { designSchema } from "@/features/planner/lib/serialize";
import { designs } from "./store";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = designSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid design", issues: parsed.error.issues }, { status: 400 });
  }
  designs.set(parsed.data.id, parsed.data);
  return Response.json({ id: parsed.data.id }, { status: 201 });
}
