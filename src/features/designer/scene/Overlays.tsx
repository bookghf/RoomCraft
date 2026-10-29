"use client";

import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import type { Group } from "three";
import { getCatalogItem } from "@/features/designer/data/catalog";
import { fixtureBox, wallBoxes, type Box } from "@/features/designer/lib/collision";
import { distanceLines, cm, type P3 } from "@/features/designer/lib/measure";
import { mergeItems } from "@/features/designer/lib/placement";
import { useDesigner } from "@/features/designer/store";
import type { DItem } from "@/features/designer/types";
import { isolatedZone, OVERLAY_LAYER } from "./sceneRef";

/** Puts everything inside on the overlay layer (left out of clean pictures, never raycast). */
export function OverlayGroup({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame(() => ref.current?.traverse((o) => o.layers.set(OVERLAY_LAYER)));
  return <group ref={ref}>{children}</group>;
}

export function Label({ position, children, tone = "dark" }: { position: P3; children: ReactNode; tone?: "dark" | "blue" | "light" | "number" }) {
  const cls = {
    dark: "bg-stone-900/85 text-white",
    blue: "bg-sky-600 text-white",
    light: "bg-white/90 text-stone-700 ring-1 ring-stone-300",
    number: "size-5 justify-center rounded-full bg-amber-400 text-stone-900 ring-2 ring-white",
  }[tone];
  return (
    <Html position={position} center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
      <span data-dsg-label={tone} className={`inline-flex items-center whitespace-nowrap rounded px-1 py-px text-[10px] font-semibold tabular-nums shadow-sm ${cls}`}>
        {children}
      </span>
    </Html>
  );
}

function Seg({ a, b, color, width = 1.5, dashed }: { a: P3; b: P3; color: string; width?: number; dashed?: boolean }) {
  return <Line points={[a, b]} color={color} lineWidth={width} depthTest={false} renderOrder={10} dashed={dashed} dashSize={0.05} gapSize={0.04} />;
}

/** Dimension line with end ticks perpendicular to it (in the horizontal plane, or vertical for heights). */
function DimLine({ a, b, color, tick = 0.06, label, tone }: { a: P3; b: P3; color: string; tick?: number; label?: string; tone?: "dark" | "blue" | "light" }) {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dz);
  const t: P3 = len > 1e-6 ? [(-dz / len) * tick, 0, (dx / len) * tick] : [tick, 0, 0];
  const mid: P3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  return (
    <group>
      <Seg a={a} b={b} color={color} />
      <Seg a={[a[0] - t[0], a[1], a[2] - t[2]]} b={[a[0] + t[0], a[1], a[2] + t[2]]} color={color} />
      <Seg a={[b[0] - t[0], b[1], b[2] - t[2]]} b={[b[0] + t[0], b[1], b[2] + t[2]]} color={color} />
      {label && (
        <Label position={mid} tone={tone}>
          {label}
        </Label>
      )}
    </group>
  );
}

