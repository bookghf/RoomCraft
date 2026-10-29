import { getCatalogItem } from "@/features/designer/data/catalog";
import type { CatalogItem, DItem, Fixture, Plan, PlanWall } from "@/features/designer/types";
import { rectsOverlap, type Rect2 } from "@/features/planner/lib/placement";
import { openingTop, pointInPolygon, RAILING_H, solidSpans, WALL_T, wallGeom } from "./geometry";

const EPS = 1e-3;

/** Oriented footprint plus a vertical range. */
export interface Box extends Rect2 {
  y0: number;
  y1: number;
}

export interface Ctx {
  plan: Plan;
  ceiling: number;
  items: DItem[];
}

export interface Obstacle {
  /** "item:<uid>", "fixture:<id>" or "wall:<id>" */
  ref: string;
  box: Box;
  flat?: boolean;
}

export interface CheckResult {
  valid: boolean;
  blockers: string[];
}

export function itemBox(it: DItem, cat: CatalogItem): Box {
  const { w, d, h } = cat.size;
  return { cx: it.x, cz: it.z, hw: w / 2, hd: d / 2, rot: it.rot, y0: it.y, y1: it.y + h };
}

export function fixtureBox(f: Fixture): Box {
  return { cx: f.x, cz: f.z, hw: f.w / 2, hd: f.d / 2, rot: f.rot, y0: 0, y1: f.h };
}

/** Rotation that lays a box's local x axis along a wall's direction. */
function wallRot(w: PlanWall) {
  const g = wallGeom(w);
  return Math.atan2(-g.dir[1], g.dir[0]);
}

export function wallBoxes(w: PlanWall, ceiling: number): Box[] {
  const g = wallGeom(w);
  const rot = wallRot(w);
  const top = w.kind === "railing" ? RAILING_H : ceiling;
  return solidSpans(w).map(([u0, u1]) => {
    // Extend spans that reach a wall end so corners are closed.
    const s0 = u0 <= 1e-6 ? -WALL_T / 2 : u0;
    const s1 = u1 >= g.length - 1e-6 ? g.length + WALL_T / 2 : u1;
    const mid = (s0 + s1) / 2;
    return { cx: w.a[0] + g.dir[0] * mid, cz: w.a[1] + g.dir[1] * mid, hw: (s1 - s0) / 2, hd: WALL_T / 2, rot, y0: 0, y1: top };
  });
}

export function boxesOverlap(a: Box, b: Box): boolean {
  if (a.y0 >= b.y1 - EPS || b.y0 >= a.y1 - EPS) return false;
  return rectsOverlap(a, b);
}

export function boxCorners(b: Box): [number, number][] {
  const c = Math.cos(b.rot);
  const s = Math.sin(b.rot);
  const ax: [number, number] = [c, -s];
  const az: [number, number] = [s, c];
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([i, j]) => [b.cx + ax[0] * b.hw * i + az[0] * b.hd * j, b.cz + ax[1] * b.hw * i + az[1] * b.hd * j]);
}

/** Axis-aligned bounds of a rotated box footprint. */
export function boxAabb(b: Box) {
  const c = Math.abs(Math.cos(b.rot));
  const s = Math.abs(Math.sin(b.rot));
  const hx = b.hw * c + b.hd * s;
  const hz = b.hw * s + b.hd * c;
  return { minX: b.cx - hx, maxX: b.cx + hx, minZ: b.cz - hz, maxZ: b.cz + hz, hx, hz };
}

/** Every corner and the centre lie inside some zone. */
export function insidePlan(plan: Plan, b: Box): boolean {
  const shrink = { ...b, hw: Math.max(b.hw - 0.002, 0), hd: Math.max(b.hd - 0.002, 0) };
  return [...boxCorners(shrink), [b.cx, b.cz] as [number, number]].every(([x, z]) => plan.zones.some((zn) => pointInPolygon(x, z, zn.polygon)));
}

export function staticObstacles(plan: Plan, ceiling: number): Obstacle[] {
  const out: Obstacle[] = [];
  for (const w of plan.walls) for (const box of wallBoxes(w, ceiling)) out.push({ ref: `wall:${w.id}`, box });
  for (const f of plan.fixtures) out.push({ ref: `fixture:${f.id}`, box: fixtureBox(f) });
  return out;
}

export function itemObstacles(items: DItem[], exclude: Set<string>): Obstacle[] {
  const out: Obstacle[] = [];
  for (const it of items) {
    if (exclude.has(it.uid)) continue;
    const cat = getCatalogItem(it.itemId);
    if (!cat) continue;
    out.push({ ref: `item:${it.uid}`, box: itemBox(it, cat), flat: cat.flat });
  }
  return out;
}

/** The item plus everything standing on it, recursively. */
export function withDescendants(items: DItem[], uids: Iterable<string>): Set<string> {
  const set = new Set(uids);
  let grew = true;
  while (grew) {
    grew = false;
    for (const it of items) {
      if (it.on && set.has(it.on) && !set.has(it.uid)) {
        set.add(it.uid);
        grew = true;
      }
    }
  }
  return set;
}

/** A wall item must not cover a door or window on its wall. */
function blocksOpening(plan: Plan, it: DItem, cat: CatalogItem, ceiling: number): boolean {
  const wall = plan.walls.find((w) => w.id === it.wallId);
  if (!wall) return false;
  const g = wallGeom(wall);
  const along = (it.x - wall.a[0]) * g.dir[0] + (it.z - wall.a[1]) * g.dir[1];
  const hw = cat.size.w / 2;
  return wall.openings.some((o) => {
    const horiz = along + hw > o.offset + EPS && along - hw < o.offset + o.width - EPS;
    const vert = it.y + cat.size.h > o.sill + EPS && it.y < openingTop(o, ceiling) - EPS;
    return horiz && vert;
  });
}

/**
 * Check a set of moved items (new states) against walls, fixtures, every other item and the plan outline.
 * Flat items (rugs) are only blocked by walls; nothing is blocked by a rug.
 */
export function checkItems(ctx: Ctx, moved: DItem[]): CheckResult {
  const movedIds = new Set(moved.map((m) => m.uid));
  const obstacles = [...staticObstacles(ctx.plan, ctx.ceiling), ...itemObstacles(ctx.items, movedIds)];
  const blockers = new Set<string>();
  let valid = true;

  for (const it of moved) {
    const cat = getCatalogItem(it.itemId);
    if (!cat) continue;
    const box = itemBox(it, cat);
    if (!insidePlan(ctx.plan, box)) valid = false;
    if (cat.mount === "wall" && blocksOpening(ctx.plan, it, cat, ctx.ceiling)) {
      valid = false;
      if (it.wallId) blockers.add(`wall:${it.wallId}`);
    }
    if (box.y1 > ctx.ceiling + EPS) valid = false;
    for (const o of obstacles) {
      if (o.flat) continue;
      if (cat.flat && !o.ref.startsWith("wall:")) continue;
      if (cat.mount === "wall" && o.ref === `wall:${it.wallId}`) continue;
      if (boxesOverlap(box, o.box)) {
        valid = false;
        blockers.add(o.ref);
      }
    }
  }
  return { valid, blockers: [...blockers] };
}
