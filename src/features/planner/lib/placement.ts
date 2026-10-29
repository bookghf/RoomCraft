import type { PlacedItem, Product, Room, Vec3, Wall } from "@/types/planner";

/**
 * Coordinate conventions
 * - Floor is the XZ plane at y=0, metres. Y up.
 * - Wall `start -> end` runs clockwise; the interior normal is (-dir.z, dir.x).
 *   The wall's interior surface lies exactly on the start-end line (thickness goes outward).
 * - Product local front faces +Z. Rotating by θ around Y gives front = (sin θ, cos θ).
 * - Floor item `position` is the bottom-centre of its footprint.
 * - Wall item `position` is bottom-centre, offset d/2 from the wall surface into the room.
 */

export const WALL_SNAP_DIST = 0.1;
const EPS = 1e-3;

export interface Rect2 {
  cx: number;
  cz: number;
  hw: number; // half-width along local x
  hd: number; // half-depth along local z
  rot: number;
}

export interface WallInfo {
  wall: Wall;
  a: [number, number];
  b: [number, number];
  dir: [number, number]; // unit
  normal: [number, number]; // unit, into the room
  length: number;
}

export function wallInfo(wall: Wall): WallInfo {
  const dx = wall.end[0] - wall.start[0];
  const dz = wall.end[1] - wall.start[1];
  const length = Math.hypot(dx, dz);
  const dir: [number, number] = [dx / length, dz / length];
  return { wall, a: wall.start, b: wall.end, dir, normal: [-dir[1], dir[0]], length };
}

/** rotationY that makes an item's front face along `normal`. */
export function rotationForNormal(normal: [number, number]): number {
  return Math.atan2(normal[0], normal[1]);
}

export function snapAngle(rot: number, step = Math.PI / 2): number {
  return Math.round(rot / step) * step;
}

export function normalizeAngle(rot: number): number {
  const t = Math.PI * 2;
  let r = rot % t;
  if (r > Math.PI) r -= t;
  if (r <= -Math.PI) r += t;
  return r;
}

export function roomBounds(room: Room) {
  const xs = room.floor.polygon.map((p) => p[0]);
  const zs = room.floor.polygon.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}

