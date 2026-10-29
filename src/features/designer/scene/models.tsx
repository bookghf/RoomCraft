"use client";

import { Edges } from "@react-three/drei";
import type { ReactNode } from "react";
import type { CatalogItem, Fixture } from "@/features/designer/types";
import { Ball, Block, Cyl, Legs, shade } from "./parts";
import { ShapeModel, type ShapeKey } from "./shapes";

const METAL = "#2b2b2b";
const CHROME = "#c9ccd0";
const SHADE_FABRIC = "#f3ede2";
const WARM = "#ffd9a0";
const GLASS = "#cfe3ef";

interface P {
  w: number;
  d: number;
  h: number;
  c: string;
  glow: number;
  params: Record<string, number | string | boolean>;
}

function Drawers({ w, d, h, c, params }: P) {
  const rows = Number(params.rows ?? 3);
  const cols = Number(params.cols ?? 1);
  const legH = Number(params.legH ?? 0.1);
  const bodyH = h - legH;
  const fh = bodyH / rows;
  const fw = w / cols;
  return (
    <>
      <Legs w={w} d={d} h={legH} inset={0.04} r={0.018} color={shade(c, -0.15)} />
      <Block size={[w, bodyH, d - 0.015]} position={[0, legH + bodyH / 2, -0.0075]} radius={0.008} color={c} />
      {Array.from({ length: rows * cols }, (_, i) => {
        const x = -w / 2 + fw * ((i % cols) + 0.5);
        const y = legH + fh * (Math.floor(i / cols) + 0.5);
        return (
          <group key={i}>
            <Block size={[fw - 0.012, fh - 0.012, 0.015]} position={[x, y, d / 2 - 0.0075]} color={shade(c, 0.025)} radius={0.004} />
            <Block size={[Math.min(0.12, fw * 0.3), 0.012, 0.014]} position={[x, y + fh * 0.22, d / 2 + 0.006]} color={METAL} metalness={0.6} roughness={0.4} />
          </group>
        );
      })}
    </>
  );
}

function Wardrobe({ w, d, h, c, params }: P) {
  const doors = Number(params.doors ?? 2);
  const sliding = !!params.sliding;
  const mirror = !!params.mirror;
  const bodyH = h - 0.06;
  const dw = w / doors;
  return (
    <>
      <Block size={[w - 0.04, 0.06, d - 0.04]} position={[0, 0.03, 0]} color={shade(c, -0.12)} />
      <Block size={[w, bodyH, d - 0.02]} position={[0, 0.06 + bodyH / 2, -0.01]} radius={0.01} color={c} />
      {Array.from({ length: doors }, (_, i) => {
        const x = -w / 2 + dw * (i + 0.5);
        const z = sliding ? d / 2 - 0.01 - (i % 2) * 0.025 : d / 2 - 0.01;
        const doorW = sliding ? dw + 0.03 : dw - 0.008;
        return (
          <group key={i}>
            <Block size={[doorW, bodyH - 0.02, 0.02]} position={[x, 0.06 + bodyH / 2, z]} color={shade(c, 0.02)} radius={0.004} />
            {mirror && i === 0 && <Block size={[doorW - 0.08, bodyH - 0.2, 0.004]} position={[x, 0.06 + bodyH / 2, z + 0.012]} color="#dfe7ec" metalness={1} roughness={0.05} />}
            {sliding ? (
              <Block size={[0.02, 0.4, 0.012]} position={[x + (i % 2 ? -1 : 1) * (doorW / 2 - 0.05), 0.06 + bodyH * 0.5, z + 0.016]} color={METAL} metalness={0.6} roughness={0.4} />
            ) : (
              <Cyl r={0.008} h={0.26} position={[x + ((i % 2 ? -1 : 1) * dw) / 2 - (i % 2 ? -1 : 1) * 0.05, 0.06 + bodyH * 0.55, z + 0.022]} color={METAL} metalness={0.7} roughness={0.35} segments={10} />
            )}
          </group>
        );
      })}
    </>
  );
}

