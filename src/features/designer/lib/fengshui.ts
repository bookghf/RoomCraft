import type { CatalogItem, DItem, Plan, PlanWall, XZ, Zone } from "@/features/designer/types";
import { pointInPolygon, polygonArea, WALL_T, wallGeom } from "./geometry";

/**
 * Feng Shui score, from fixed rules only: each room starts at BASE_SCORE and its furniture adds or
 * takes away points. The whole home scores the average of its furnished rooms.
 */

export type FengShuiRule =
  | "bedFacesDoor"
  | "bedHeadWall"
  | "bedNoHeadWall"
  | "bedUnderWindow"
  | "deskSeesDoor"
  | "deskBackToDoor"
  | "sofaBackWall"
  | "mirrorFacesBed"
  | "mirrorFacesDoor"
  | "plants"
  | "lights"
  | "crowded"
  | "spacious";

export interface FengShuiReason {
  rule: FengShuiRule;
  points: number;
}

export type FengShuiGrade = "excellent" | "good" | "fair" | "poor";

export interface RoomFengShui {
  zoneId: string;
  base: number;
  score: number;
  grade: FengShuiGrade;
  reasons: FengShuiReason[];
  /** Furniture counted in this room. */
  items: number;
}

export interface HomeFengShui {
  score: number;
  grade: FengShuiGrade;
  rooms: RoomFengShui[];
  /** Rooms with furniture, which make up the average. */
  scored: number;
}

/** Points per rule; one reason per rule however many items trigger it. */
export const RULE_POINTS: Record<FengShuiRule, number> = {
  bedFacesDoor: -10,
  bedHeadWall: 8,
  bedNoHeadWall: -6,
  bedUnderWindow: -5,
  deskSeesDoor: 6,
  deskBackToDoor: -6,
  sofaBackWall: 4,
  mirrorFacesBed: -8,
  mirrorFacesDoor: -5,
  plants: 2, // per plant, up to MAX_PLANT_POINTS
  lights: 3,
  crowded: -6,
  spacious: 3,
};
const MAX_PLANT_POINTS = 6;
/** Where every room starts before its furniture is counted. */
export const BASE_SCORE = 60;

type Kind = "bed" | "desk" | "sofa" | "mirror" | "plant" | "other";

function kindOf(cat: CatalogItem): Kind {
  const shape = String(cat.model.params?.shape ?? cat.model.template);
  const id = cat.id;
  if (shape === "bed" || /(^|-)bed(-|$)/.test(id)) return "bed";
  if (shape === "desk" || /(^|-)desk(-|$)/.test(id)) return "desk";
  if (shape === "sofa" || /(^|-)sofa(-|$)/.test(id)) return "sofa";
  if (shape === "mirror" || /(^|-)mirror(-|$)/.test(id)) return cat.mount === "wall" ? "mirror" : "other";
  if (shape === "plant" || /(^|-)plant(-|$)/.test(id)) return "plant";
  return "other";
}

/** Direction an item's front faces (items turn about +Y; rotation 0 faces +Z). */
const front = (rot: number): XZ => [Math.sin(rot), Math.cos(rot)];
const dot = (a: XZ, b: XZ) => a[0] * b[0] + a[1] * b[1];
const sub = (a: XZ, b: XZ): XZ => [a[0] - b[0], a[1] - b[1]];
const len = (a: XZ) => Math.hypot(a[0], a[1]);

interface Door {
  at: XZ;
}

/** Doors on a room's walls. */
function doors(plan: Plan, zoneId: string): Door[] {
  const out: Door[] = [];
  for (const w of plan.walls) {
    if (!w.sides.includes(zoneId)) continue;
    const g = wallGeom(w);
    for (const o of w.openings) {
      if (o.type !== "door") continue;
      const u = o.offset + o.width / 2;
      out.push({ at: [w.a[0] + g.dir[0] * u, w.a[1] + g.dir[1] * u] });
    }
  }
  return out;
}

/** The solid wall an item's back rests against, if its back is within a hand's width of one. */
function wallBehind(plan: Plan, it: DItem, cat: CatalogItem): { wall: PlanWall; along: number } | null {
  const f = front(it.rot);
  const back: XZ = [it.x - f[0] * (cat.size.d / 2), it.z - f[1] * (cat.size.d / 2)];
  for (const w of plan.walls) {
    if (w.kind !== "solid") continue;
    const g = wallGeom(w);
    if (Math.abs(dot(f, g.dir)) > 0.3) continue; // the wall must run across the item's back
    const along = dot(sub(back, w.a), g.dir);
    if (along < -0.05 || along > g.length + 0.05) continue;
    const off = Math.abs(dot(sub(back, w.a), g.normal));
    if (off <= WALL_T / 2 + 0.15) return { wall: w, along };
  }
  return null;
}

