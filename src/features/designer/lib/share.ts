import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { DesignDoc } from "@/features/designer/types";
import { docSchema } from "./storage";

/** Design content carried in a share link (`?s=`); ids and timestamps are made fresh on open. */
export type SharedDesign = Omit<DesignDoc, "id" | "updatedAt">;

const sharedSchema = docSchema.omit({ id: true, updatedAt: true });

/** Compress a design into a URL-safe string, so links work without a backend. */
export function encodeShare(doc: DesignDoc): string {
  const { planId, name, items, floor, wall, ceiling, size } = doc;
  return compressToEncodedURIComponent(JSON.stringify({ planId, name, items, floor, wall, ceiling, size }));
}

export function decodeShare(encoded: string): SharedDesign | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const r = sharedSchema.safeParse(JSON.parse(json));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}
