import { getCatalogItem } from "@/features/designer/data/catalog";
import type { DItem, PlanSpec } from "@/features/designer/types";
import { cachedPlan, wallGeom } from "./geometry";
import { alongFace, placeFlat, placeOnFace, wallFaces } from "./placement";

/** A showroom's furniture as designer items; empty for plans that are not showrooms. */
export function presetItems(spec: PlanSpec, ceiling = spec.ceiling): DItem[] {
  if (!spec.showroom) return [];
  const plan = cachedPlan(spec);
  const faces = wallFaces(plan);
  const items: DItem[] = [];
  spec.showroom.items.forEach((p, i) => {
    const cat = getCatalogItem(p.itemId);
    if (!cat) return;
    const base: DItem = { uid: `${spec.id}-${i + 1}`, itemId: p.itemId, colorId: p.colorId ?? cat.colors[0]?.id ?? "", x: p.x, y: 0, z: p.z, rot: p.rot };
    const ctx = { plan, ceiling, items };
    if (cat.mount === "wall") {
      // Snap to the wall face nearest the given point.
      const face = faces
        .map((f) => {
          const g = wallGeom(f.wall);
          const dist = Math.abs((p.x - f.wall.a[0]) * g.normal[0] + (p.z - f.wall.a[1]) * g.normal[1]);
          return { f, dist };
        })
        .sort((a, b) => a.dist - b.dist)[0]?.f;
      if (face) items.push(placeOnFace(ctx, base, cat, face, alongFace(face, p.x, p.z), cat.mountHeight ?? 1.3));
      return;
    }
    items.push(placeFlat(ctx, base, cat, p.x, p.z, p.rot, new Set([base.uid])));
  });
  return items;
}
