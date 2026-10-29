"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, Group, RepeatWrapping, Shape, SRGBColorSpace } from "three";
import { roomCenter, wallInfo, type WallInfo } from "@/features/planner/lib/placement";
import { floorMaterials } from "@/features/planner/lib/styles";
import { isWallHidden } from "./dollhouse";
import { usePlannerStore } from "@/features/planner/store/usePlannerStore";
import type { FloorMaterial, Opening, Room } from "@/types/planner";
import { rand, shade } from "./models/parts";

export const WALL_THICKNESS = 0.12;
const TEXTURE_METRES = 2;

/** Wall-local rectangles: u along the wall [0, length], v height. */
interface Segment {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}

function openingBottom(o: Opening) {
  return o.type === "door" ? 0 : (o.sill ?? 0.9);
}

function wallSegments(length: number, height: number, openings: Opening[]): Segment[] {
  const segs: Segment[] = [];
  const sorted = [...openings].sort((a, b) => a.offset - b.offset);
  let cursor = 0;
  for (const o of sorted) {
    const bottom = openingBottom(o);
    const top = Math.min(height, bottom + o.height);
    if (o.offset > cursor) segs.push({ u0: cursor, u1: o.offset, v0: 0, v1: height });
    if (bottom > 0) segs.push({ u0: o.offset, u1: o.offset + o.width, v0: 0, v1: bottom });
    if (top < height) segs.push({ u0: o.offset, u1: o.offset + o.width, v0: top, v1: height });
    cursor = o.offset + o.width;
  }
  if (cursor < length) segs.push({ u0: cursor, u1: length, v0: 0, v1: height });
  // Extend the outer ends so neighbouring walls close the corners.
  for (const s of segs) {
    if (s.u0 <= 1e-6) s.u0 = -WALL_THICKNESS;
    if (s.u1 >= length - 1e-6) s.u1 = length + WALL_THICKNESS;
  }
  return segs;
}

function skirtingRuns(length: number, openings: Opening[]): [number, number][] {
  const doors = openings.filter((o) => o.type === "door").sort((a, b) => a.offset - b.offset);
  const runs: [number, number][] = [];
  let cursor = 0;
  for (const d of doors) {
    if (d.offset > cursor) runs.push([cursor, d.offset]);
    cursor = d.offset + d.width;
  }
  if (cursor < length) runs.push([cursor, length]);
  return runs;
}

function WindowFrame({ o }: { o: Opening }) {
  const bottom = openingBottom(o);
  const cx = o.offset + o.width / 2;
  const cy = bottom + o.height / 2;
  const f = 0.05;
  const z = -WALL_THICKNESS / 2;
  const frame = "#f4f4f2";
  return (
    <group>
      <mesh position={[cx, cy, z]}>
        <planeGeometry args={[o.width, o.height]} />
        <meshPhysicalMaterial color="#cfe3ef" transparent opacity={0.25} roughness={0.05} metalness={0} />
      </mesh>
      {[
        { p: [cx, bottom + o.height - f / 2, z], s: [o.width, f, WALL_THICKNESS * 0.6] },
        { p: [cx, bottom + f / 2, z], s: [o.width, f, WALL_THICKNESS * 0.6] },
        { p: [o.offset + f / 2, cy, z], s: [f, o.height, WALL_THICKNESS * 0.6] },
        { p: [o.offset + o.width - f / 2, cy, z], s: [f, o.height, WALL_THICKNESS * 0.6] },
        { p: [cx, cy, z], s: [f * 0.6, o.height, WALL_THICKNESS * 0.4] },
      ].map((b, i) => (
        <mesh key={i} position={b.p as [number, number, number]} castShadow>
          <boxGeometry args={b.s as [number, number, number]} />
          <meshStandardMaterial color={frame} roughness={0.5} />
        </mesh>
      ))}
      {/* sill board */}
      <mesh position={[cx, bottom - 0.015, 0.03]} castShadow receiveShadow>
        <boxGeometry args={[o.width + 0.1, 0.03, 0.08]} />
        <meshStandardMaterial color={frame} roughness={0.5} />
      </mesh>
    </group>
  );
}

