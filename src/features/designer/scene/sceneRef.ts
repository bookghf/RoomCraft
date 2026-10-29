import type { Camera, Scene, WebGLRenderer } from "three";
import type { OrbitControls } from "three-stdlib";
import { pointInPolygon } from "@/features/designer/lib/geometry";
import type { Plan, PlanWall } from "@/features/designer/types";

/** The live renderer, scene, camera and controls, for code outside the Canvas (drop, nudge, share). */
export const sceneRef: { gl: WebGLRenderer | null; scene: Scene | null; camera: Camera | null; controls: OrbitControls | null } = {
  gl: null,
  scene: null,
  camera: null,
  controls: null,
};

/** Overlays (size lines, guides, outlines) live on layer 1 so a clean picture can leave them out. */
export const OVERLAY_LAYER = 1;

/** Zone shown alone by "Only this room", or null when every room shows. */
export function isolatedZone(s: { onlyThisRoom: boolean; focusZone: string | null }) {
  return s.onlyThisRoom ? s.focusZone : null;
}

export function zoneVisible(plan: Plan, zoneId: string | null, x: number, z: number): boolean {
  if (!zoneId) return true;
  const zn = plan.zones.find((q) => q.id === zoneId);
  return !zn || pointInPolygon(x, z, zn.polygon);
}

export function wallVisible(w: PlanWall, zoneId: string | null): boolean {
  return !zoneId || w.sides.includes(zoneId);
}

/**
 * Fold a wall when it is between the camera and the room: an outside wall whose outer face
 * looks towards the camera, or an inner wall crossed by the camera→target line (seen from above).
 */
export function wallBlocksView(w: PlanWall, cam: { x: number; z: number }, target: { x: number; z: number }): boolean {
  const [ax, az] = w.a;
  const [bx, bz] = w.b;
  if (w.exterior) {
    const len = Math.hypot(bx - ax, bz - az);
    const nx = -(bz - az) / len;
    const nz = (bx - ax) / len;
    const out = w.sides[0] === null ? 1 : -1;
    const vx = cam.x - target.x;
    const vz = cam.z - target.z;
    const vl = Math.hypot(vx, vz) || 1;
    const outside = ((cam.x - ax) * nx + (cam.z - az) * nz) * out > 0;
    return outside && ((vx * nx + vz * nz) * out) / vl > 0.3;
  }
  // Inner walls fold when they cut the sight line to the target, or to points a little either side of it,
  // so a wall clipping the edge of a focused item folds too.
  const vx = target.x - cam.x;
  const vz = target.z - cam.z;
  const vl = Math.hypot(vx, vz) || 1;
  const px = (-vz / vl) * SIGHT_SPREAD;
  const pz = (vx / vl) * SIGHT_SPREAD;
  return [0, 1, -1].some((k) => crosses(cam.x, cam.z, target.x + px * k, target.z + pz * k, ax, az, bx, bz));
}

const SIGHT_SPREAD = 0.6;

function crosses(cx: number, cz: number, tx: number, tz: number, ax: number, az: number, bx: number, bz: number) {
  const d1x = tx - cx;
  const d1z = tz - cz;
  const d2x = bx - ax;
  const d2z = bz - az;
  const den = d1x * d2z - d1z * d2x;
  if (Math.abs(den) < 1e-9) return false;
  const sx = ax - cx;
  const sz = az - cz;
  const t = (sx * d2z - sz * d2x) / den;
  const u = (sx * d1z - sz * d1x) / den;
  return t > 0 && t < 1 && u > -0.02 && u < 1.02;
}
