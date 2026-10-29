export type Lang = "en" | "th" | "zh";
export type Text = Record<Lang, string>;
export type XZ = [number, number];

/**
 * Coordinate conventions (same as the showroom planner)
 * - Floor is the XZ plane at y=0, metres, Y up.
 * - Walls are centre-lines of thickness WALL_T. A wall a→b has dir = (b-a)/len and
 *   normal = (-dir.z, dir.x); side +1 is the face on the normal side, side -1 the other face.
 * - Item local front faces +Z; rotating by θ about Y gives front = (sin θ, cos θ).
 * - Item position is the bottom-centre of its box.
 */

export type ZoneKind = "room" | "kitchen" | "bath" | "balcony";

export interface Zone {
  id: string;
  name: Text;
  kind: ZoneKind;
  /** Axis-aligned polygon on wall centre-lines, clockwise or counter-clockwise. */
  polygon: XZ[];
}

export type OpeningType = "door" | "window" | "slider";

export interface OpeningSpec {
  type: OpeningType;
  /** A point on the wall centre-line at the middle of the opening. */
  at: XZ;
  width: number;
  height?: number;
  sill?: number;
}

export type FixtureType = "kitchen" | "basin" | "toilet" | "shower" | "fridge";

export interface Fixture {
  id: string;
  type: FixtureType;
  x: number;
  z: number;
  rot: number;
  w: number;
  d: number;
  h: number;
}

export interface PlanSpec {
  id: string;
  name: Text;
  /** Sales area in m², null for the empty room. */
  area: number | null;
  zones: Zone[];
  /** Centre-line segments between zones that have no wall (open-plan). */
  open?: [XZ, XZ][];
  openings: OpeningSpec[];
  fixtures: Fixture[];
  ceiling: number;
  resizable?: { w: number; d: number };
}

export interface Opening {
  type: OpeningType;
  offset: number; // metres from wall start
  width: number;
  height: number;
  sill: number;
}

export interface PlanWall {
  id: string;
  a: XZ;
  b: XZ;
  kind: "solid" | "railing";
  exterior: boolean;
  openings: Opening[];
  /** Zone ids on the +normal and -normal side (null = outside). */
  sides: [string | null, string | null];
}

export interface DimRun {
  a: XZ;
  b: XZ;
  /** Unit normal pointing out of the plan. */
  out: XZ;
}

export interface Plan {
  spec: PlanSpec;
  zones: Zone[];
  walls: PlanWall[];
  fixtures: Fixture[];
  outline: DimRun[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export type Mount = "floor" | "wall" | "ceiling";
export type Category = "bedroom" | "storage" | "seating" | "tables" | "decor" | "wall" | "ceiling";

export interface CatalogColor {
  id: string;
  hex: string;
  name: Text;
}

/** Shaped like the future catalog API response item. */
export interface CatalogItem {
  id: string;
  category: Category;
  mount: Mount;
  name: Text;
  size: { w: number; d: number; h: number };
  colors: CatalogColor[];
  /** Small items can stand on it. */
  surface?: boolean;
  /** Can stand on a surface item. */
  stackable?: boolean;
  /** Lies flat on the floor (rugs); only walls block it. */
  flat?: boolean;
  /** Default bottom height for wall items. */
  mountHeight?: number;
  light?: boolean;
  model: { template: string; params?: Record<string, number | string | boolean> };
  hidden?: boolean;
}

export interface DItem {
  uid: string;
  itemId: string;
  colorId: string;
  x: number;
  /** Bottom height: 0 on the floor, surface top when stacked, mount height on a wall, ceiling - h for ceiling items. */
  y: number;
  z: number;
  rot: number;
  wallId?: string;
  side?: 1 | -1;
  /** uid of the item this one stands on. */
  on?: string;
  locked?: boolean;
}

export type FloorMat = "wood" | "tile" | "marble" | "concrete" | "carpet";
export type WallMat = "paint" | "stripes" | "brick" | "panel" | "subway" | "concrete";

export interface DesignDoc {
  id: string;
  planId: string;
  name: string;
  items: DItem[];
  floor: { material: FloorMat; color: string };
  wall: { material: WallMat; color: string };
  ceiling: number;
  /** Empty-room plan only. */
  size?: { w: number; d: number };
  updatedAt: string;
}
