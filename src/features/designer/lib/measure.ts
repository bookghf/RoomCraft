import { getCatalogItem } from "@/features/designer/data/catalog";
import type { DItem } from "@/features/designer/types";
import { rectsOverlap } from "@/features/planner/lib/placement";
import { boxAabb, itemBox, itemObstacles, staticObstacles, withDescendants, type Ctx } from "./collision";
import { openingTop, WALL_T, wallGeom } from "./geometry";
import { faceOf } from "./placement";

export type P3 = [number, number, number];

export interface DistLine {
  a: P3;
  b: P3;
  d: number;
}

const MIN_SHOWN = 0.01;

/**
 * Blue distance lines from each side of the selected item to the nearest wall, item or fixture.
 * Sides that touch something (< 1 cm) are left out. Items standing on others are not measured.
 */
export function distanceLines(ctx: Ctx, uid: string): DistLine[] {
  const it = ctx.items.find((i) => i.uid === uid);
  const cat = it && getCatalogItem(it.itemId);
  if (!it || !cat || it.on || cat.flat) return [];
  if (cat.mount === "wall") return wallItemLines(ctx, it);

  const me = itemBox(it, cat);
  const a = boxAabb(me);
  const skip = withDescendants(ctx.items, [uid]);
  const obstacles = [...staticObstacles(ctx.plan, ctx.ceiling), ...itemObstacles(ctx.items, skip)]
    .filter((o) => !o.flat && o.box.y0 < me.y1 - 1e-3 && me.y0 < o.box.y1 - 1e-3)
    .map((o) => boxAabb(o.box));
  const y = cat.mount === "ceiling" ? me.y0 - 0.01 : 0.03;
  const lines: DistLine[] = [];

  const dirs = [
    { axis: "x", sign: 1 },
    { axis: "x", sign: -1 },
    { axis: "z", sign: 1 },
    { axis: "z", sign: -1 },
  ] as const;
  for (const { axis, sign } of dirs) {
    let best: { d: number; at: number } | null = null;
    for (const o of obstacles) {
      const [olo, ohi, mlo, mhi] = axis === "x" ? [o.minZ, o.maxZ, a.minZ, a.maxZ] : [o.minX, o.maxX, a.minX, a.maxX];
      if (olo >= mhi - 1e-3 || ohi <= mlo + 1e-3) continue;
      const d = axis === "x" ? (sign > 0 ? o.minX - a.maxX : a.minX - o.maxX) : sign > 0 ? o.minZ - a.maxZ : a.minZ - o.maxZ;
      if (d < -1e-3) continue;
      const at = (Math.max(olo, mlo) + Math.min(ohi, mhi)) / 2;
      if (!best || d < best.d) best = { d: Math.max(0, d), at };
    }
    if (!best || best.d < MIN_SHOWN) continue;
    if (axis === "x") {
      const x0 = sign > 0 ? a.maxX : a.minX;
      lines.push({ a: [x0, y, best.at], b: [x0 + sign * best.d, y, best.at], d: best.d });
    } else {
      const z0 = sign > 0 ? a.maxZ : a.minZ;
      lines.push({ a: [best.at, y, z0], b: [best.at, y, z0 + sign * best.d], d: best.d });
    }
  }
  return lines;
}

/** Wall items measure along their wall (to wall ends, openings and other wall items) and up/down. */
function wallItemLines(ctx: Ctx, it: DItem): DistLine[] {
  const cat = getCatalogItem(it.itemId)!;
  const face = faceOf(ctx.plan, it);
  if (!face) return [];
  const g = wallGeom(face.wall);
  const n = [g.normal[0] * face.side, g.normal[1] * face.side];
  const u = (it.x - face.wall.a[0]) * g.dir[0] + (it.z - face.wall.a[1]) * g.dir[1];
  const hw = cat.size.w / 2;
  const v0 = it.y;
  const v1 = it.y + cat.size.h;
  const off = WALL_T / 2 + 0.01;
  const at = (uu: number, vv: number, o = off): P3 => [face.wall.a[0] + g.dir[0] * uu + n[0] * o, vv, face.wall.a[1] + g.dir[1] * uu + n[1] * o];
  const mid = WALL_T / 2 + cat.size.d / 2;

  // Horizontal neighbours on the same face.
  const spans: [number, number][] = [
    [-Infinity, WALL_T / 2],
    [g.length - WALL_T / 2, Infinity],
  ];
  for (const o of face.wall.openings) if (o.sill < v1 && openingTop(o, ctx.ceiling) > v0) spans.push([o.offset, o.offset + o.width]);
  for (const other of ctx.items) {
    if (other.uid === it.uid || other.wallId !== it.wallId || other.side !== it.side) continue;
    const oc = getCatalogItem(other.itemId);
    if (!oc || other.y >= v1 || other.y + oc.size.h <= v0) continue;
    const ou = (other.x - face.wall.a[0]) * g.dir[0] + (other.z - face.wall.a[1]) * g.dir[1];
    spans.push([ou - oc.size.w / 2, ou + oc.size.w / 2]);
  }
  const left = Math.max(...spans.filter(([, hi]) => hi <= u - hw + 1e-3).map(([, hi]) => hi));
  const right = Math.min(...spans.filter(([lo]) => lo >= u + hw - 1e-3).map(([lo]) => lo));
  const vm = (v0 + v1) / 2;
  const lines: DistLine[] = [];
  if (u - hw - left >= MIN_SHOWN) lines.push({ a: at(left, vm), b: at(u - hw, vm), d: u - hw - left });
  if (right - (u + hw) >= MIN_SHOWN) lines.push({ a: at(u + hw, vm), b: at(right, vm), d: right - (u + hw) });

  // Vertical: down to the floor or the top of furniture below, up to the ceiling or what hangs above.
  const me = itemBox(it, cat);
  let below = 0;
  let above = ctx.ceiling;
  for (const other of ctx.items) {
    if (other.uid === it.uid) continue;
    const oc = getCatalogItem(other.itemId);
    if (!oc || oc.flat) continue;
    const ob = itemBox(other, oc);
    if (!rectsOverlap(me, ob)) continue;
    if (ob.y1 <= v0 + 1e-3) below = Math.max(below, ob.y1);
    if (ob.y0 >= v1 - 1e-3) above = Math.min(above, ob.y0);
  }
  if (v0 - below >= MIN_SHOWN) lines.push({ a: at(u, below, mid), b: at(u, v0, mid), d: v0 - below });
  if (above - v1 >= MIN_SHOWN) lines.push({ a: at(u, v1, mid), b: at(u, above, mid), d: above - v1 });
  return lines;
}

export function cm(m: number): string {
  return `${Math.round(m * 100)}`;
}
