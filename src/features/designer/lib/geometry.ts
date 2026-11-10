import type { DimRun, Opening, OpeningSpec, Plan, PlanSpec, PlanWall, XZ, Zone } from "@/features/designer/types";

export const WALL_T = 0.12;
export const RAILING_H = 1.05;
export const DOOR_H = 2.05;
const EPS = 1e-6;
const SIDE_PROBE = 0.05;

const r3 = (v: number) => Math.round(v * 1000) / 1000;

export function pointInPolygon(x: number, z: number, poly: XZ[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function zoneAt(zones: Zone[], x: number, z: number): Zone | undefined {
  return zones.find((zn) => pointInPolygon(x, z, zn.polygon));
}

export function polygonBounds(poly: XZ[]) {
  const xs = poly.map((p) => p[0]);
  const zs = poly.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}

export function polygonArea(poly: XZ[]): number {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
  return Math.abs(a / 2);
}

/** Visual centre of a zone: the bounds centre, or the centroid of the largest rectangle part for L-shapes. */
export function zoneCenter(zone: Zone): XZ {
  const b = polygonBounds(zone.polygon);
  const c: XZ = [(b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2];
  if (pointInPolygon(c[0], c[1], zone.polygon)) return c;
  let best: XZ = c;
  let bestD = Infinity;
  for (let x = b.minX + 0.25; x < b.maxX; x += 0.25) {
    for (let z = b.minZ + 0.25; z < b.maxZ; z += 0.25) {
      if (!pointInPolygon(x, z, zone.polygon)) continue;
      const d = Math.hypot(x - c[0], z - c[1]);
      if (d < bestD) {
        bestD = d;
        best = [x, z];
      }
    }
  }
  return best;
}

export interface WallGeom {
  dir: XZ;
  normal: XZ;
  length: number;
}

export function wallGeom(w: { a: XZ; b: XZ }): WallGeom {
  const dx = w.b[0] - w.a[0];
  const dz = w.b[1] - w.a[1];
  const length = Math.hypot(dx, dz);
  const dir: XZ = [dx / length, dz / length];
  return { dir, normal: [-dir[1], dir[0]], length };
}

/** rotationY that makes an item's front face along `normal`. */
export function rotationForNormal(normal: XZ): number {
  return Math.atan2(normal[0], normal[1]);
}

export function openingBottom(o: Opening) {
  return o.sill;
}

export function openingTop(o: Opening, ceiling: number) {
  return Math.min(o.sill + o.height, ceiling - 0.12);
}

function onSegment(p: XZ, a: XZ, b: XZ, tol = 0.02): number | null {
  const g = wallGeom({ a, b });
  const along = (p[0] - a[0]) * g.dir[0] + (p[1] - a[1]) * g.dir[1];
  const off = (p[0] - a[0]) * g.normal[0] + (p[1] - a[1]) * g.normal[1];
  if (Math.abs(off) > tol || along < -tol || along > g.length + tol) return null;
  return along;
}

function makeOpening(spec: OpeningSpec, along: number, length: number): Opening {
  const width = Math.min(spec.width, length - 0.1);
  const offset = Math.min(Math.max(along - width / 2, 0.05), length - width - 0.05);
  if (spec.type === "window") return { type: "window", offset, width, sill: spec.sill ?? 0.9, height: spec.height ?? 1.2 };
  return { type: spec.type, offset, width, sill: 0, height: spec.height ?? (spec.type === "slider" ? 2.2 : DOOR_H) };
}

interface RawSeg {
  a: XZ;
  b: XZ;
  zones: Set<string>;
}

/**
 * Build walls from zone outlines: every zone edge is split at all plan vertex coordinates,
 * shared edges become interior walls, edges listed in `open` are dropped, and collinear
 * neighbours with the same sides are merged again. Balcony edges to the outside become railings.
 */
export function resolvePlan(spec: PlanSpec): Plan {
  const xs = new Set<number>();
  const zs = new Set<number>();
  for (const zn of spec.zones) {
    for (const [x, z] of zn.polygon) {
      xs.add(r3(x));
      zs.add(r3(z));
    }
  }

  const segs = new Map<string, RawSeg>();
  for (const zn of spec.zones) {
    const poly = zn.polygon;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const horizontal = Math.abs(p[1] - q[1]) < EPS;
      const lo = horizontal ? Math.min(p[0], q[0]) : Math.min(p[1], q[1]);
      const hi = horizontal ? Math.max(p[0], q[0]) : Math.max(p[1], q[1]);
      const cuts = [...(horizontal ? xs : zs)].filter((v) => v > lo + EPS && v < hi - EPS).sort((a, b) => a - b);
      const stops = [lo, ...cuts, hi];
      for (let k = 0; k < stops.length - 1; k++) {
        const a: XZ = horizontal ? [r3(stops[k]), r3(p[1])] : [r3(p[0]), r3(stops[k])];
        const b: XZ = horizontal ? [r3(stops[k + 1]), r3(p[1])] : [r3(p[0]), r3(stops[k + 1])];
        const key = `${a[0]},${a[1]}:${b[0]},${b[1]}`;
        const seg = segs.get(key) ?? { a, b, zones: new Set<string>() };
        seg.zones.add(zn.id);
        segs.set(key, seg);
      }
    }
  }

  const isOpen = (a: XZ, b: XZ) =>
    (spec.open ?? []).some(([p, q]) => onSegment(a, p, q, 0.01) !== null && onSegment(b, p, q, 0.01) !== null);

  const sideZone = (a: XZ, b: XZ, sign: 1 | -1) => {
    const g = wallGeom({ a, b });
    const mx = (a[0] + b[0]) / 2 + g.normal[0] * SIDE_PROBE * sign;
    const mz = (a[1] + b[1]) / 2 + g.normal[1] * SIDE_PROBE * sign;
    return zoneAt(spec.zones, mx, mz)?.id ?? null;
  };

  type Piece = { a: XZ; b: XZ; sides: [string | null, string | null] };
  const pieces: Piece[] = [];
  for (const s of segs.values()) {
    if (isOpen(s.a, s.b)) continue;
    pieces.push({ a: s.a, b: s.b, sides: [sideZone(s.a, s.b, 1), sideZone(s.a, s.b, -1)] });
  }

  // Merge collinear contiguous pieces with identical sides.
  const merged: Piece[] = [];
  const sorted = pieces.sort((p, q) => {
    const ph = p.a[1] === p.b[1] ? 0 : 1;
    const qh = q.a[1] === q.b[1] ? 0 : 1;
    if (ph !== qh) return ph - qh;
    const pl = ph === 0 ? p.a[1] : p.a[0];
    const ql = qh === 0 ? q.a[1] : q.a[0];
    if (pl !== ql) return pl - ql;
    return ph === 0 ? p.a[0] - q.a[0] : p.a[1] - q.a[1];
  });
  for (const p of sorted) {
    const last = merged[merged.length - 1];
    if (last && last.b[0] === p.a[0] && last.b[1] === p.a[1] && last.sides[0] === p.sides[0] && last.sides[1] === p.sides[1]) {
      const g1 = wallGeom(last);
      const g2 = wallGeom(p);
      if (Math.abs(g1.dir[0] - g2.dir[0]) < EPS && Math.abs(g1.dir[1] - g2.dir[1]) < EPS) {
        last.b = p.b;
        continue;
      }
    }
    merged.push({ ...p });
  }

  const kindOf = (id: string | null) => spec.zones.find((z) => z.id === id)?.kind;
  const walls: PlanWall[] = merged.map((p, i) => {
    const exterior = p.sides[0] === null || p.sides[1] === null;
    const balconyEdge = exterior && (kindOf(p.sides[0]) === "balcony" || kindOf(p.sides[1]) === "balcony");
    return { id: `w${i}`, a: p.a, b: p.b, kind: balconyEdge ? "railing" : "solid", exterior, openings: [], sides: p.sides };
  });

  for (const o of spec.openings) {
    for (const w of walls) {
      const along = onSegment(o.at, w.a, w.b);
      if (along === null) continue;
      w.openings.push(makeOpening(o, along, wallGeom(w).length));
      break;
    }
  }

  return { spec, zones: spec.zones, walls, fixtures: spec.fixtures, outline: outlineRuns(walls), bounds: planBounds(spec.zones) };
}

function planBounds(zones: Zone[]) {
  const all = zones.flatMap((z) => z.polygon);
  return polygonBounds(all);
}

/** Exterior wall runs (merged across collinear neighbours) for room-size lines. */
export function outlineRuns(walls: PlanWall[]): DimRun[] {
  const ext = walls
    .filter((w) => w.exterior)
    .map((w) => {
      const g = wallGeom(w);
      const out: XZ = w.sides[0] === null ? g.normal : [-g.normal[0], -g.normal[1]];
      // orient a→b so lines sort by position
      const swap = w.a[0] > w.b[0] || w.a[1] > w.b[1];
      return { a: swap ? w.b : w.a, b: swap ? w.a : w.b, out };
    });
  ext.sort((p, q) => {
    const ph = p.a[1] === p.b[1] ? 0 : 1;
    const qh = q.a[1] === q.b[1] ? 0 : 1;
    if (ph !== qh) return ph - qh;
    const pl = ph === 0 ? p.a[1] : p.a[0];
    const ql = qh === 0 ? q.a[1] : q.a[0];
    if (pl !== ql) return pl - ql;
    if (p.out[0] !== q.out[0] || p.out[1] !== q.out[1]) return p.out[0] + p.out[1] - (q.out[0] + q.out[1]);
    return ph === 0 ? p.a[0] - q.a[0] : p.a[1] - q.a[1];
  });
  const runs: DimRun[] = [];
  for (const r of ext) {
    const last = runs[runs.length - 1];
    if (last && last.b[0] === r.a[0] && last.b[1] === r.a[1] && last.out[0] === r.out[0] && last.out[1] === r.out[1]) last.b = r.b;
    else runs.push({ ...r });
  }
  return runs;
}

/** Solid parts of a wall along its length (doors and sliders cut through to the floor). */
export function solidSpans(w: PlanWall): [number, number][] {
  const len = wallGeom(w).length;
  const cuts = w.openings.filter((o) => o.type !== "window").sort((a, b) => a.offset - b.offset);
  const spans: [number, number][] = [];
  let cursor = 0;
  for (const o of cuts) {
    if (o.offset > cursor) spans.push([cursor, o.offset]);
    cursor = o.offset + o.width;
  }
  if (cursor < len) spans.push([cursor, len]);
  return spans;
}

const planCache = new Map<string, Plan>();

export function cachedPlan(spec: PlanSpec): Plan {
  const key = spec.resizable ? `${spec.id}:${spec.resizable.w}x${spec.resizable.d}` : spec.id;
  let plan = planCache.get(key);
  if (!plan) {
    plan = resolvePlan(spec);
    planCache.set(key, plan);
  }
  return plan;
}

/** Forget resolved plans, e.g. after new plan versions arrive from the API. */
export function clearPlanCache() {
  planCache.clear();
}

/** Zones a wall touches: the zones on either side. */
export function wallZones(w: PlanWall): string[] {
  return w.sides.filter((s): s is string => s !== null);
}

/** Walking space kept free in front of doors and sliders, and in front of windows for tall furniture. */
export const PASS_DEPTH = 0.6;
export const WINDOW_DEPTH = 0.3;
/** Furniture may rise this far above a window sill before it counts as blocking the window. */
export const WINDOW_ALLOWANCE = 0.3;

/**
 * The floor a hinged door sweeps when it opens. Doors swing into the room on their wall
 * (the larger one for a wall between two rooms), hinged at the opening's start, so the leaf
 * turns from along the wall (`leaf`) to straight into the room (`open`).
 */
export interface DoorSwing {
  /** "<wallId>:<opening index>" */
  id: string;
  hinge: XZ;
  leaf: XZ;
  open: XZ;
  radius: number;
}

/** Which side of a wall (+1 = +normal, -1 = -normal) a door swings into. */
function swingSide(plan: Plan, w: PlanWall): 1 | -1 {
  const area = (id: string | null) => {
    const z = id ? plan.zones.find((zn) => zn.id === id) : undefined;
    return z ? Math.abs(polygonArea(z.polygon)) : -1;
  };
  return area(w.sides[0]) >= area(w.sides[1]) ? 1 : -1;
}

export function doorSwings(plan: Plan): DoorSwing[] {
  const out: DoorSwing[] = [];
  for (const w of plan.walls) {
    if (w.kind !== "solid") continue;
    const g = wallGeom(w);
    const sign = swingSide(plan, w);
    const open: XZ = [g.normal[0] * sign, g.normal[1] * sign];
    w.openings.forEach((o, i) => {
      if (o.type !== "door") return;
      const hinge: XZ = [w.a[0] + g.dir[0] * o.offset + open[0] * (WALL_T / 2), w.a[1] + g.dir[1] * o.offset + open[1] * (WALL_T / 2)];
      out.push({ id: `${w.id}:${i}`, hinge, leaf: g.dir, open, radius: o.width });
    });
  }
  return out;
}

/** Outline of a door swing: the hinge, then points along the arc from closed to fully open. */
export function swingPolygon(s: DoorSwing, steps = 12): XZ[] {
  const pts: XZ[] = [s.hinge];
  for (let k = 0; k <= steps; k++) {
    const a = (k / steps) * (Math.PI / 2);
    const c = Math.cos(a), sn = Math.sin(a);
    pts.push([s.hinge[0] + s.radius * (c * s.leaf[0] + sn * s.open[0]), s.hinge[1] + s.radius * (c * s.leaf[1] + sn * s.open[1])]);
  }
  return pts;
}

/** Space that furniture must keep clear of, as a convex floor outline plus a height range. */
export interface Clearance {
  /** "door:<wallId>:<i>", "slider:<wallId>:<i>" or "window:<wallId>:<i>" */
  ref: string;
  poly: XZ[];
  y0: number;
  y1: number;
}

/** Rectangle in front of an opening on one side of its wall, from `d0` to `d1` metres off the wall's centre line. */
function frontRect(w: PlanWall, o: Opening, sign: number, d0: number, d1: number): XZ[] {
  const g = wallGeom(w);
  const n: XZ = [g.normal[0] * sign, g.normal[1] * sign];
  const at = (u: number, d: number): XZ => [w.a[0] + g.dir[0] * u + n[0] * d, w.a[1] + g.dir[1] * u + n[1] * d];
  return [at(o.offset, d0), at(o.offset + o.width, d0), at(o.offset + o.width, d1), at(o.offset, d1)];
}

/**
 * Every space furniture must leave free: a door's swing plus a walkway on its other side,
 * a walkway on both sides of a slider, and the space in front of a window above its sill
 * (plus an allowance, so low furniture can still stand under it).
 */
export function clearances(plan: Plan, ceiling: number): Clearance[] {
  const swings = new Map(doorSwings(plan).map((s) => [s.id, s]));
  const out: Clearance[] = [];
  for (const w of plan.walls) {
    if (w.kind !== "solid") continue;
    const sign = swingSide(plan, w);
    const half = WALL_T / 2;
    w.openings.forEach((o, i) => {
      const id = `${w.id}:${i}`;
      const top = openingTop(o, ceiling);
      const sides = ([1, -1] as const).filter((sg) => w.sides[sg === 1 ? 0 : 1] !== null);
      if (o.type === "door") {
        const swing = swings.get(id)!;
        out.push({ ref: `door:${id}`, poly: swingPolygon(swing), y0: 0, y1: top });
        out.push({ ref: `door:${id}`, poly: frontRect(w, o, sign, 0, half), y0: 0, y1: top });
        if (sides.includes(-sign as 1 | -1)) out.push({ ref: `door:${id}`, poly: frontRect(w, o, -sign, 0, half + PASS_DEPTH), y0: 0, y1: top });
      } else if (o.type === "slider") {
        for (const sg of sides) out.push({ ref: `slider:${id}`, poly: frontRect(w, o, sg, 0, half + PASS_DEPTH), y0: 0, y1: top });
      } else {
        const y0 = o.sill + WINDOW_ALLOWANCE;
        if (y0 < top) for (const sg of sides) out.push({ ref: `window:${id}`, poly: frontRect(w, o, sg, 0, half + WINDOW_DEPTH), y0, y1: top });
      }
    });
  }
  return out;
}
