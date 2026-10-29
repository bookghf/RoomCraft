import { getCatalogItem } from "@/features/designer/data/catalog";
import type { CatalogItem, DItem, Plan, PlanWall, XZ } from "@/features/designer/types";
import { normalizeAngle } from "@/features/designer/lib/math";
import { boxAabb, boxCorners, checkItems, fixtureBox, itemBox, type Box, type CheckResult, type Ctx } from "./collision";
import { pointInPolygon, rotationForNormal, WALL_T, wallGeom, zoneCenter } from "./geometry";

export const SNAP_DIST = 0.06;

/** Rotate (x, z) about a pivot by `rot` (same sense as an item's rotationY). */
export function rotateAbout(x: number, z: number, pivot: XZ, rot: number): XZ {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const dx = x - pivot[0];
  const dz = z - pivot[1];
  return [pivot[0] + dx * c + dz * s, pivot[1] - dx * s + dz * c];
}

/** Move and turn a set of items rigidly (items standing on them must already be in the set). */
export function transformItems(items: DItem[], uids: Set<string>, dx: number, dz: number, dRot = 0, pivot: XZ = [0, 0]): DItem[] {
  return items
    .filter((it) => uids.has(it.uid))
    .map((it) => {
      const [rx, rz] = dRot ? rotateAbout(it.x, it.z, pivot, dRot) : [it.x, it.z];
      return { ...it, x: rx + dx, z: rz + dz, rot: normalizeAngle(it.rot + dRot) };
    });
}

/** Replace items by uid. */
export function mergeItems(items: DItem[], changed: DItem[]): DItem[] {
  const m = new Map(changed.map((c) => [c.uid, c]));
  return items.map((it) => m.get(it.uid) ?? it);
}

/** Top surface a stackable item would stand on at (x, z, rot), if its whole footprint fits on one. */
export function surfaceUnder(ctx: Ctx, cat: CatalogItem, x: number, z: number, rot: number, exclude: Set<string>): DItem | undefined {
  if (!cat.stackable) return undefined;
  const mine: Box = { cx: x, cz: z, hw: cat.size.w / 2, hd: cat.size.d / 2, rot, y0: 0, y1: cat.size.h };
  const corners = boxCorners(mine);
  let best: { it: DItem; top: number } | undefined;
  for (const it of ctx.items) {
    if (exclude.has(it.uid)) continue;
    const sc = getCatalogItem(it.itemId);
    if (!sc?.surface || sc.mount !== "floor") continue;
    const sb = itemBox(it, sc);
    const fits = corners.every(([px, pz]) => {
      // point in oriented rect
      const dx = px - sb.cx;
      const dz = pz - sb.cz;
      const c = Math.cos(sb.rot);
      const s = Math.sin(sb.rot);
      const lx = dx * c - dz * s;
      const lz = dx * s + dz * c;
      return Math.abs(lx) <= sb.hw + 1e-3 && Math.abs(lz) <= sb.hd + 1e-3;
    });
    if (fits && sb.y1 + cat.size.h <= ctx.ceiling && (!best || sb.y1 > best.top)) best = { it, top: sb.y1 };
  }
  return best?.it;
}

/** Floor or ceiling item at (x, z): sets y (stacking or ceiling) and `on`. */
export function placeFlat(ctx: Ctx, base: DItem, cat: CatalogItem, x: number, z: number, rot: number, exclude: Set<string>): DItem {
  if (cat.mount === "ceiling") return { ...base, x, z, rot, y: ctx.ceiling - cat.size.h, on: undefined };
  const surface = surfaceUnder(ctx, cat, x, z, rot, exclude);
  if (surface) {
    const sc = getCatalogItem(surface.itemId)!;
    return { ...base, x, z, rot, y: surface.y + sc.size.h, on: surface.uid };
  }
  return { ...base, x, z, rot, y: 0, on: undefined };
}

export interface Face {
  wall: PlanWall;
  side: 1 | -1;
}

/** Faces of solid walls that look into a zone. */
export function wallFaces(plan: Plan): Face[] {
  const faces: Face[] = [];
  for (const wall of plan.walls) {
    if (wall.kind !== "solid") continue;
    if (wall.sides[0]) faces.push({ wall, side: 1 });
    if (wall.sides[1]) faces.push({ wall, side: -1 });
  }
  return faces;
}

export function faceZone(f: Face): string | null {
  return f.side === 1 ? f.wall.sides[0] : f.wall.sides[1];
}