/** Is `target` straight ahead of an item, within `halfWidth` either side of its centre line? */
function straightAhead(it: DItem, target: XZ, halfWidth: number, maxDist: number): boolean {
  const f = front(it.rot);
  const v = sub(target, [it.x, it.z]);
  const ahead = dot(v, f);
  const side = Math.abs(v[0] * f[1] - v[1] * f[0]);
  return ahead > 0 && ahead <= maxDist && side <= halfWidth;
}

/** Is `target` within a cone in front of an item? */
function inView(it: DItem, target: XZ, maxDist: number, cosHalfAngle = Math.cos(Math.PI / 6)): boolean {
  const v = sub(target, [it.x, it.z]);
  const d = len(v);
  return d > 1e-6 && d <= maxDist && dot(v, front(it.rot)) / d >= cosHalfAngle;
}

export function gradeOf(score: number): FengShuiGrade {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

/** Score one room from the furniture standing in it and the doors on its walls. */
export function roomFengShui(plan: Plan, zone: Zone, items: DItem[], catalog: (id: string) => CatalogItem | undefined): RoomFengShui {
  const hits = new Set<FengShuiRule>();
  const placed = items.flatMap((it) => {
    const cat = catalog(it.itemId);
    return cat && pointInPolygon(it.x, it.z, zone.polygon) ? [{ it, cat, kind: kindOf(cat) }] : [];
  });
  const doorList = doors(plan, zone.id);
  const beds = placed.filter((p) => p.kind === "bed");
  for (const { it, cat } of beds) {
    const foot: XZ = [it.x + front(it.rot)[0] * (cat.size.d / 2), it.z + front(it.rot)[1] * (cat.size.d / 2)];
    const footItem = { ...it, x: foot[0], z: foot[1] };
    if (doorList.some((d) => straightAhead(footItem, d.at, cat.size.w / 2 + 0.2, 6))) hits.add("bedFacesDoor");
    const behind = wallBehind(plan, it, cat);
    if (!behind) hits.add("bedNoHeadWall");
    else {
      hits.add("bedHeadWall");
      const hw = cat.size.w / 2;
      if (behind.wall.openings.some((o) => o.type === "window" && behind.along + hw > o.offset && behind.along - hw < o.offset + o.width)) hits.add("bedUnderWindow");
    }
  }

  for (const { it } of placed.filter((p) => p.kind === "desk")) {
    const nearest = doorList.map((d) => ({ d, dist: len(sub(d.at, [it.x, it.z])) })).sort((a, b) => a.dist - b.dist)[0];
    if (!nearest) continue;
    // Whoever sits at the desk is on its front side, looking back across it.
    const looking: XZ = [-front(it.rot)[0], -front(it.rot)[1]];
    hits.add(dot(sub(nearest.d.at, [it.x, it.z]), looking) > 0 ? "deskSeesDoor" : "deskBackToDoor");
  }

  if (placed.some((p) => p.kind === "sofa" && wallBehind(plan, p.it, p.cat))) hits.add("sofaBackWall");

  for (const { it } of placed.filter((p) => p.kind === "mirror")) {
    if (beds.some((b) => inView(it, [b.it.x, b.it.z], 5))) hits.add("mirrorFacesBed");
    if (doorList.some((d) => inView(it, d.at, 4))) hits.add("mirrorFacesDoor");
  }

  const plantCount = placed.filter((p) => p.kind === "plant").length;
  if (placed.some((p) => p.cat.light)) hits.add("lights");

  const floorArea = Math.abs(polygonArea(zone.polygon));
  const floorItems = placed.filter((p) => p.cat.mount === "floor" && !p.cat.flat && !p.it.on);
  const covered = floorItems.reduce((s, p) => s + p.cat.size.w * p.cat.size.d, 0);
  if (floorArea > 0) {
    const ratio = covered / floorArea;
    if (ratio > 0.45) hits.add("crowded");
    else if (ratio < 0.3 && floorItems.length >= 3) hits.add("spacious");
  }

  const reasons: FengShuiReason[] = [...hits].map((rule) => ({ rule, points: RULE_POINTS[rule] }));
  if (plantCount) reasons.push({ rule: "plants", points: Math.min(plantCount * RULE_POINTS.plants, MAX_PLANT_POINTS) });
  reasons.sort((a, b) => b.points - a.points);
  const score = Math.max(0, Math.min(100, BASE_SCORE + reasons.reduce((s, r) => s + r.points, 0)));
  return { zoneId: zone.id, base: BASE_SCORE, score, grade: gradeOf(score), reasons, items: placed.length };
}

/** Score every room; the home scores the average of the rooms that have furniture (BASE_SCORE when none do). */
export function homeFengShui(plan: Plan, items: DItem[], catalog: (id: string) => CatalogItem | undefined): HomeFengShui {
  const rooms = plan.zones.map((z) => roomFengShui(plan, z, items, catalog));
  const furnished = rooms.filter((r) => r.items > 0);
  const score = furnished.length ? Math.round(furnished.reduce((s, r) => s + r.score, 0) / furnished.length) : BASE_SCORE;
  return { score, grade: gradeOf(score), rooms, scored: furnished.length };
}
