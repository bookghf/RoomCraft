import { Plane, Ray, Vector3 } from "three";
import { wallInfo } from "@/features/planner/lib/placement";
import type { Product, Room, Vec3 } from "@/types/planner";

/** Mutable, non-reactive drag bookkeeping shared by FurnitureItem (start) and DragController (move/end). */
export interface DragSession {
  uid: string;
  pointerId: number;
  /** item position minus the pointer's first hit on the drag surface */
  offset: Vec3;
  startWallId?: string;
  startPosition: Vec3;
  rotationY: number;
  downX: number;
  downY: number;
  started: boolean;
}

export const dragSession: { current: DragSession | null } = { current: null };

const plane = new Plane();
const hit = new Vector3();
const normal = new Vector3();
const origin = new Vector3();

/**
 * Intersect a pointer ray with the surface an item moves on:
 * - floor items: the floor plane y=0
 * - ceiling items: a horizontal plane at the item's current height
 * - wall items: the nearest wall plane whose interior faces the ray
 */
export function intersectDragSurface(ray: Ray, room: Room, product: Product, itemY: number): { point: Vec3; wallId?: string } | null {
  if (product.mount !== "wall") {
    const y = product.mount === "ceiling" ? itemY : 0;
    plane.set(normal.set(0, 1, 0), -y);
    return ray.intersectPlane(plane, hit) ? { point: [hit.x, y, hit.z] } : null;
  }

  let best: { point: Vec3; wallId: string; dist: number } | null = null;
  for (const w of room.walls) {
    const info = wallInfo(w);
    normal.set(info.normal[0], 0, info.normal[1]);
    if (ray.direction.dot(normal) >= 0) continue; // seen from behind
    plane.setFromNormalAndCoplanarPoint(normal, origin.set(info.a[0], 0, info.a[1]));
    if (!ray.intersectPlane(plane, hit)) continue;
    const along = (hit.x - info.a[0]) * info.dir[0] + (hit.z - info.a[1]) * info.dir[1];
    if (along < -0.3 || along > info.length + 0.3 || hit.y < -0.2 || hit.y > w.height + 0.3) continue;
    const dist = ray.origin.distanceTo(hit);
    if (!best || dist < best.dist) best = { point: [hit.x, hit.y, hit.z], wallId: w.id, dist };
  }
  return best && { point: best.point, wallId: best.wallId };
}