function DoorFrame({ o }: { o: Opening }) {
  const cx = o.offset + o.width / 2;
  const trim = "#f4f4f2";
  const t = 0.06;
  return (
    <group>
      <mesh position={[cx, o.height / 2, -WALL_THICKNESS / 2]} castShadow receiveShadow>
        <boxGeometry args={[o.width - 0.02, o.height - 0.01, 0.04]} />
        <meshStandardMaterial color="#e9e5dd" roughness={0.6} />
      </mesh>
      <mesh position={[o.offset + o.width - 0.1, 1.0, -WALL_THICKNESS / 2 + 0.04]}>
        <boxGeometry args={[0.12, 0.02, 0.04]} />
        <meshStandardMaterial color="#8a8a8a" metalness={0.8} roughness={0.3} />
      </mesh>
      {[
        { p: [o.offset - t / 2, o.height / 2, 0.01], s: [t, o.height + t, 0.02] },
        { p: [o.offset + o.width + t / 2, o.height / 2, 0.01], s: [t, o.height + t, 0.02] },
        { p: [cx, o.height + t / 2, 0.01], s: [o.width + t * 2, t, 0.02] },
      ].map((b, i) => (
        <mesh key={i} position={b.p as [number, number, number]} castShadow>
          <boxGeometry args={b.s as [number, number, number]} />
          <meshStandardMaterial color={trim} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function WallMesh({ info, color, onRef }: { info: WallInfo; color: string; onRef: (g: Group | null) => void }) {
  const { wall } = info;
  const openings = useMemo(() => wall.openings ?? [], [wall.openings]);
  const segs = useMemo(() => wallSegments(info.length, wall.height, openings), [info.length, wall.height, openings]);
  const runs = useMemo(() => skirtingRuns(info.length, openings), [info.length, openings]);
  // Rotate so local +x runs along the wall and local +z is the interior normal.
  const angle = Math.atan2(-info.dir[1], info.dir[0]);
  return (
    <group ref={onRef} position={[info.a[0], 0, info.a[1]]} rotation={[0, angle, 0]}>
      {segs.map((s, i) => (
        <mesh key={i} position={[(s.u0 + s.u1) / 2, (s.v0 + s.v1) / 2, -WALL_THICKNESS / 2]} castShadow receiveShadow>
          <boxGeometry args={[s.u1 - s.u0, s.v1 - s.v0, WALL_THICKNESS]} />
          <meshStandardMaterial color={color} roughness={0.92} />
        </mesh>
      ))}
      {runs.map(([u0, u1], i) => (
        <mesh key={`sk${i}`} position={[(u0 + u1) / 2, 0.04, 0.006]} receiveShadow>
          <boxGeometry args={[u1 - u0, 0.08, 0.012]} />
          <meshStandardMaterial color={shade(color, 0.06)} roughness={0.6} />
        </mesh>
      ))}
      {openings.map((o, i) => (o.type === "window" ? <WindowFrame key={i} o={o} /> : <DoorFrame key={i} o={o} />))}
    </group>
  );
}

function makeFloorTexture(material: FloorMaterial): CanvasTexture {
  const spec = floorMaterials[material];
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = spec.base;
  ctx.fillRect(0, 0, size, size);
  const px = size / TEXTURE_METRES;

  if (spec.pattern === "planks") {
    const plankW = 0.18 * px;
    const rows = Math.round(size / plankW);
    const rowH = size / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand(r) * 1.2 * px;
      let k = 0;
      while (x < size) {
        const len = (0.9 + rand(r * 13 + k) * 0.9) * px;
        ctx.fillStyle = shade(spec.base, (rand(r * 7 + k * 3) - 0.5) * 0.08);
        ctx.fillRect(x, r * rowH, len, rowH);
        // grain
        ctx.strokeStyle = shade(spec.base, -0.06);
        ctx.globalAlpha = 0.25;
        for (let g = 0; g < 4; g++) {
          const y = r * rowH + rowH * (0.2 + rand(r * 5 + k + g) * 0.6);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + len * 0.3, y + 2, x + len * 0.6, y - 2, x + len, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = spec.line;
        ctx.fillRect(x, r * rowH, 2, rowH);
        x += len;
        k++;
      }
      ctx.fillStyle = spec.line;
      ctx.fillRect(0, r * rowH, size, 2);
    }
  } else if (spec.pattern === "tiles") {
    const tile = 0.5 * px;
    for (let i = 0; i * tile < size; i++) {
      for (let j = 0; j * tile < size; j++) {
        ctx.fillStyle = shade(spec.base, (rand(i * 17 + j) - 0.5) * 0.05);
        ctx.fillRect(i * tile, j * tile, tile, tile);
      }
    }
    ctx.fillStyle = spec.line;
    for (let i = 0; i * tile <= size; i++) {
      ctx.fillRect(i * tile - 1.5, 0, 3, size);
      ctx.fillRect(0, i * tile - 1.5, size, 3);
    }
  } else {
    // carpet speckle
    for (let i = 0; i < 24000; i++) {
      ctx.fillStyle = shade(spec.base, (rand(i) - 0.5) * 0.12);
      ctx.fillRect(rand(i + 0.5) * size, rand(i + 0.25) * size, 2, 2);
    }
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(1 / TEXTURE_METRES, 1 / TEXTURE_METRES);
  tex.anisotropy = 8;
  return tex;
}

function Floor({ room, material }: { room: Room; material: FloorMaterial }) {
  const shape = useMemo(() => {
    // Shape lives in XY; rotating -90° about X maps (x, y) -> (x, 0, -y).
    const s = new Shape();
    room.floor.polygon.forEach(([x, z], i) => (i === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)));
    s.closePath();
    return s;
  }, [room.floor.polygon]);
  const texture = useMemo(() => makeFloorTexture(material), [material]);
  useEffect(() => () => texture.dispose(), [texture]);
  const spec = floorMaterials[material];
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial map={texture} roughness={spec.roughness} />
    </mesh>
  );
}

/** Walls, openings and floor generated from the room JSON. Walls between the camera and the room hide (dollhouse view). */
export default function RoomShell() {
  const room = usePlannerStore((s) => s.room);
  const wallColor = usePlannerStore((s) => s.design?.wallColor ?? s.room?.wallColor ?? "#ffffff");
  const floor = usePlannerStore((s) => s.design?.floorMaterial ?? s.room?.floor.material ?? "oak");
  const walls = useMemo(() => room?.walls.map(wallInfo) ?? [], [room]);
  const groups = useRef<(Group | null)[]>([]);

  useFrame(({ camera }) => {
    if (!room) return;
    walls.forEach((info, i) => {
      const g = groups.current[i];
      if (g) g.visible = !isWallHidden(room, info.normal, camera);
    });
  });

  if (!room) return null;
  return (
    <group>
      <Floor room={room} material={floor} />
      {walls.map((info, i) => (
        <WallMesh key={info.wall.id} info={info} color={wallColor} onRef={(g) => (groups.current[i] = g)} />
      ))}
      {/* ground around the room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[roomCenter(room)[0], -0.005, roomCenter(room)[2]]}>
        <circleGeometry args={[40, 48]} />
        <meshStandardMaterial color="#e4e1dc" roughness={1} />
      </mesh>
    </group>
  );
}
