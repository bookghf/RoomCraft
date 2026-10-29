import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { z } from "zod";
import type { Design } from "@/types/planner";

const vec3 = z.tuple([z.number(), z.number(), z.number()]);

export const designSchema = z.object({
  id: z.string().min(1),
  roomId: z.string().min(1),
  items: z.array(
    z.object({
      uid: z.string().min(1),
      productId: z.string().min(1),
      colorId: z.string().optional(),
      position: vec3,
      rotationY: z.number(),
    }),
  ),
  wallColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  floorMaterial: z.enum(["oak", "walnut", "tile-grey", "carpet-beige"]),
  updatedAt: z.string(),
});

export function parseDesign(input: unknown): Design | null {
  const r = designSchema.safeParse(input);
  return r.success ? r.data : null;
}

/** Encode a design for the `?s=` share param (no backend needed). */
export function encodeDesign(design: Design): string {
  return compressToEncodedURIComponent(JSON.stringify(design));
}

export function decodeDesign(encoded: string): Design | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    return json ? parseDesign(JSON.parse(json)) : null;
  } catch {
    return null;
  }
}

const key = {
  last: (roomId: string) => `roomcraft:design:${roomId}`,
  saved: (designId: string) => `roomcraft:saved:${designId}`,
};

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function read(k: string): Design | null {
  try {
    const raw = storage()?.getItem(k);
    return raw ? parseDesign(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function write(k: string, d: Design) {
  try {
    storage()?.setItem(k, JSON.stringify(d));
  } catch {
    /* storage full or blocked: ignore in demo */
  }
}

export const designStorage = {
  loadLast: (roomId: string) => read(key.last(roomId)),
  saveLast: (d: Design) => write(key.last(d.roomId), d),
  loadSaved: (designId: string) => read(key.saved(designId)),
  saveSaved: (d: Design) => write(key.saved(d.id), d),
};