function Rack({ w, d, h, c }: P) {
  const hangers = ["#d8cbb3", "#8a9fb3", "#c46e4b", "#f2f0eb", "#4a4a48", "#8fa58a"];
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Cyl r={0.012} h={h} position={[s * (w / 2 - 0.02), h / 2, 0]} color={c} metalness={0.5} roughness={0.4} segments={10} />
          <Block size={[0.03, 0.02, d]} position={[s * (w / 2 - 0.02), 0.01, 0]} color={c} metalness={0.5} roughness={0.4} />
        </group>
      ))}
      <Cyl r={0.012} h={w - 0.04} rotation={[0, 0, Math.PI / 2]} position={[0, h - 0.02, 0]} color={c} metalness={0.5} roughness={0.4} segments={10} />
      <Block size={[w - 0.04, 0.02, d - 0.06]} position={[0, 0.2, 0]} color={c} />
      {hangers.map((hc, i) => (
        <Block key={i} size={[0.05, h * 0.5, d * 0.7]} position={[-w / 2 + 0.15 + i * ((w - 0.3) / (hangers.length - 1)), h - 0.06 - h * 0.25, 0]} color={hc} roughness={1} radius={0.015} />
      ))}
    </>
  );
}

function DressingTable({ w, d, h, c }: P) {
  const top = 0.76;
  return (
    <>
      <Legs w={w} d={d} h={top - 0.03} inset={0.04} r={0.02} color={c} square />
      <Block size={[w, 0.03, d]} position={[0, top - 0.015, 0]} radius={0.008} color={c} />
      <Block size={[w * 0.4, 0.12, d - 0.06]} position={[0, top - 0.09, 0]} color={shade(c, 0.03)} />
      <Block size={[w * 0.55, h - top - 0.02, 0.03]} position={[0, top + (h - top) / 2, -d / 2 + 0.05]} radius={0.01} color={c} />
      <Block size={[w * 0.48, h - top - 0.1, 0.005]} position={[0, top + (h - top) / 2, -d / 2 + 0.068]} color="#dfe7ec" metalness={1} roughness={0.05} />
    </>
  );
}

function OfficeChair({ w, d, h, c }: P) {
  const seatY = 0.48;
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return <Block key={i} size={[0.03, 0.03, w / 2 - 0.02]} position={[Math.sin(a) * (w / 4), 0.06, Math.cos(a) * (w / 4)]} rotation={[0, a, 0]} color={METAL} />;
      })}
      <Cyl r={0.025} h={seatY - 0.1} position={[0, 0.06 + (seatY - 0.1) / 2, 0]} color={CHROME} metalness={0.8} roughness={0.3} segments={12} />
      <Block size={[w * 0.8, 0.08, d * 0.75]} position={[0, seatY, 0.03]} radius={0.03} color={c} roughness={0.95} />
      <Block size={[w * 0.75, h - seatY - 0.08, 0.06]} position={[0, seatY + (h - seatY) / 2 + 0.02, -d * 0.33]} rotation={[-0.12, 0, 0]} radius={0.03} color={c} roughness={0.95} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.04, 0.03, d * 0.4]} position={[s * w * 0.42, seatY + 0.2, 0]} color={METAL} />
      ))}
    </>
  );
}

function Stool({ w, h, c, params }: P) {
  const bar = !!params.bar;
  return (
    <>
      <Cyl r={w / 2} h={0.04} position={[0, h - 0.02, 0]} color={c} roughness={0.6} segments={28} />
      {Array.from({ length: bar ? 4 : 3 }, (_, i) => {
        const a = (i / (bar ? 4 : 3)) * Math.PI * 2;
        const r = w * 0.36;
        return <Cyl key={i} r={0.014} h={h - 0.04} position={[Math.sin(a) * r, (h - 0.04) / 2, Math.cos(a) * r]} color={bar ? METAL : c} segments={10} />;
      })}
      {bar && <Cyl r={w * 0.38} h={0.012} position={[0, h * 0.35, 0]} color={METAL} metalness={0.6} segments={24} open />}
    </>
  );
}

function Bench({ w, d, h, c }: P) {
  return (
    <>
      <Block size={[w, 0.05, d]} position={[0, h - 0.025, 0]} radius={0.01} color={c} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.05, h - 0.05, d - 0.04]} position={[s * (w / 2 - 0.08), (h - 0.05) / 2, 0]} color={shade(c, -0.08)} />
      ))}
    </>
  );
}

