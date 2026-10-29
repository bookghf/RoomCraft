"use client";

import type { ReactNode } from "react";
import { Ball, Block, Cyl, Legs, mix, rand, shade } from "./parts";

/** Procedural furniture shapes, built from three.js primitives (no third-party models). */
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

interface ShapeProps {
  w: number;
  d: number;
  h: number;
  c: string;
}

const LINEN = "#f4f1eb";
const DARK_WOOD = "#3b2b20";
const METAL = "#2b2b2b";
const SHADE_FABRIC = "#f3ede2";
const WARM = "#ffd9a0";

function Bed({ w, d, h, c }: ShapeProps) {
  const pillows = w > 1.2 ? 2 : 1;
  const pw = (w - 0.2) / pillows - 0.05;
  const textile = mix(c, LINEN, 0.75);
  return (
    <>
      <Legs w={w} d={d} h={0.08} inset={0.06} r={0.025} color={shade(c, -0.15)} />
      <Block size={[w, 0.22, d]} position={[0, 0.19, 0]} radius={0.02} color={c} />
      <Block size={[w, h, 0.07]} position={[0, h / 2, -d / 2 + 0.035]} radius={0.025} color={c} />
      <Block size={[w - 0.06, 0.2, d - 0.1]} position={[0, 0.4, 0.03]} radius={0.05} color={LINEN} roughness={0.95} />
      <Block size={[w + 0.01, 0.1, d * 0.62]} position={[0, 0.47, d / 2 - d * 0.31 + 0.005]} radius={0.04} color={textile} roughness={1} />
      {Array.from({ length: pillows }, (_, i) => (
        <Block
          key={i}
          size={[pw, 0.12, 0.36]}
          position={[-((pillows - 1) * (pw + 0.05)) / 2 + i * (pw + 0.05), 0.56, -d / 2 + 0.3]}
          radius={0.055}
          color={LINEN}
          roughness={1}
        />
      ))}
    </>
  );
}

function Sofa({ w, d, h, c, seats }: ShapeProps & { seats?: number }) {
  const armW = seats === 1 ? 0.14 : 0.16;
  const n = seats ?? (w > 1.8 ? 3 : 2);
  const inner = w - armW * 2;
  const cw = inner / n - 0.012;
  const cushion = shade(c, 0.03);
  return (
    <>
      <Legs w={w} d={d} h={0.08} inset={0.07} r={0.022} color={DARK_WOOD} />
      <Block size={[w, 0.3, d]} position={[0, 0.23, 0]} radius={0.03} color={c} roughness={0.95} />
      <Block size={[w, h - 0.08, 0.2]} position={[0, 0.08 + (h - 0.08) / 2, -d / 2 + 0.1]} radius={0.05} color={c} roughness={0.95} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[armW, 0.52, d]} position={[s * (w / 2 - armW / 2), 0.08 + 0.26, 0]} radius={0.06} color={c} roughness={0.95} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const x = -inner / 2 + (i + 0.5) * (inner / n);
        return (
          <group key={i}>
            <Block size={[cw, 0.14, d - 0.24]} position={[x, 0.45, 0.1]} radius={0.05} color={cushion} roughness={1} />
            <Block size={[cw, 0.36, 0.16]} position={[x, 0.62, -d / 2 + 0.28]} radius={0.06} color={cushion} roughness={1} />
          </group>
        );
      })}
    </>
  );
}

function Chair({ w, d, h, c }: ShapeProps) {
  const seatY = 0.45;
  return (
    <>
      <Legs w={w} d={d} h={seatY - 0.02} inset={0.03} r={0.016} color={c} />
      {[-1, 1].map((s) => (
        <Cyl key={s} r={0.016} h={h - seatY} position={[s * (w / 2 - 0.03), seatY + (h - seatY) / 2, -d / 2 + 0.03]} color={c} segments={12} />
      ))}
      <Block size={[w, 0.04, d]} position={[0, seatY, 0]} radius={0.012} color={c} />
      <Block size={[w - 0.04, 0.2, 0.025]} position={[0, h - 0.12, -d / 2 + 0.03]} radius={0.01} color={c} />
    </>
  );
}

function Table({ w, d, h, c }: ShapeProps) {
  return (
    <>
      <Legs w={w} d={d} h={h - 0.04} inset={0.07} r={0.025} color={c} square />
      <Block size={[w, 0.04, d]} position={[0, h - 0.02, 0]} radius={0.01} color={c} roughness={0.55} />
    </>
  );
}

