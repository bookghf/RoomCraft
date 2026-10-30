import { cacheLife } from "next/cache";
import { installContent, type DesignerContent, type RoomTypeInfo } from "./content";
import type { CatalogItem, Category, PlanSpec, Text } from "./types";

/**
 * Server-side client for the public RoomCraft API (catalog, plans, room types).
 * Pages load here and hand the result to the browser, so the browser never calls the API
 * directly and CORS does not apply. Set API_URL (see .env.example).
 */

const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError(503, "API_UNREACHABLE", `Can't reach the RoomCraft API at ${API_URL}.`);
  }
  let json: Envelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status, "BAD_RESPONSE", `The API answered ${res.status} without JSON (${path}).`);
  }
  if (!json.success) {
    const e = json.error ?? { code: "UNKNOWN", message: "Request failed." };
    throw new ApiError(res.status, e.code, `${e.message} (${path})`);
  }
  return json.data as T;
}

/** GET /v1/plans: newest version of each plan, without geometry. */
interface PlanSummary {
  id: string;
  version: number;
  kind: "unit" | "showroom" | "empty";
}

/** GET /v1/plans/{id}: newest version with geometry. */
interface PlanDetail extends PlanSummary {
  spec: PlanSpec;
}

/**
 * Everything the designer and the showroom pages need. Cached for a few minutes; the API
 * itself caches the catalog and plans for five.
 */
export async function loadContent(): Promise<DesignerContent> {
  "use cache";
  cacheLife("minutes");
  const [catalog, plans, roomTypes] = await Promise.all([
    get<{ version: string; categories: { id: Category; name: Text }[]; items: CatalogItem[] }>("/v1/catalog"),
    get<PlanSummary[]>("/v1/plans"),
    get<RoomTypeInfo[]>("/v1/room-types"),
  ]);
  // The list has no geometry. The empty room is generated locally from its size.
  const specs = await Promise.all(plans.filter((p) => p.kind !== "empty").map((p) => get<PlanDetail>(`/v1/plans/${encodeURIComponent(p.id)}`).then((d) => d.spec)));
  return { catalogVersion: catalog.version, categories: catalog.categories, items: catalog.items, plans: specs, roomTypes };
}

/** Loads the content and installs it for server components that read the lookups in content.ts. */
export async function loadInstalledContent(): Promise<DesignerContent> {
  const content = await loadContent();
  installContent(content);
  return content;
}