/** A wall item on a face at `along` metres from the wall start with bottom height y (both clamped). */
export function placeOnFace(ctx: Ctx, base: DItem, cat: CatalogItem, face: Face, along: number, y: number): DItem {
  const g = wallGeom(face.wall);
  const hw = cat.size.w / 2;
  const lo = WALL_T / 2 + hw;
  const hi = g.length - WALL_T / 2 - hw;
  const u = lo > hi ? g.length / 2 : Math.min(hi, Math.max(lo, along));
  const vy = Math.min(Math.max(y, 0.05), ctx.ceiling - cat.size.h - 0.02);
  const n: XZ = [g.normal[0] * face.side, g.normal[1] * face.side];
  const off = WALL_T / 2 + cat.size.d / 2;
  return {
    ...base,
    x: face.wall.a[0] + g.dir[0] * u + n[0] * off,
    z: face.wall.a[1] + g.dir[1] * u + n[1] * off,
    y: vy,
    rot: rotationForNormal(n),
    wallId: face.wall.id,
    side: face.side,
    on: undefined,
  };
}

/** Position along a face for a world point. */
export function alongFace(face: Face, x: number, z: number): number {
  const g = wallGeom(face.wall);
  return (x - face.wall.a[0]) * g.dir[0] + (z - face.wall.a[1]) * g.dir[1];
}

export function faceOf(plan: Plan, it: DItem): Face | undefined {
  const wall = plan.walls.find((w) => w.id === it.wallId);
  return wall ? { wall, side: it.side ?? 1 } : undefined;
}

/** Re-seat wall and ceiling items after the ceiling height changed. */
export function reseatForCeiling(ctx: Ctx, items: DItem[]): DItem[] {
  return items.map((it) => {
    const cat = getCatalogItem(it.itemId);
    if (!cat) return it;
    if (cat.mount === "ceiling") return { ...it, y: ctx.ceiling - cat.size.h };
    if (cat.mount === "wall") {
      const face = faceOf(ctx.plan, it);
      return face ? placeOnFace(ctx, it, cat, face, alongFace(face, it.x, it.z), it.y) : it;
    }
    return it;
  });
}

function zoneOk(ctx: Ctx, zoneId: string | null, x: number, z: number) {
  if (!zoneId) return true;
  const zn = ctx.plan.zones.find((q) => q.id === zoneId);
  return !zn || pointInPolygon(x, z, zn.polygon);
}

/**
 * Nearest free spot for a new item: in the focused zone if given, else around the plan centre.
 * Returns null when nothing fits.
 */
export function findFreeSpot(ctx: Ctx, cat: CatalogItem, base: DItem, focus: string | null, near?: XZ): DItem | null {
  // With no focused room, new items go to the main (largest) room rather than wherever the plan's centre falls.
  const zoneId = focus ?? (near ? null : largestZone(ctx.plan).id);
  if (cat.mount === "wall") {
    const faces = wallFaces(ctx.plan).filter((f) => !zoneId || faceZone(f) === zoneId);
    const start = near ?? centreOf(ctx, zoneId);
    const ranked = faces
      .map((f) => {
        const g = wallGeom(f.wall);
        const mid: XZ = [(f.wall.a[0] + f.wall.b[0]) / 2, (f.wall.a[1] + f.wall.b[1]) / 2];
        return { f, g, d: Math.hypot(mid[0] - start[0], mid[1] - start[1]) };
      })
      .sort((a, b) => a.d - b.d);
    const y = cat.mountHeight ?? 1.3;
    for (const { f, g } of ranked) {
      const along0 = Math.min(Math.max(alongFace(f, start[0], start[1]), 0), g.length);
      for (let k = 0; k < 60; k++) {
        const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.1;
        const u = along0 + off;
        if (u < 0 || u > g.length) continue;
        const cand = placeOnFace(ctx, base, cat, f, u, y);
        if (checkItems(ctx, [cand]).valid) return cand;
      }
    }
    return null;
  }

  const [sx, sz] = near ?? centreOf(ctx, zoneId);
  const step = 0.1;
  for (let ring = 0; ring < 70; ring++) {
    for (let i = -ring; i <= ring; i++) {
      for (let j = -ring; j <= ring; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
        const x = sx + i * step;
        const z = sz + j * step;
        if (!zoneOk(ctx, zoneId, x, z)) continue;
        for (const rot of [0, Math.PI / 2]) {
          const cand = placeFlat(ctx, base, cat, x, z, rot, new Set([base.uid]));
          if (checkItems(ctx, [cand]).valid) return cand;
        }
      }
    }
  }
  return null;
}

export function centreOf(ctx: Ctx, zoneId: string | null): XZ {
  const zn = zoneId ? ctx.plan.zones.find((z) => z.id === zoneId) : undefined;
  if (zn) return zoneCenter(zn);
  const b = ctx.plan.bounds;
  const c: XZ = [(b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2];
  if (ctx.plan.zones.some((z) => pointInPolygon(c[0], c[1], z.polygon))) return c;
  return zoneCenter(largestZone(ctx.plan));
}

function largestZone(plan: Plan) {
  return plan.zones.reduce((a, z) => (aabbArea(z.polygon) > aabbArea(a.polygon) ? z : a));
}

function aabbArea(poly: XZ[]) {
  const xs = poly.map((p) => p[0]);
  const zs = poly.map((p) => p[1]);
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...zs) - Math.min(...zs));
}

export interface Guide {
  a: XZ;
  b: XZ;
}

interface Target {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  wall?: "x" | "z";
}