function Desk({ w, d, h, c }: ShapeProps) {
  const unitW = Math.min(0.4, w * 0.35);
  const ux = w / 2 - unitW / 2 - 0.02;
  const uh = h - 0.04;
  return (
    <>
      <Block size={[w, 0.03, d]} position={[0, h - 0.015, 0]} radius={0.008} color={c} roughness={0.55} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.04, uh, 0.04]} position={[-w / 2 + 0.05, uh / 2, s * (d / 2 - 0.05)]} color={c} />
      ))}
      <Block size={[unitW, uh, d - 0.04]} position={[ux, uh / 2, 0]} color={c} />
      {[0, 1, 2].map((i) => {
        const fh = uh / 3;
        const y = fh * i + fh / 2;
        return (
          <group key={i}>
            <Block size={[unitW - 0.02, fh - 0.015, 0.012]} position={[ux, y, d / 2 - 0.02 + 0.006]} color={shade(c, 0.03)} />
            <Block size={[0.1, 0.012, 0.012]} position={[ux, y + fh * 0.25, d / 2 - 0.005]} color={METAL} metalness={0.6} roughness={0.4} />
          </group>
        );
      })}
    </>
  );
}

function CoffeeTable({ w, d, h, c }: ShapeProps) {
  const legs = [0, 1, 2, 3].map((i) => {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    return [Math.cos(a) * (w / 2 - 0.08), Math.sin(a) * (d / 2 - 0.08)] as const;
  });
  return (
    <>
      <group scale={[w, 1, d]}>
        <Cyl r={0.5} h={0.035} position={[0, h - 0.0175, 0]} color={c} roughness={0.5} segments={48} />
        <Cyl r={0.42} h={0.02} position={[0, 0.12, 0]} color={c} roughness={0.6} segments={48} />
      </group>
      {legs.map(([x, z], i) => (
        <Cyl key={i} r={0.02} h={h - 0.035} position={[x, (h - 0.035) / 2, z]} color={c} segments={12} />
      ))}
    </>
  );
}

function Wardrobe({ w, d, h, c }: ShapeProps) {
  const bodyH = h - 0.06;
  return (
    <>
      <Block size={[w - 0.04, 0.06, d - 0.04]} position={[0, 0.03, 0]} color={shade(c, -0.12)} />
      <Block size={[w, bodyH, d - 0.02]} position={[0, 0.06 + bodyH / 2, -0.01]} radius={0.01} color={c} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[w / 2 - 0.008, bodyH - 0.02, 0.02]} position={[s * (w / 4), 0.06 + bodyH / 2, d / 2 - 0.01]} color={shade(c, 0.02)} radius={0.004} />
          <Cyl r={0.008} h={0.28} position={[s * 0.035, 0.06 + bodyH * 0.55, d / 2 + 0.015]} color={METAL} metalness={0.7} roughness={0.35} segments={10} />
        </group>
      ))}
    </>
  );
}

function Drawers({ w, d, h, c, rows, cols, legH }: ShapeProps & { rows: number; cols: number; legH: number }) {
  const bodyH = h - legH;
  const fh = bodyH / rows;
  const fw = w / cols;
  return (
    <>
      <Legs w={w} d={d} h={legH} inset={0.04} r={0.018} color={shade(c, -0.15)} />
      <Block size={[w, bodyH, d - 0.015]} position={[0, legH + bodyH / 2, -0.0075]} radius={0.008} color={c} />
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const k = i % cols;
        const x = -w / 2 + fw * (k + 0.5);
        const y = legH + fh * (r + 0.5);
        return (
          <group key={i}>
            <Block size={[fw - 0.012, fh - 0.012, 0.015]} position={[x, y, d / 2 - 0.0075]} color={shade(c, 0.025)} radius={0.004} />
            <Ball r={0.013} position={[x, y, d / 2 + 0.008]} color={METAL} metalness={0.7} roughness={0.35} />
          </group>
        );
      })}
    </>
  );
}

const BOOK_COLORS = ["#8c3b2e", "#2e4a62", "#d6b45c", "#56704f", "#e8e2d4", "#6b4a6b", "#c98b6b"];

