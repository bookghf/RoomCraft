import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { FloorMat, WallMat } from "@/features/designer/types";
import { rand } from "@/features/planner/scene/models/parts";

/**
 * Seamless 256 px patterns generated in code (no image files). Patterns are light grey so the
 * chosen colour tints them, and each has a real-world size so it keeps its scale on any surface.
 */

export type PatternKind = FloorMat | WallMat | "bathTile";

export const floorMaterials: FloorMat[] = ["wood", "tile", "marble", "concrete", "carpet"];
export const wallMaterials: WallMat[] = ["paint", "stripes", "brick", "panel", "subway", "concrete"];

export const defaultFloorColor: Record<FloorMat, string> = {
  wood: "#c8a27a",
  tile: "#e6e2dc",
  marble: "#f1efea",
  concrete: "#b9b6b0",
  carpet: "#cfc4b4",
};

export const defaultWallColor: Record<WallMat, string> = {
  paint: "#efebe4",
  stripes: "#dfe6e0",
  brick: "#c97b5a",
  panel: "#c8a27a",
  subway: "#f4f3ef",
  concrete: "#c4c1bb",
};

export const floorSwatches = ["#c8a27a", "#8a6446", "#e6e2dc", "#b9b6b0", "#4a4a48", "#cfc4b4", "#9fb3a0"];
export const wallSwatches = ["#efebe4", "#ffffff", "#dfe6e0", "#e8d9c8", "#c9d4de", "#e7c9c0", "#c97b5a", "#4f5b66"];

/** Fixed finishes: bathrooms keep tiles, balconies keep concrete. */
export const BATH_FLOOR = { kind: "bathTile" as const, color: "#dfe3e6" };
export const BATH_WALL = { kind: "subway" as const, color: "#f4f3ef" };
export const BALCONY_FLOOR = { kind: "concrete" as const, color: "#b9b6b0" };

/** Real-world metres covered by one texture tile. */
export const patternSize: Record<PatternKind, number> = {
  wood: 1.2,
  tile: 1.2,
  marble: 1.6,
  concrete: 2,
  carpet: 1,
  paint: 1,
  stripes: 0.6,
  brick: 0.5,
  panel: 0.6,
  subway: 0.6,
  bathTile: 0.6,
};

const SIZE = 256;
const cache = new Map<PatternKind, CanvasTexture>();

function grey(v: number) {
  const c = Math.max(0, Math.min(255, Math.round(v * 255)));
  return `rgb(${c},${c},${c})`;
}

/** Draw a rect that wraps around the canvas edges so the pattern stays seamless. */
function wrapRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  for (const ox of [-SIZE, 0, SIZE]) for (const oy of [-SIZE, 0, SIZE]) ctx.fillRect(x + ox, y + oy, w, h);
}

function noise(ctx: CanvasRenderingContext2D, count: number, spread: number, base: number, seed: number, dot = 2) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = grey(base + (rand(seed + i) - 0.5) * spread);
    wrapRect(ctx, rand(seed + i * 1.3 + 0.5) * SIZE, rand(seed + i * 2.1 + 0.25) * SIZE, dot, dot);
  }
}

function tiles(ctx: CanvasRenderingContext2D, cols: number, rows: number, offsetRows: boolean, grout: number, base: number) {
  const tw = SIZE / cols;
  const th = SIZE / rows;
  for (let r = 0; r < rows; r++) {
    const off = offsetRows && r % 2 ? tw / 2 : 0;
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = grey(base + (rand(r * 17 + c * 5) - 0.5) * 0.06);
      wrapRect(ctx, c * tw + off + grout / 2, r * th + grout / 2, tw - grout, th - grout);
    }
  }
}

