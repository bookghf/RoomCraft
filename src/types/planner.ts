export type RoomType = "bedroom" | "living-room" | "dining" | "home-office" | "kids";

export type Vec3 = [number, number, number];

export interface Opening {
  type: "door" | "window";
  offset: number; // metres from wall start
  width: number;
  height: number;
  sill?: number; // height from floor (windows)
}

export interface Wall {
  id: string;
  start: [number, number]; // x,z in metres
  end: [number, number];
  height: number;
  openings?: Opening[];
}

export type FloorMaterial = "oak" | "walnut" | "tile-grey" | "carpet-beige";

export interface Viewpoint {
  id: string;
  label: string;
  position: Vec3;
  target: Vec3;
}

export interface Room {
  id: string;
  type: RoomType;
  name: string;
  description: string;
  thumbnail: string; // CSS gradient used as a placeholder thumbnail
  walls: Wall[];
  floor: { polygon: [number, number][]; material: FloorMaterial };
  wallColor: string;
  viewpoints: Viewpoint[];
  presetDesignId: string;
}

export type ProductCategory =
  | "beds"
  | "storage"
  | "lighting"
  | "textiles"
  | "decor"
  | "tables"
  | "chairs"
  | "sofas";

export type Mount = "floor" | "wall" | "ceiling" | "surface";

/**
 * Procedural shape keys. Furniture is built from three.js primitives
 * (no third-party models), see scene/models/.
 */
export type ShapeKey =
  | "bed"
  | "wardrobe"
  | "dresser"
  | "nightstand"
  | "bookcase"
  | "shelf"
  | "floor-lamp"
  | "table-lamp"
  | "pendant"
  | "rug"
  | "plant"
  | "wall-art"
  | "mirror"
  | "table"
  | "desk"
  | "coffee-table"
  | "chair"
  | "armchair"
  | "sofa";

export interface ProductColor {
  id: string;
  label: string;
  hex: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number; // decimal THB
  currency: "THB";
  shape: ShapeKey;
  dimensions: { w: number; d: number; h: number }; // metres
  mount: Mount;
  colors: ProductColor[]; // first = default
  /** Wall items: height of the item's bottom edge above the floor. */
  mountHeight?: number;
}

export interface PlacedItem {
  uid: string;
  productId: string;
  colorId?: string;
  /**
   * Floor items: [x, 0, z] of bottom-centre.
   * Wall items: [x, y, z] of bottom-centre, flush against a wall, rotationY faces into the room.
   */
  position: Vec3;
  rotationY: number;
}

export interface Design {
  id: string;
  roomId: string;
  items: PlacedItem[];
  wallColor: string;
  floorMaterial: FloorMaterial;
  updatedAt: string;
}