function Bookcase({ w, d, h, c }: ShapeProps) {
  const t = 0.02;
  const shelves = 5;
  const gap = (h - t) / shelves;
  return (
    <>
      {[-1, 1].map((s) => (
        <Block key={s} size={[t, h, d]} position={[s * (w / 2 - t / 2), h / 2, 0]} color={c} />
      ))}
      <Block size={[w, h, 0.01]} position={[0, h / 2, -d / 2 + 0.005]} color={shade(c, -0.06)} />
      {Array.from({ length: shelves + 1 }, (_, i) => (
        <Block key={i} size={[w - 2 * t, t, d - 0.01]} position={[0, t / 2 + i * gap, 0.005]} color={c} />
      ))}
      {Array.from({ length: shelves }, (_, s) => {
        const books: ReactNode[] = [];
        let x = -w / 2 + t + 0.02;
        const limit = w / 2 - t - 0.02 - (rand(s) > 0.5 ? w * 0.35 : 0.05);
        let i = 0;
        while (x < limit) {
          const seed = s * 31 + i;
          const bw = 0.025 + rand(seed) * 0.025;
          const bh = gap * (0.55 + rand(seed + 7) * 0.3);
          books.push(
            <Block key={i} size={[bw, bh, d * 0.75]} position={[x + bw / 2, t + s * gap + bh / 2, 0.005]} color={BOOK_COLORS[Math.floor(rand(seed + 3) * BOOK_COLORS.length)]} roughness={0.9} />,
          );
          x += bw + 0.003;
          i++;
        }
        return <group key={s}>{books}</group>;
      })}
    </>
  );
}

function Shelf({ w, d, h, c }: ShapeProps) {
  return (
    <>
      <Block size={[w, h, d]} position={[0, h / 2, 0]} radius={0.006} color={c} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.02, 0.14, d * 0.85]} position={[s * (w / 2 - 0.1), -0.07, -d * 0.07]} color={METAL} metalness={0.5} roughness={0.4} />
      ))}
      <Cyl r={0.04} r2={0.035} h={0.16} position={[-w / 2 + 0.12, h + 0.08, 0]} color="#e6e0d6" roughness={0.4} />
      {[0, 1, 2].map((i) => (
        <Block key={i} size={[0.03, 0.2 - i * 0.02, d * 0.7]} position={[0.05 + i * 0.033, h + 0.1 - i * 0.01, 0]} color={BOOK_COLORS[i + 1]} />
      ))}
      <Cyl r={0.045} r2={0.035} h={0.08} position={[w / 2 - 0.12, h + 0.04, 0]} color="#b7653f" />
      <Ball r={0.06} position={[w / 2 - 0.12, h + 0.13, 0]} color="#5f7f4d" flat />
    </>
  );
}

function FloorLamp({ w, h, c }: ShapeProps) {
  return (
    <>
      <Cyl r={w * 0.38} h={0.03} position={[0, 0.015, 0]} color={c} metalness={0.6} roughness={0.35} segments={32} />
      <Cyl r={0.012} h={h - 0.28} position={[0, (h - 0.28) / 2, 0]} color={c} metalness={0.6} roughness={0.35} segments={10} />
      <Cyl r={w * 0.3} r2={w * 0.5} h={0.3} position={[0, h - 0.15, 0]} open color={SHADE_FABRIC} emissive={WARM} emissiveIntensity={0.35} roughness={1} segments={32} />
      <Ball r={0.035} position={[0, h - 0.2, 0]} color="#fff8e8" emissive={WARM} emissiveIntensity={2} />
    </>
  );
}

function TableLamp({ w, h, c }: ShapeProps) {
  return (
    <>
      <Ball r={w * 0.32} position={[0, w * 0.28, 0]} scale={[1, 0.85, 1]} color={c} roughness={0.3} metalness={0.3} />
      <Cyl r={0.008} h={h * 0.35} position={[0, w * 0.5 + h * 0.12, 0]} color={c} metalness={0.6} segments={8} />
      <Cyl r={w * 0.32} r2={w * 0.5} h={h * 0.42} position={[0, h - h * 0.21, 0]} open color={SHADE_FABRIC} emissive={WARM} emissiveIntensity={0.35} roughness={1} segments={32} />
    </>
  );
}

function Pendant({ w, h, c }: ShapeProps) {
  const shadeH = 0.24;
  return (
    <>
      <Cyl r={0.004} h={h - shadeH} position={[0, shadeH + (h - shadeH) / 2, 0]} color="#1e1e1e" segments={6} />
      <Cyl r={0.04} h={0.015} position={[0, h - 0.0075, 0]} color={c} metalness={0.6} roughness={0.3} />
      <Cyl r={0.05} r2={w / 2} h={shadeH} position={[0, shadeH / 2, 0]} open color={c} metalness={0.55} roughness={0.35} segments={36} />
      <Ball r={0.04} position={[0, 0.06, 0]} color="#fff8e8" emissive={WARM} emissiveIntensity={2.5} />
      <pointLight position={[0, 0, 0]} intensity={1.2} distance={4} decay={2} color={WARM} />
    </>
  );
}

