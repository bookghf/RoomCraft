"use client";

import { RoundedBox } from "@react-three/drei";
import { Color } from "three";

type Vec3 = [number, number, number];

/** Lighten (+) or darken (-) a hex colour in HSL lightness. */
export function shade(hex: string, amount: number): string {
  return `#${new Color(hex).offsetHSL(0, 0, amount).getHexString()}`;
}

export function mix(a: string, b: string, t: number): string {
  return `#${new Color(a).lerp(new Color(b), t).getHexString()}`;
}

/** Deterministic pseudo-random in [0,1) for stable procedural details. */
export function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface MatProps {
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

function Mat({ color, roughness = 0.75, metalness = 0, emissive, emissiveIntensity }: MatProps) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={emissive ?? "#000000"} emissiveIntensity={emissiveIntensity ?? 0} />;
}

/** Box sized [w, h, d] centred at `position`; rounded when `radius` is set. */
export function Block({ size, position, radius, rotation, ...mat }: MatProps & { size: Vec3; position: Vec3; radius?: number; rotation?: Vec3 }) {
  if (radius) {
    return (
      <RoundedBox args={size} radius={Math.min(radius, ...size.map((s) => s / 2 - 0.0005))} smoothness={3} position={position} rotation={rotation} castShadow receiveShadow>
        <Mat {...mat} />
      </RoundedBox>
    );
  }
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Mat {...mat} />
    </mesh>
  );
}

/** Vertical cylinder of height `h` centred at `position`. */
export function Cyl({
  r,
  r2,
  h,
  position,
  rotation,
  open,
  segments = 24,
  ...mat
}: MatProps & { r: number; r2?: number; h: number; position: Vec3; rotation?: Vec3; open?: boolean; segments?: number }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[r, r2 ?? r, h, segments, 1, open]} />
      <Mat {...mat} />
    </mesh>
  );
}

export function Ball({ r, position, scale, flat, ...mat }: MatProps & { r: number; position: Vec3; scale?: Vec3; flat?: boolean }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      {flat ? <icosahedronGeometry args={[r, 1]} /> : <sphereGeometry args={[r, 20, 14]} />}
      <meshStandardMaterial color={mat.color} roughness={mat.roughness ?? 0.8} metalness={mat.metalness ?? 0} flatShading={flat} emissive={mat.emissive ?? "#000000"} emissiveIntensity={mat.emissiveIntensity ?? 0} />
    </mesh>
  );
}

/** Four legs at the corners of a w×d footprint, inset by `inset`. */
export function Legs({ w, d, h, inset = 0.05, r = 0.02, color, square }: { w: number; d: number; h: number; inset?: number; r?: number; color: string; square?: boolean }) {
  const xs = [-w / 2 + inset, w / 2 - inset];
  const zs = [-d / 2 + inset, d / 2 - inset];
  return (
    <>
      {xs.flatMap((x) =>
        zs.map((z) =>
          square ? (
            <Block key={`${x}:${z}`} size={[r * 2, h, r * 2]} position={[x, h / 2, z]} color={color} />
          ) : (
            <Cyl key={`${x}:${z}`} r={r} r2={r * 0.8} h={h} position={[x, h / 2, z]} color={color} segments={12} />
          ),
        ),
      )}
    </>
  );
}