function draw(kind: PatternKind, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = grey(1);
  ctx.fillRect(0, 0, SIZE, SIZE);
  switch (kind) {
    case "paint":
      noise(ctx, 1200, 0.03, 0.98, 1);
      break;
    case "wood": {
      // 8 rows of planks, staggered lengths
      const rows = 8;
      const rh = SIZE / rows;
      ctx.fillStyle = grey(0.72);
      ctx.fillRect(0, 0, SIZE, SIZE);
      for (let r = 0; r < rows; r++) {
        let x = rand(r) * SIZE;
        const start = x;
        let k = 0;
        while (x < start + SIZE) {
          const len = SIZE * (0.35 + rand(r * 13 + k) * 0.4);
          const end = Math.min(x + len, start + SIZE);
          ctx.fillStyle = grey(0.88 + (rand(r * 7 + k * 3) - 0.5) * 0.14);
          wrapRect(ctx, x + 1, r * rh + 1, end - x - 2, rh - 2);
          ctx.fillStyle = grey(0.8);
          for (let g = 0; g < 5; g++) wrapRect(ctx, x + 1, r * rh + 2 + rand(r * 3 + k + g) * (rh - 4), end - x - 2, 1);
          x = end;
          k++;
        }
      }
      break;
    }
    case "tile":
      ctx.fillStyle = grey(0.8);
      ctx.fillRect(0, 0, SIZE, SIZE);
      tiles(ctx, 2, 2, false, 3, 0.97);
      break;
    case "bathTile":
      ctx.fillStyle = grey(0.78);
      ctx.fillRect(0, 0, SIZE, SIZE);
      tiles(ctx, 4, 4, false, 3, 0.97);
      break;
    case "marble": {
      noise(ctx, 900, 0.05, 0.97, 7, 3);
      ctx.strokeStyle = grey(0.8);
      ctx.lineWidth = 1.5;
      for (let v = 0; v < 6; v++) {
        let x = rand(v * 11) * SIZE;
        let y = 0;
        ctx.beginPath();
        ctx.moveTo(x, y);
        while (y < SIZE) {
          y += 12;
          x += (rand(v * 31 + y) - 0.5) * 26;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = grey(0.86);
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, SIZE, SIZE);
      break;
    }
    case "concrete":
      noise(ctx, 5000, 0.12, 0.9, 3, 3);
      noise(ctx, 120, 0.2, 0.82, 9, 6);
      break;
    case "carpet":
      noise(ctx, 9000, 0.16, 0.9, 5, 2);
      break;
    case "stripes": {
      const n = 4;
      const w = SIZE / n;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = grey(i % 2 ? 0.86 : 1);
        ctx.fillRect(i * w, 0, w, SIZE);
      }
      noise(ctx, 600, 0.03, 0.95, 2);
      break;
    }
    case "brick":
      ctx.fillStyle = grey(0.86);
      ctx.fillRect(0, 0, SIZE, SIZE);
      tiles(ctx, 2, 8, true, 6, 0.92);
      noise(ctx, 1500, 0.1, 0.88, 4, 2);
      break;
    case "panel": {
      const n = 4;
      const w = SIZE / n;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = grey(0.88 + (rand(i * 9) - 0.5) * 0.1);
        ctx.fillRect(i * w, 0, w, SIZE);
        ctx.fillStyle = grey(0.68);
        ctx.fillRect(i * w, 0, 3, SIZE);
        ctx.fillStyle = grey(0.82);
        for (let g = 0; g < 4; g++) ctx.fillRect(i * w + 6 + rand(i * 5 + g) * (w - 12), 0, 1, SIZE);
      }
      break;
    }
    case "subway":
      ctx.fillStyle = grey(0.8);
      ctx.fillRect(0, 0, SIZE, SIZE);
      tiles(ctx, 2, 4, true, 4, 0.98);
      break;
  }
}

export function patternTexture(kind: PatternKind): CanvasTexture {
  let tex = cache.get(kind);
  if (tex) return tex;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  draw(kind, canvas.getContext("2d")!);
  tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  // Geometry UVs are in metres, so one repeat covers patternSize metres.
  tex.repeat.set(1 / patternSize[kind], 1 / patternSize[kind]);
  tex.anisotropy = 8;
  cache.set(kind, tex);
  return tex;
}