function Pouffe({ w, h, c }: P) {
  return (
    <>
      <Cyl r={w / 2} h={h - 0.04} position={[0, (h - 0.04) / 2 + 0.02, 0]} color={c} roughness={1} segments={32} />
      <Cyl r={w / 2 - 0.02} h={0.04} position={[0, h - 0.02, 0]} color={shade(c, 0.04)} roughness={1} segments={32} />
    </>
  );
}

function StandingDesk({ w, d, h, c }: P) {
  return (
    <>
      <Block size={[w, 0.03, d]} position={[0, h - 0.015, 0]} radius={0.008} color={c} roughness={0.55} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[0.06, h - 0.03, 0.06]} position={[s * (w / 2 - 0.12), (h - 0.03) / 2, 0]} color={METAL} metalness={0.4} />
          <Block size={[0.06, 0.03, d - 0.05]} position={[s * (w / 2 - 0.12), 0.015, 0]} color={METAL} metalness={0.4} />
        </group>
      ))}
      <Block size={[w - 0.3, 0.04, 0.04]} position={[0, h - 0.06, -d / 2 + 0.1]} color={METAL} />
    </>
  );
}

function DeskShelves({ w, d, h, c }: P) {
  const top = 0.75;
  const shelfD = 0.22;
  return (
    <>
      <Legs w={w} d={d} h={top - 0.03} inset={0.04} r={0.02} color={c} square />
      <Block size={[w, 0.03, d]} position={[0, top - 0.015, 0]} radius={0.008} color={c} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.02, h - top, shelfD]} position={[s * (w / 2 - 0.01), top + (h - top) / 2, -d / 2 + shelfD / 2]} color={c} />
      ))}
      {[0.32, h - top - 0.01].map((y, i) => (
        <Block key={i} size={[w - 0.04, 0.02, shelfD]} position={[0, top + y, -d / 2 + shelfD / 2]} color={c} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Block key={`b${i}`} size={[0.03, 0.22 - i * 0.02, 0.16]} position={[-w / 2 + 0.12 + i * 0.035, top + 0.34 + (0.22 - i * 0.02) / 2, -d / 2 + 0.11]} color={["#8c3b2e", "#2e4a62", "#d6b45c", "#56704f"][i]} />
      ))}
    </>
  );
}

function Vase({ w, h, c }: P) {
  return (
    <>
      <Cyl r={w * 0.35} r2={w * 0.5} h={h * 0.75} position={[0, h * 0.375, 0]} color={c} roughness={0.3} segments={24} />
      <Cyl r={w * 0.22} r2={w * 0.35} h={h * 0.25} position={[0, h * 0.875, 0]} color={c} roughness={0.3} segments={24} />
      {[-1, 0, 1].map((i) => (
        <Ball key={i} r={0.03} position={[i * 0.025, h + 0.05 + Math.abs(i) * 0.02, 0]} color={i ? "#e8b4b8" : "#f2d16b"} />
      ))}
    </>
  );
}

function FloorLamp({ w, h, c, glow }: P) {
  return (
    <>
      <Cyl r={w * 0.38} h={0.03} position={[0, 0.015, 0]} color={c} metalness={0.6} roughness={0.35} segments={32} />
      <Cyl r={0.012} h={h - 0.28} position={[0, (h - 0.28) / 2, 0]} color={c} metalness={0.6} roughness={0.35} segments={10} />
      <Cyl r={w * 0.3} r2={w * 0.5} h={0.3} position={[0, h - 0.15, 0]} open color={SHADE_FABRIC} emissive={WARM} emissiveIntensity={0.3 + glow * 1.4} roughness={1} segments={32} />
      <Ball r={0.035} position={[0, h - 0.2, 0]} color="#fff8e8" emissive={WARM} emissiveIntensity={1 + glow * 3} />
    </>
  );
}

function TableLamp({ w, h, c, glow }: P) {
  return (
    <>
      <Ball r={w * 0.32} position={[0, w * 0.28, 0]} scale={[1, 0.85, 1]} color={c} roughness={0.3} metalness={0.3} />
      <Cyl r={0.008} h={h * 0.35} position={[0, w * 0.5 + h * 0.12, 0]} color={c} metalness={0.6} segments={8} />
      <Cyl r={w * 0.32} r2={w * 0.5} h={h * 0.42} position={[0, h - h * 0.21, 0]} open color={SHADE_FABRIC} emissive={WARM} emissiveIntensity={0.3 + glow * 1.4} roughness={1} segments={32} />
    </>
  );
}