export function roomCenter(room: Room): Vec3 {
  const b = roomBounds(room);
  return [(b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2];
}

export function wallHeight(room: Room): number {
  return Math.min(...room.walls.map((w) => w.height));
}

/** Axis-aligned half extents of a rotated footprint. */
export function footprintExtents(product: Product, rotationY: number): { hx: number; hz: number } {
  const c = Math.abs(Math.cos(rotationY));
  const s = Math.abs(Math.sin(rotationY));
  const hw = product.dimensions.w / 2;
  const hd = product.dimensions.d / 2;
  return { hx: hw * c + hd * s, hz: hw * s + hd * c };
}

export function itemRect(product: Product, x: number, z: number, rotationY: number): Rect2 {
  return { cx: x, cz: z, hw: product.dimensions.w / 2, hd: product.dimensions.d / 2, rot: rotationY };
}

function rectAxes(r: Rect2): [number, number][] {
  const c = Math.cos(r.rot);
  const s = Math.sin(r.rot);
  // local x axis and local z axis in world XZ (rotation about +Y)
  return [
    [c, -s],
    [s, c],
  ];
}

function project(r: Rect2, axis: [number, number]): [number, number] {
  const [ax, az] = rectAxes(r);
  const center = r.cx * axis[0] + r.cz * axis[1];
  const radius = r.hw * Math.abs(ax[0] * axis[0] + ax[1] * axis[1]) + r.hd * Math.abs(az[0] * axis[0] + az[1] * axis[1]);
  return [center - radius, center + radius];
}

/** Separating-axis test for two oriented rectangles. Touching edges do not count as overlap. */
export function rectsOverlap(a: Rect2, b: Rect2): boolean {
  for (const axis of [...rectAxes(a), ...rectAxes(b)]) {
    const [amin, amax] = project(a, axis);
    const [bmin, bmax] = project(b, axis);
    if (amax <= bmin + EPS || bmax <= amin + EPS) return false;
  }
  return true;
}

/** Flat items (rugs) and ceiling items never collide with floor furniture. */
export function collides(product: Product): boolean {
  return product.mount === "floor" && product.dimensions.h > 0.05;
}

export interface Neighbour {
  item: PlacedItem;
  product: Product;
}

export interface PlacementResult {
  position: Vec3;
  rotationY: number;
  valid: boolean;
  wallId?: string;
}

/**
 * Place a floor item near (x, z):
 * clamp inside the room, snap its back flush to a wall within WALL_SNAP_DIST
 * (aligning rotation to face into the room), optional grid snap, then collision test.
 */
export function placeFloorItem(
  room: Room,
  product: Product,
  desired: { x: number; z: number },
  rotationY: number,
  others: Neighbour[],
  opts: { grid?: number; wallSnap?: boolean } = {},
): PlacementResult {
  let rot = rotationY;
  let { x, z } = desired;
  let wallId: string | undefined;

  if (opts.grid) {
    x = Math.round(x / opts.grid) * opts.grid;
    z = Math.round(z / opts.grid) * opts.grid;
  }

  ({ x, z } = clampToRoom(room, product, x, z, rot));

  if (opts.wallSnap !== false) {
    const halfD = product.dimensions.d / 2;
    let best: { dist: number; info: WallInfo } | null = null;
    for (const w of room.walls) {
      const info = wallInfo(w);
      const along = (x - info.a[0]) * info.dir[0] + (z - info.a[1]) * info.dir[1];
      if (along < 0 || along > info.length) continue;
      const dist = (x - info.a[0]) * info.normal[0] + (z - info.a[1]) * info.normal[1];
      // distance from the item's back edge, assuming it faces the wall normal
      const gap = dist - halfD;
      if (gap < WALL_SNAP_DIST && (!best || gap < best.dist)) best = { dist: gap, info };
    }
    if (best) {
      rot = rotationForNormal(best.info.normal);
      x += best.info.normal[0] * -best.dist;
      z += best.info.normal[1] * -best.dist;
      wallId = best.info.wall.id;
      ({ x, z } = clampToRoom(room, product, x, z, rot));
    }
  }

  const valid = !collides(product) || !others.some((o) => collides(o.product) && rectsOverlap(itemRect(product, x, z, rot), itemRect(o.product, o.item.position[0], o.item.position[2], o.item.rotationY)));

  return { position: [x, 0, z], rotationY: rot, valid, wallId };
}

export function clampToRoom(room: Room, product: Product, x: number, z: number, rotationY: number) {
  const b = roomBounds(room);
  const { hx, hz } = footprintExtents(product, rotationY);
  return {
    x: clamp(x, b.minX + hx, b.maxX - hx),
    z: clamp(z, b.minZ + hz, b.maxZ - hz),
  };
}

/**
 * Place a wall-mounted item on the nearest wall to (x, y, z).
 * The item stays fully on the wall surface and avoids openings' horizontal span
 * only for validity (it is flagged invalid when overlapping a door or window).
 */
export function placeWallItem(room: Room, product: Product, point: Vec3, preferWallId?: string): PlacementResult {
  const [px, py, pz] = point;
  let best: { d: number; info: WallInfo; along: number } | null = null;
  for (const w of room.walls) {
    const info = wallInfo(w);
    const along = clamp((px - info.a[0]) * info.dir[0] + (pz - info.a[1]) * info.dir[1], 0, info.length);
    const qx = info.a[0] + info.dir[0] * along;
    const qz = info.a[1] + info.dir[1] * along;
    let d = Math.hypot(px - qx, pz - qz);
    if (w.id === preferWallId) d -= 0.05;
    if (!best || d < best.d) best = { d, info, along };
  }
  if (!best) return { position: point, rotationY: 0, valid: false };

  const { info } = best;
  const hw = product.dimensions.w / 2;
  const along = clamp(best.along, hw, info.length - hw);
  const y = clamp(py, 0.05, info.wall.height - product.dimensions.h - 0.05);
  const off = product.dimensions.d / 2;
  const x = info.a[0] + info.dir[0] * along + info.normal[0] * off;
  const z = info.a[1] + info.dir[1] * along + info.normal[1] * off;

  const valid = !(info.wall.openings ?? []).some((o) => {
    const bottom = o.type === "door" ? 0 : (o.sill ?? 0);
    const horiz = along + hw > o.offset && along - hw < o.offset + o.width;
    const vert = y + product.dimensions.h > bottom && y < bottom + o.height;
    return horiz && vert;
  });

  return { position: [x, y, z], rotationY: rotationForNormal(info.normal), valid, wallId: info.wall.id };
}

/** Ceiling items hang so their top touches the ceiling. */
export function placeCeilingItem(room: Room, product: Product, desired: { x: number; z: number }, rotationY: number): PlacementResult {
  const { x, z } = clampToRoom(room, product, desired.x, desired.z, rotationY);
  return { position: [x, wallHeight(room) - product.dimensions.h, z], rotationY, valid: true };
}

/** Dispatch on product.mount. `point` is the pointer hit (floor hit for floor/ceiling items). */
export function placeItem(
  room: Room,
  product: Product,
  point: Vec3,
  rotationY: number,
  others: Neighbour[],
  opts: { grid?: number; wallSnap?: boolean; preferWallId?: string } = {},
): PlacementResult {
  if (product.mount === "wall") return placeWallItem(room, product, point, opts.preferWallId);
  if (product.mount === "ceiling") return placeCeilingItem(room, product, { x: point[0], z: point[2] }, rotationY);
  return placeFloorItem(room, product, { x: point[0], z: point[2] }, rotationY, others, opts);
}

/**
 * Find a free spot for a new item, scanning outward from `near` (default: room centre).
 * Returns the first valid placement, or the clamped centre (flagged invalid) if none fits.
 */
export function findFreeSpot(room: Room, product: Product, others: Neighbour[], near?: Vec3): PlacementResult {
  const start = near ?? roomCenter(room);
  if (product.mount === "wall") {
    for (const w of room.walls) {
      const info = wallInfo(w);
      for (let t = 0.5; t < info.length; t += 0.25) {
        const p: Vec3 = [info.a[0] + info.dir[0] * t, product.mountHeight ?? 1.3, info.a[1] + info.dir[1] * t];
        const r = placeWallItem(room, product, p, w.id);
        if (r.valid && r.wallId === w.id) return r;
      }
    }
    return placeWallItem(room, product, [start[0], product.mountHeight ?? 1.3, start[2]]);
  }
  const step = 0.15;
  for (let ring = 0; ring < 30; ring++) {
    for (let i = -ring; i <= ring; i++) {
      for (let j = -ring; j <= ring; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
        const r = placeItem(room, product, [start[0] + i * step, 0, start[2] + j * step], 0, others, { wallSnap: false });
        if (r.valid) return r;
      }
    }
  }
  return placeItem(room, product, start, 0, others, { wallSnap: false });
}

function clamp(v: number, min: number, max: number) {
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, v));
}