function BoxOutline({ box, color }: { box: Box; color: string }) {
  return (
    <group position={[box.cx, (box.y0 + box.y1) / 2, box.cz]} rotation={[0, box.rot, 0]}>
      <mesh renderOrder={9}>
        <boxGeometry args={[box.hw * 2 + 0.02, box.y1 - box.y0 + 0.02, box.hd * 2 + 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthTest={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Width, depth and height lines on the selected item's edges, in its own frame. */
export function ItemDims({ it }: { it: DItem }) {
  const cat = getCatalogItem(it.itemId);
  if (!cat) return null;
  const { w, d, h } = cat.size;
  const o = 0.04;
  const wall = cat.mount === "wall";
  return (
    <group position={[it.x, it.y, it.z]} rotation={[0, it.rot, 0]}>
      <DimLine a={[-w / 2, wall ? -o : 0.01, d / 2 + o]} b={[w / 2, wall ? -o : 0.01, d / 2 + o]} color="#ffffff" label={`${cm(w)}`} />
      {!wall && <DimLine a={[w / 2 + o, 0.01, -d / 2]} b={[w / 2 + o, 0.01, d / 2]} color="#ffffff" label={`${cm(d)}`} />}
      {h > 0.03 && (
        <group>
          <Seg a={[w / 2 + o, 0, d / 2 + o]} b={[w / 2 + o, h, d / 2 + o]} color="#ffffff" />
          <Label position={[w / 2 + o, h / 2, d / 2 + o]}>{cm(h)}</Label>
        </group>
      )}
    </group>
  );
}

export default function Overlays() {
  const plan = useDesigner((s) => s.plan);
  const doc = useDesigner((s) => s.doc);
  const drag = useDesigner((s) => s.drag);
  const selected = useDesigner((s) => s.selected);
  const measure = useDesigner((s) => s.measure);
  const iso = useDesigner(isolatedZone);
  const listOpen = useDesigner((s) => s.listOpen);
  if (!plan || !doc) return null;

  const items = drag ? mergeItems(doc.items, drag.items) : doc.items;
  const ctx = { plan, ceiling: doc.ceiling, items };
  const single = selected.length === 1 ? items.find((i) => i.uid === selected[0]) : undefined;
  const yLine = 0.02;

  const blockerBoxes: Box[] = [];
  for (const ref of drag?.blockers ?? []) {
    const [kind, id] = ref.split(":");
    if (kind === "fixture") {
      const f = plan.fixtures.find((x) => x.id === id);
      if (f) blockerBoxes.push(fixtureBox(f));
    } else if (kind === "wall") {
      const w = plan.walls.find((x) => x.id === id);
      if (w) blockerBoxes.push(...wallBoxes(w, doc.ceiling));
    }
  }

  return (
    <OverlayGroup>
      {blockerBoxes.map((b, i) => (
        <BoxOutline key={i} box={b} color="#e5484d" />
      ))}

      {drag?.guides.map((g, i) => <Seg key={`g${i}`} a={[g.a[0], yLine, g.a[1]]} b={[g.b[0], yLine, g.b[1]]} color="#ec4899" width={2} dashed />)}

      {single && measure.item && <ItemDims it={single} />}

      {single &&
        measure.distance &&
        distanceLines(ctx, single.uid).map((l, i) => <DimLine key={`d${i}`} a={l.a} b={l.b} color="#0284c7" label={cm(l.d)} tone="blue" tick={0.04} />)}

      {measure.room &&
        !iso &&
        plan.outline.map((r, i) => {
          const off = 0.45;
          const a: P3 = [r.a[0] + r.out[0] * off, yLine, r.a[1] + r.out[1] * off];
          const b: P3 = [r.b[0] + r.out[0] * off, yLine, r.b[1] + r.out[1] * off];
          const len = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]);
          return <DimLine key={`r${i}`} a={a} b={b} color="#78716c" label={`${cm(len)}`} tone="light" tick={0.1} />;
        })}

      {measure.room && !iso && (
        <group>
          <Seg a={[plan.bounds.minX - 0.45, 0, plan.bounds.maxZ + 0.45]} b={[plan.bounds.minX - 0.45, doc.ceiling, plan.bounds.maxZ + 0.45]} color="#78716c" />
          <Label position={[plan.bounds.minX - 0.45, doc.ceiling / 2, plan.bounds.maxZ + 0.45]} tone="light">
            {cm(doc.ceiling)}
          </Label>
        </group>
      )}

      {listOpen &&
        items.map((it, i) => {
          const cat = getCatalogItem(it.itemId);
          const top = cat ? it.y + cat.size.h : it.y;
          return (
            <Label key={`n${it.uid}`} position={[it.x, cat?.mount === "ceiling" ? it.y - 0.1 : top + 0.12, it.z]} tone="number">
              {i + 1}
            </Label>
          );
        })}
    </OverlayGroup>
  );
}