function WallShelf({ w, d, h, c }: P) {
  return (
    <>
      <Block size={[w, 0.025, d]} position={[0, 0.0125, 0]} radius={0.005} color={c} />
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.02, 0.1, d * 0.8]} position={[s * (w / 2 - 0.1), -0.05 + 0.0125, -d * 0.1]} color={METAL} metalness={0.5} roughness={0.4} />
      ))}
      {[0, 1, 2].map((i) => (
        <Block key={i} size={[0.03, h - 0.06 - i * 0.02, d * 0.7]} position={[-w / 2 + 0.12 + i * 0.033, 0.025 + (h - 0.06 - i * 0.02) / 2, 0]} color={["#2e4a62", "#d6b45c", "#8c3b2e"][i]} />
      ))}
      <Cyl r={0.045} r2={0.035} h={0.08} position={[w / 2 - 0.12, 0.065, 0]} color="#b7653f" />
      <Ball r={0.06} position={[w / 2 - 0.12, 0.15, 0]} color="#5f7f4d" flat />
    </>
  );
}

function WallCabinet({ w, d, h, c }: P) {
  return (
    <>
      <Block size={[w, h, d - 0.02]} position={[0, h / 2, -0.01]} radius={0.008} color={c} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Block size={[w / 2 - 0.008, h - 0.02, 0.02]} position={[(s * w) / 4, h / 2, d / 2 - 0.01]} color={shade(c, 0.02)} radius={0.004} />
          <Block size={[0.012, 0.012, 0.1]} position={[s * 0.04, 0.06, d / 2 + 0.006]} rotation={[0, Math.PI / 2, 0]} color={METAL} metalness={0.6} />
        </group>
      ))}
    </>
  );
}

function Tv({ w, d, h, c }: P) {
  return (
    <>
      <Block size={[w, h, d * 0.6]} position={[0, h / 2, -d * 0.2]} radius={0.01} color={c} roughness={0.4} />
      <mesh position={[0, h / 2, d * 0.101]}>
        <planeGeometry args={[w - 0.03, h - 0.03]} />
        <meshStandardMaterial color="#14171c" roughness={0.15} metalness={0.4} />
      </mesh>
    </>
  );
}

function Aircon({ w, d, h, c }: P) {
  return (
    <>
      <Block size={[w, h, d]} position={[0, h / 2, 0]} radius={0.04} color={c} roughness={0.5} />
      <Block size={[w - 0.08, 0.04, 0.02]} position={[0, 0.05, d / 2 - 0.02]} rotation={[0.5, 0, 0]} color={shade(c, -0.08)} />
      <Ball r={0.008} position={[w / 2 - 0.08, h * 0.55, d / 2 + 0.002]} color="#59d18b" emissive="#59d18b" emissiveIntensity={1.5} />
    </>
  );
}

function WallLamp({ w, d, h, c, glow }: P) {
  return (
    <>
      <Block size={[0.08, 0.12, 0.02]} position={[0, h * 0.45, -d / 2 + 0.01]} radius={0.01} color={c} metalness={0.6} roughness={0.3} />
      <Cyl r={0.01} h={d * 0.6} rotation={[Math.PI / 2, 0, 0]} position={[0, h * 0.45, -d * 0.1]} color={c} metalness={0.6} segments={8} />
      <Cyl r={w * 0.28} r2={w * 0.48} h={h * 0.55} position={[0, h * 0.55, d * 0.15]} open color={SHADE_FABRIC} emissive={WARM} emissiveIntensity={0.3 + glow * 1.4} roughness={1} segments={24} />
    </>
  );
}

function Pendant({ w, h, c, glow }: P) {
  const shadeH = 0.24;
  return (
    <>
      <Cyl r={0.004} h={h - shadeH} position={[0, shadeH + (h - shadeH) / 2, 0]} color="#1e1e1e" segments={6} />
      <Cyl r={0.04} h={0.015} position={[0, h - 0.0075, 0]} color={c} metalness={0.6} roughness={0.3} />
      <Cyl r={0.05} r2={w / 2} h={shadeH} position={[0, shadeH / 2, 0]} open color={c} metalness={0.55} roughness={0.35} segments={36} />
      <Ball r={0.04} position={[0, 0.06, 0]} color="#fff8e8" emissive={WARM} emissiveIntensity={1 + glow * 3} />
    </>
  );
}

