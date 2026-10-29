"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BoxGeometry, Group, MeshStandardMaterial, Shape } from "three";
import { openingTop, polygonArea, polygonBounds, pointInPolygon, RAILING_H, WALL_T, wallGeom, zoneCenter } from "@/features/designer/lib/geometry";
import { BALCONY_FLOOR, BATH_FLOOR, BATH_WALL, patternTexture, type PatternKind } from "@/features/designer/lib/materials";
import { useDesigner } from "@/features/designer/store";
import type { Opening, Plan, PlanWall, Zone } from "@/features/designer/types";
import { onZoneTap } from "./interaction";
import { FixtureModel } from "./models";
import { isolatedZone, sceneRef, wallBlocksView, wallVisible, zoneVisible } from "./sceneRef";

/** Walls folded this frame; wall items on them hide too. */
export const foldedWalls = new Set<string>();

const FOLDED_SCALE = 0.04;
const TRIM = "#f4f4f2";
const EXTERIOR = "#e9e6e1";

const materialCache = new Map<string, MeshStandardMaterial>();
function surfaceMaterial(kind: PatternKind | "plain", color: string, roughness = 0.9): MeshStandardMaterial {
  const key = `${kind}:${color}:${roughness}`;
  let m = materialCache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({ color, roughness, map: kind === "plain" ? null : patternTexture(kind) });
    materialCache.set(key, m);
  }
  return m;
}

const geoCache = new Map<string, BoxGeometry>();
/** Box with UVs in metres (offset by u0/v0) so patterns keep their real size and line up across segments. */
function metricBox(w: number, h: number, d: number, u0: number, v0: number): BoxGeometry {
  const key = [w, h, d, u0, v0].map((v) => v.toFixed(3)).join(":");
  let g = geoCache.get(key);
  if (g) return g;
  g = new BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  for (let face = 0; face < 6; face++) {
    for (let k = 0; k < 4; k++) {
      const i = face * 4 + k;
      const u = uv.getX(i);
      const v = uv.getY(i);
      if (face === 4) uv.setXY(i, u0 + u * w, v0 + v * h);
      else if (face === 5) uv.setXY(i, u0 + (1 - u) * w, v0 + v * h);
      else if (face < 2) uv.setXY(i, u * d, v0 + v * h);
      else uv.setXY(i, u0 + u * w, v * d);
    }
  }
  uv.needsUpdate = true;
  geoCache.set(key, g);
  return g;
}

interface Segment {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}

/** Solid wall pieces around openings, in wall-local (u along, v up) metres. */
function wallSegments(length: number, height: number, openings: Opening[], ceiling: number): Segment[] {
  const segs: Segment[] = [];
  let cursor = 0;
  for (const o of [...openings].sort((a, b) => a.offset - b.offset)) {
    const top = openingTop(o, ceiling);
    if (o.offset > cursor) segs.push({ u0: cursor, u1: o.offset, v0: 0, v1: height });
    if (o.sill > 0) segs.push({ u0: o.offset, u1: o.offset + o.width, v0: 0, v1: o.sill });
    if (top < height) segs.push({ u0: o.offset, u1: o.offset + o.width, v0: top, v1: height });
    cursor = o.offset + o.width;
  }
  if (cursor < length) segs.push({ u0: cursor, u1: length, v0: 0, v1: height });
  for (const s of segs) {
    if (s.u0 <= 1e-6) s.u0 = -WALL_T / 2;
    if (s.u1 >= length - 1e-6) s.u1 = length + WALL_T / 2;
  }
  return segs;
}

function faceMaterial(zone: Zone | undefined, wall: { material: PatternKind; color: string }) {
  if (!zone) return surfaceMaterial("plain", EXTERIOR, 0.95);
  if (zone.kind === "bath") return surfaceMaterial(BATH_WALL.kind, BATH_WALL.color, 0.4);
  if (zone.kind === "balcony") return surfaceMaterial("plain", EXTERIOR, 0.95);
  return surfaceMaterial(wall.material, wall.color, wall.material === "subway" ? 0.4 : 0.9);
}

