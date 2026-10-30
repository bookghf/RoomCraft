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