/**
 * Snap a dragged floor/ceiling item to edges and centres of nearby items and fixtures,
 * and flush to wall faces. Returns the snapped position and the guide lines to draw.
 */
export function alignSnap(ctx: Ctx, cat: CatalogItem, x: number, z: number, rot: number, exclude: Set<string>): { x: number; z: number; guides: Guide[] } {
  const me = boxAabb({ cx: x, cz: z, hw: cat.size.w / 2, hd: cat.size.d / 2, rot, y0: 0, y1: 0 });
  const targets: Target[] = [];
  for (const it of ctx.items) {
    if (exclude.has(it.uid)) continue;
    const c = getCatalogItem(it.itemId);
    if (!c || c.mount === "wall") continue;
    targets.push(boxAabb(itemBox(it, c)));
  }
  for (const f of ctx.plan.fixtures) targets.push(boxAabb(fixtureBox(f)));
  for (const w of ctx.plan.walls) {
    const vertical = Math.abs(w.a[0] - w.b[0]) < 1e-6;
    const lo = vertical ? Math.min(w.a[1], w.b[1]) : Math.min(w.a[0], w.b[0]);
    const hi = vertical ? Math.max(w.a[1], w.b[1]) : Math.max(w.a[0], w.b[0]);
    if (vertical) targets.push({ minX: w.a[0] - WALL_T / 2, maxX: w.a[0] + WALL_T / 2, minZ: lo, maxZ: hi, wall: "x" });
    else targets.push({ minX: lo, maxX: hi, minZ: w.a[1] - WALL_T / 2, maxZ: w.a[1] + WALL_T / 2, wall: "z" });
  }

  const axis = (k: "x" | "z") => {
    const [lo, hi, c] = k === "x" ? [me.minX, me.maxX, x] : [me.minZ, me.maxZ, z];
    const [olo, ohi] = k === "x" ? [me.minZ, me.maxZ] : [me.minX, me.maxX];
    let best: { delta: number; at: number; t: Target } | null = null;
    for (const t of targets) {
      const [tlo, thi] = k === "x" ? [t.minX, t.maxX] : [t.minZ, t.maxZ];
      const [toLo, toHi] = k === "x" ? [t.minZ, t.maxZ] : [t.minX, t.maxX];
      const gap = Math.max(toLo - ohi, olo - toHi, 0);
      if (t.wall) {
        if (t.wall !== k || toHi < olo || toLo > ohi) continue;
        // flush to the face on either side
        for (const [mine, theirs] of [
          [lo, thi],
          [hi, tlo],
        ] as const) {
          const delta = theirs - mine;
          if (Math.abs(delta) < SNAP_DIST && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, at: theirs, t };
        }
        continue;
      }
      if (gap > 2.5) continue;
      const pairs: [number, number][] = [
        [lo, tlo],
        [hi, thi],
        [lo, thi],
        [hi, tlo],
        [c, (tlo + thi) / 2],
      ];
      for (const [mine, theirs] of pairs) {
        const delta = theirs - mine;
        if (Math.abs(delta) < SNAP_DIST && (!best || Math.abs(delta) < Math.abs(best.delta) - 1e-4)) best = { delta, at: theirs, t };
      }
    }
    return best;
  };

  const bx = axis("x");
  const bz = axis("z");
  const nx = x + (bx?.delta ?? 0);
  const nz = z + (bz?.delta ?? 0);
  const guides: Guide[] = [];
  if (bx && !bx.t.wall) {
    const z0 = Math.min(me.minZ + (bz?.delta ?? 0), bx.t.minZ);
    const z1 = Math.max(me.maxZ + (bz?.delta ?? 0), bx.t.maxZ);
    guides.push({ a: [bx.at, z0], b: [bx.at, z1] });
  }
  if (bz && !bz.t.wall) {
    const x0 = Math.min(me.minX + (bx?.delta ?? 0), bz.t.minX);
    const x1 = Math.max(me.maxX + (bx?.delta ?? 0), bz.t.maxX);
    guides.push({ a: [x0, bz.at], b: [x1, bz.at] });
  }
  if (bx?.t.wall) guides.push({ a: [bx.at, me.minZ + (bz?.delta ?? 0)], b: [bx.at, me.maxZ + (bz?.delta ?? 0)] });
  if (bz?.t.wall) guides.push({ a: [me.minX + (bx?.delta ?? 0), bz.at], b: [me.maxX + (bx?.delta ?? 0), bz.at] });
  return { x: nx, z: nz, guides };
}

export interface MoveResult extends CheckResult {
  items: DItem[];
}

/** Check moving a rigid set by (dx, dz) and dRot about `pivot`. */
export function tryMoveSet(ctx: Ctx, uids: Set<string>, dx: number, dz: number, dRot = 0, pivot: XZ = [0, 0]): MoveResult {
  const moved = transformItems(ctx.items, uids, dx, dz, dRot, pivot);
  return { items: moved, ...checkItems(ctx, moved) };
}