function CeilingLamp({ w, h, c, glow }: P) {
  return (
    <>
      <Cyl r={w / 2} h={0.03} position={[0, h - 0.015, 0]} color={c} metalness={0.4} roughness={0.4} segments={36} />
      <mesh position={[0, (h - 0.03) / 2, 0]} scale={[1, (h - 0.03) / (w * 0.45), 1]}>
        <sphereGeometry args={[w * 0.45, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#fffaf0" emissive={WARM} emissiveIntensity={0.4 + glow * 1.6} roughness={0.6} />
      </mesh>
    </>
  );
}

function Fan({ w, h, c }: P) {
  return (
    <>
      <Cyl r={0.012} h={h - 0.1} position={[0, 0.1 + (h - 0.1) / 2, 0]} color={METAL} segments={8} />
      <Cyl r={0.09} h={0.1} position={[0, 0.08, 0]} color={c} metalness={0.3} roughness={0.4} segments={24} />
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return <Block key={i} size={[w / 2 - 0.08, 0.012, 0.12]} position={[Math.cos(a) * (w / 4 + 0.04), 0.07, -Math.sin(a) * (w / 4 + 0.04)]} rotation={[0.08, a, 0]} color={c} radius={0.005} />;
      })}
    </>
  );
}

const templates: Record<string, (p: P) => ReactNode> = {
  drawers: Drawers,
  wardrobe: Wardrobe,
  rack: Rack,
  dressingTable: DressingTable,
  officeChair: OfficeChair,
  stool: Stool,
  bench: Bench,
  pouffe: Pouffe,
  standingDesk: StandingDesk,
  deskShelves: DeskShelves,
  vase: Vase,
  floorLamp: FloorLamp,
  tableLamp: TableLamp,
  wallShelf: WallShelf,
  wallCabinet: WallCabinet,
  tv: Tv,
  aircon: Aircon,
  wallLamp: WallLamp,
  pendant: Pendant,
  ceilingLamp: CeilingLamp,
  fan: Fan,
};

/** Model for a catalog item, origin at bottom-centre, front facing +Z. `glow` 0..1 brightens lamps. */
export function DesignerModel({ item, color, glow = 0 }: { item: CatalogItem; color: string; glow?: number }) {
  const { w, d, h } = item.size;
  const params = item.model.params ?? {};
  if (item.model.template === "shape") return <ShapeModel shape={params.shape as ShapeKey} w={w} d={d} h={h} color={color} />;
  const T = templates[item.model.template];
  if (!T) return <Placeholder w={w} d={d} h={h} />;
  return <group>{T({ w, d, h, c: color, glow, params })}</group>;
}