function Rug({ w, d, c }: ShapeProps) {
  return (
    <>
      <Block size={[w, 0.012, d]} position={[0, 0.006, 0]} radius={0.004} color={c} roughness={1} />
      <Block size={[w - 0.16, 0.002, d - 0.16]} position={[0, 0.0125, 0]} color={shade(c, -0.08)} roughness={1} />
      <Block size={[w - 0.26, 0.002, d - 0.26]} position={[0, 0.0135, 0]} color={c} roughness={1} />
    </>
  );
}

function Plant({ w, h, c }: ShapeProps) {
  const potH = h * 0.28;
  const leaves = 9;
  return (
    <>
      <Cyl r={w * 0.36} r2={w * 0.28} h={potH} position={[0, potH / 2, 0]} color={c} roughness={0.85} segments={28} />
      <Cyl r={w * 0.33} h={0.01} position={[0, potH - 0.01, 0]} color="#3a2c22" segments={20} />
      <Cyl r={0.018} r2={0.025} h={h * 0.45} position={[0, potH + h * 0.2, 0]} color="#5a4430" segments={8} />
      {Array.from({ length: leaves }, (_, i) => {
        const a = (i / leaves) * Math.PI * 2 + rand(i) * 0.6;
        const rad = w * (0.15 + rand(i + 11) * 0.28);
        const y = potH + h * 0.25 + (i / leaves) * (h * 0.65 - potH) + rand(i + 5) * 0.1;
        const size = w * (0.22 + rand(i + 3) * 0.12);
        return (
          <Ball
            key={i}
            r={size}
            position={[Math.cos(a) * rad, Math.min(y, h - size), Math.sin(a) * rad]}
            scale={[1, 0.75, 1]}
            color={i % 3 === 0 ? "#4f7a3f" : i % 3 === 1 ? "#5f8f4a" : "#3f6633"}
            flat
          />
        );
      })}
    </>
  );
}

function WallArt({ w, d, h, c }: ShapeProps) {
  const z = d / 2;
  const iw = w - 0.1;
  const ih = h - 0.1;
  return (
    <>
      <Block size={[w, h, d]} position={[0, h / 2, 0]} radius={0.004} color="#2f2a26" roughness={0.5} />
      <mesh position={[0, h / 2, z + 0.001]}>
        <planeGeometry args={[w - 0.04, h - 0.04]} />
        <meshStandardMaterial color="#f5f2ec" roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2 + ih * 0.15, z + 0.002]}>
        <planeGeometry args={[iw - 0.06, ih * 0.6]} />
        <meshStandardMaterial color={mix(c, "#ffffff", 0.45)} roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2 - ih * 0.25, z + 0.002]}>
        <planeGeometry args={[iw - 0.06, ih * 0.3]} />
        <meshStandardMaterial color={shade(c, -0.12)} roughness={0.9} />
      </mesh>
      <mesh position={[iw * 0.15, h / 2 + ih * 0.12, z + 0.003]}>
        <circleGeometry args={[ih * 0.14, 32]} />
        <meshStandardMaterial color={c} roughness={0.9} />
      </mesh>
    </>
  );
}

function Mirror({ w, d, h, c }: ShapeProps) {
  return (
    <group position={[0, h / 2, 0]} scale={[w, h, 1]}>
      <Cyl r={0.5} h={d} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} color={c} metalness={0.7} roughness={0.3} segments={48} />
      <Cyl r={0.46} h={d} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.003]} color="#dfe7ec" metalness={1} roughness={0.04} segments={48} />
    </group>
  );
}

const shapes: Record<ShapeKey, (p: ShapeProps) => ReactNode> = {
  bed: Bed,
  wardrobe: Wardrobe,
  dresser: (p) => <Drawers {...p} rows={3} cols={2} legH={0.1} />,
  nightstand: (p) => <Drawers {...p} rows={2} cols={1} legH={0.12} />,
  bookcase: Bookcase,
  shelf: Shelf,
  "floor-lamp": FloorLamp,
  "table-lamp": TableLamp,
  pendant: Pendant,
  rug: Rug,
  plant: Plant,
  "wall-art": WallArt,
  mirror: Mirror,
  table: Table,
  desk: Desk,
  "coffee-table": CoffeeTable,
  chair: Chair,
  armchair: (p) => <Sofa {...p} seats={1} />,
  sofa: (p) => <Sofa {...p} />,
};

/** A shape sized to w×d×h metres. Origin at bottom-centre, front facing +Z. */
export function ShapeModel({ shape, w, d, h, color }: { shape: ShapeKey; w: number; d: number; h: number; color: string }) {
  const Shape = shapes[shape];
  return <group>{Shape({ w, d, h, c: color })}</group>;
}