function OpeningFrame({ o, ceiling }: { o: Opening; ceiling: number }) {
  const top = openingTop(o, ceiling);
  const h = top - o.sill;
  const cx = o.offset + o.width / 2;
  const cy = o.sill + h / 2;
  const f = 0.045;
  const glassy = o.type !== "door";
  const bars: { p: [number, number, number]; s: [number, number, number] }[] = [
    { p: [cx, top - f / 2, 0], s: [o.width, f, WALL_T * 0.7] },
    { p: [o.offset + f / 2, cy, 0], s: [f, h, WALL_T * 0.7] },
    { p: [o.offset + o.width - f / 2, cy, 0], s: [f, h, WALL_T * 0.7] },
  ];
  if (glassy) bars.push({ p: [cx, o.sill + f / 2, 0], s: [o.width, f, WALL_T * 0.7] }, { p: [cx, cy, 0], s: [f * 0.7, h, WALL_T * 0.5] });
  return (
    <group>
      {glassy && (
        <mesh position={[cx, cy, 0]}>
          <planeGeometry args={[o.width, h]} />
          <meshPhysicalMaterial color="#cfe3ef" transparent opacity={0.22} roughness={0.05} side={2} depthWrite={false} />
        </mesh>
      )}
      {bars.map((b, i) => (
        <mesh key={i} position={b.p} castShadow>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color={o.type === "slider" ? "#55595e" : TRIM} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Railing({ length }: { length: number }) {
  const posts = Math.max(2, Math.round(length / 1.2) + 1);
  return (
    <group>
      <mesh position={[length / 2, RAILING_H / 2, 0]}>
        <boxGeometry args={[length, RAILING_H - 0.05, 0.012]} />
        <meshPhysicalMaterial color="#cfe3ef" transparent opacity={0.25} roughness={0.05} depthWrite={false} />
      </mesh>
      <mesh position={[length / 2, RAILING_H, 0]} castShadow>
        <boxGeometry args={[length + 0.04, 0.05, 0.06]} />
        <meshStandardMaterial color="#55595e" metalness={0.5} roughness={0.4} />
      </mesh>
      {Array.from({ length: posts }, (_, i) => (
        <mesh key={i} position={[(i / (posts - 1)) * length, RAILING_H / 2, 0]} castShadow>
          <boxGeometry args={[0.04, RAILING_H, 0.04]} />
          <meshStandardMaterial color="#55595e" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function WallView({ plan, wall, ceiling, wallMat, onRef }: { plan: Plan; wall: PlanWall; ceiling: number; wallMat: { material: PatternKind; color: string }; onRef: (g: Group | null) => void }) {
  const g = wallGeom(wall);
  const angle = Math.atan2(-g.dir[1], g.dir[0]);
  const zonePlus = plan.zones.find((z) => z.id === wall.sides[0]);
  const zoneMinus = plan.zones.find((z) => z.id === wall.sides[1]);
  const segs = useMemo(() => (wall.kind === "railing" ? [] : wallSegments(g.length, ceiling, wall.openings, ceiling)), [wall, g.length, ceiling]);
  const trim = surfaceMaterial("plain", TRIM, 0.6);
  const materials = [trim, trim, trim, trim, faceMaterial(zonePlus, wallMat), faceMaterial(zoneMinus, wallMat)];
  return (
    <group ref={onRef} position={[wall.a[0], 0, wall.a[1]]} rotation={[0, angle, 0]} onClick={stop}>
      {wall.kind === "railing" ? (
        <Railing length={g.length} />
      ) : (
        <>
          {segs.map((s, i) => (
            <mesh key={i} position={[(s.u0 + s.u1) / 2, (s.v0 + s.v1) / 2, 0]} geometry={metricBox(s.u1 - s.u0, s.v1 - s.v0, WALL_T, s.u0, s.v0)} material={materials} castShadow receiveShadow />
          ))}
          <group name="frames">
            {wall.openings.map((o, i) => (
              <OpeningFrame key={i} o={o} ceiling={ceiling} />
            ))}
          </group>
        </>
      )}
    </group>
  );
}

function stop(e: ThreeEvent<MouseEvent>) {
  e.stopPropagation();
}

function zoneShape(poly: [number, number][], flipZ: boolean) {
  const s = new Shape();
  poly.forEach(([x, z], i) => (i === 0 ? s.moveTo(x, flipZ ? -z : z) : s.lineTo(x, flipZ ? -z : z)));
  s.closePath();
  return s;
}

function ZoneFloor({ zone, floor }: { zone: Zone; floor: { material: PatternKind; color: string } }) {
  const shape = useMemo(() => zoneShape(zone.polygon, true), [zone.polygon]);
  const spec = zone.kind === "bath" ? BATH_FLOOR : zone.kind === "balcony" ? BALCONY_FLOOR : { kind: floor.material, color: floor.color };
  const roughness = spec.kind === "marble" || spec.kind === "tile" || spec.kind === "bathTile" ? 0.35 : 0.85;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={surfaceMaterial(spec.kind, spec.color, roughness)} onClick={(e) => onZoneTap(zone.id, e)} name={`floor:${zone.id}`}>
      <shapeGeometry args={[shape]} />
    </mesh>
  );
}

/** Ceiling seen only from below (its face points down), with built-in downlights. */
function ZoneCeiling({ zone, ceiling, lights }: { zone: Zone; ceiling: number; lights: boolean }) {
  const shape = useMemo(() => zoneShape(zone.polygon, false), [zone.polygon]);
  const spots = useMemo(() => {
    const b = polygonBounds(zone.polygon);
    const nx = Math.max(1, Math.round((b.maxX - b.minX) / 2.2));
    const nz = Math.max(1, Math.round((b.maxZ - b.minZ) / 2.2));
    const out: [number, number][] = [];
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const x = b.minX + ((i + 0.5) * (b.maxX - b.minX)) / nx;
        const z = b.minZ + ((j + 0.5) * (b.maxZ - b.minZ)) / nz;
        if (pointInPolygon(x, z, zone.polygon)) out.push([x, z]);
      }
    if (!out.length) out.push(zoneCenter(zone));
    return out;
  }, [zone]);
  if (zone.kind === "balcony") return null;
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ceiling, 0]} raycast={() => null}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color="#fbfaf8" roughness={0.95} />
      </mesh>
      {spots.map(([x, z], i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[x, ceiling - 0.004, z]} raycast={() => null}>
          <circleGeometry args={[0.06, 20]} />
          <meshStandardMaterial color="#fffaf0" emissive="#fff1d6" emissiveIntensity={lights ? 3 : 0.3} />
        </mesh>
      ))}
    </group>
  );
}

function RoomLight({ zone, ceiling }: { zone: Zone; ceiling: number }) {
  const [x, z] = zoneCenter(zone);
  const b = polygonBounds(zone.polygon);
  const area = polygonArea(zone.polygon);
  return <pointLight position={[x, ceiling - 0.25, z]} intensity={3 + area * 0.35} distance={Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 1.8} decay={1.6} color="#ffe6c4" />;
}

export default function PlanShell() {
  const plan = useDesigner((s) => s.plan);
  const ceiling = useDesigner((s) => s.doc?.ceiling ?? 2.6);
  const floor = useDesigner((s) => s.doc?.floor);
  const wall = useDesigner((s) => s.doc?.wall);
  const lights = useDesigner((s) => s.lights);
  const iso = useDesigner(isolatedZone);
  const groups = useRef(new Map<string, Group>());

  useFrame(({ camera }) => {
    if (!plan) return;
    const target = sceneRef.controls?.target ?? { x: 0, z: 0 };
    foldedWalls.clear();
    for (const w of plan.walls) {
      const g = groups.current.get(w.id);
      if (!g) continue;
      const fold = wallBlocksView(w, camera.position, target);
      if (fold) foldedWalls.add(w.id);
      g.scale.y = fold ? FOLDED_SCALE : 1;
      const frames = g.getObjectByName("frames");
      if (frames) frames.visible = !fold;
    }
  });

  if (!plan || !floor || !wall) return null;
  const zones = plan.zones.filter((z) => !iso || z.id === iso);
  return (
    <group>
      {zones.map((z) => (
        <ZoneFloor key={z.id} zone={z} floor={floor} />
      ))}
      {zones.map((z) => (
        <ZoneCeiling key={`c${z.id}`} zone={z} ceiling={ceiling} lights={lights} />
      ))}
      {lights && zones.filter((z) => z.kind !== "balcony").map((z) => <RoomLight key={`l${z.id}`} zone={z} ceiling={ceiling} />)}
      {plan.walls
        .filter((w) => wallVisible(w, iso))
        .map((w) => (
          <WallView
            key={w.id}
            plan={plan}
            wall={w}
            ceiling={ceiling}
            wallMat={wall}
            onRef={(g) => {
              if (g) groups.current.set(w.id, g);
              else groups.current.delete(w.id);
            }}
          />
        ))}
      {plan.fixtures
        .filter((f) => zoneVisible(plan, iso, f.x, f.z))
        .map((f) => (
          <group key={f.id} position={[f.x, 0, f.z]} rotation={[0, f.rot, 0]} onClick={stop}>
            <FixtureModel fixture={f} />
          </group>
        ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(plan.bounds.minX + plan.bounds.maxX) / 2, -0.01, (plan.bounds.minZ + plan.bounds.maxZ) / 2]} raycast={() => null}>
        <circleGeometry args={[80, 48]} />
        <meshStandardMaterial color={lights ? "#9a9894" : "#e4e1dc"} roughness={1} />
      </mesh>
    </group>
  );
}