/** Shown for unknown catalog ids (e.g. a saved design from a newer catalog). */
export function Placeholder({ w, d, h }: { w: number; d: number; h: number }) {
  return (
    <mesh position={[0, h / 2, 0]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color="#d0d0d0" transparent opacity={0.6} />
      <Edges color="#888" />
    </mesh>
  );
}

function Kitchen({ w, d, h }: Fixture) {
  const body = "#f1efea";
  const top = "#5b5b58";
  return (
    <>
      <Block size={[w, 0.1, d - 0.06]} position={[0, 0.05, -0.03]} color="#3a3a38" />
      <Block size={[w, h - 0.14, d - 0.02]} position={[0, 0.1 + (h - 0.14) / 2, -0.01]} color={body} />
      {Array.from({ length: Math.max(1, Math.round(w / 0.45)) }, (_, i) => {
        const dw = w / Math.max(1, Math.round(w / 0.45));
        return <Block key={i} size={[dw - 0.01, h - 0.16, 0.015]} position={[-w / 2 + dw * (i + 0.5), 0.1 + (h - 0.14) / 2, d / 2 - 0.01]} color={shade(body, 0.02)} radius={0.003} />;
      })}
      <Block size={[w, 0.04, d]} position={[0, h - 0.02, 0]} color={top} roughness={0.35} />
      <Block size={[0.45, 0.012, 0.36]} position={[-w / 4, h + 0.001, 0]} color={CHROME} metalness={0.8} roughness={0.25} />
      <Cyl r={0.012} h={0.25} position={[-w / 4, h + 0.125, -0.2]} color={CHROME} metalness={0.9} roughness={0.2} segments={10} />
      <Block size={[0.5, 0.01, 0.45]} position={[w / 4, h + 0.001, 0]} color="#151515" roughness={0.2} />
      {[-1, 1].map((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}${sz}`} r={0.07} h={0.004} position={[w / 4 + sx * 0.12, h + 0.008, sz * 0.1]} color="#333" segments={20} />))}
    </>
  );
}

function Basin({ w, d, h }: Fixture) {
  return (
    <>
      <Block size={[w, h - 0.12, d - 0.04]} position={[0, (h - 0.12) / 2 + 0.25, -0.02]} color="#d9cbb5" radius={0.01} />
      <Block size={[w, 0.05, d]} position={[0, h - 0.025, 0]} color="#f7f7f5" radius={0.015} roughness={0.2} />
      <mesh position={[0, h - 0.01, 0.02]} scale={[1, 0.35, 0.8]}>
        <sphereGeometry args={[w * 0.32, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.15} side={2} />
      </mesh>
      <Cyl r={0.012} h={0.18} position={[0, h + 0.09, -d / 2 + 0.06]} color={CHROME} metalness={0.9} roughness={0.2} segments={10} />
    </>
  );
}

function Toilet({ d, h }: Fixture) {
  const white = "#f7f7f5";
  return (
    <>
      <Cyl r={0.13} r2={0.16} h={0.38} position={[0, 0.19, 0.06]} color={white} roughness={0.2} segments={24} />
      <mesh position={[0, 0.4, 0.08]} scale={[1, 0.15, 1.25]}>
        <cylinderGeometry args={[0.18, 0.18, 0.2, 28]} />
        <meshStandardMaterial color={white} roughness={0.2} />
      </mesh>
      <Block size={[0.38, h - 0.4, 0.18]} position={[0, 0.4 + (h - 0.4) / 2, -d / 2 + 0.09]} color={white} radius={0.03} roughness={0.2} />
    </>
  );
}

function Shower({ w, d, h }: Fixture) {
  return (
    <>
      <Block size={[w, 0.05, d]} position={[0, 0.025, 0]} color="#f2f2f0" roughness={0.3} />
      <Cyl r={0.04} h={0.005} position={[0, 0.053, 0]} color={CHROME} metalness={0.9} segments={16} />
      <mesh position={[0, h / 2 + 0.05, d / 2 - 0.005]}>
        <boxGeometry args={[w, h - 0.05, 0.01]} />
        <meshPhysicalMaterial color={GLASS} transparent opacity={0.25} roughness={0.05} />
      </mesh>
      <mesh position={[w / 2 - 0.005, h / 2 + 0.05, 0]}>
        <boxGeometry args={[0.01, h - 0.05, d]} />
        <meshPhysicalMaterial color={GLASS} transparent opacity={0.25} roughness={0.05} />
      </mesh>
      <Cyl r={0.012} h={h - 0.2} position={[-w / 2 + 0.06, (h - 0.2) / 2 + 0.1, -d / 2 + 0.06]} color={CHROME} metalness={0.9} segments={10} />
      <Cyl r={0.1} h={0.02} position={[-w / 2 + 0.2, h - 0.08, -d / 2 + 0.2]} color={CHROME} metalness={0.9} segments={20} />
    </>
  );
}

function Fridge({ w, d, h }: Fixture) {
  const c = "#e7e8ea";
  return (
    <>
      <Block size={[w, h, d]} position={[0, h / 2, 0]} radius={0.02} color={c} metalness={0.3} roughness={0.35} />
      <Block size={[w - 0.01, 0.006, 0.01]} position={[0, h * 0.62, d / 2 + 0.001]} color={shade(c, -0.15)} />
      {[h * 0.8, h * 0.4].map((y, i) => (
        <Block key={i} size={[0.02, 0.25, 0.03]} position={[w / 2 - 0.06, y, d / 2 + 0.015]} color={CHROME} metalness={0.8} roughness={0.25} />
      ))}
    </>
  );
}

const fixtureModels = { kitchen: Kitchen, basin: Basin, toilet: Toilet, shower: Shower, fridge: Fridge };

export function FixtureModel({ fixture }: { fixture: Fixture }) {
  const M = fixtureModels[fixture.type];
  return <group>{M(fixture)}</group>;
}

