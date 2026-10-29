"use client";

import { Edges, useCursor } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group } from "three";
import { colorOf, getCatalogItem } from "@/features/designer/data/catalog";
import { useDesigner } from "@/features/designer/store";
import type { DItem } from "@/features/designer/types";
import { onItemContextMenu, onItemPointerDown } from "./interaction";
import { DesignerModel, Placeholder } from "./models";
import { foldedWalls } from "./PlanShell";
import { isolatedZone, OVERLAY_LAYER, zoneVisible } from "./sceneRef";

const SELECT = "#facc15";
const GROUP = "#2f6fde";
const LOCKED = "#8a8a8a";
const BLOCKER = "#e5484d";

function stop(e: ThreeEvent<MouseEvent>) {
  e.stopPropagation();
}

function Item({ it }: { it: DItem }) {
  const cat = getCatalogItem(it.itemId);
  const selected = useDesigner((s) => s.selected.includes(it.uid));
  const many = useDesigner((s) => s.selected.length > 1);
  const preview = useDesigner((s) => s.drag?.items.find((p) => p.uid === it.uid));
  const blocking = useDesigner((s) => !!s.drag?.blockers.includes(`item:${it.uid}`));
  const glow = useDesigner((s) => (s.lights && cat?.light ? 1 : 0));
  const dragging = useDesigner((s) => !!s.drag);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !dragging, it.locked ? "not-allowed" : "grab");
  const ref = useRef<Group>(null);
  const outlineRef = useRef<Group>(null);

  // Wall items fold away with their wall; overlays stay on the overlay layer.
  useFrame(() => {
    if (ref.current && cat?.mount === "wall") ref.current.visible = selected || !foldedWalls.has(it.wallId ?? "");
    outlineRef.current?.traverse((o) => o.layers.set(OVERLAY_LAYER));
  });

  const cur = preview ?? it;
  const size = cat?.size ?? { w: 0.5, d: 0.5, h: 0.5 };
  const outline = blocking ? BLOCKER : selected ? (many ? GROUP : SELECT) : it.locked ? LOCKED : null;
  const boxH = Math.max(size.h, 0.02);

  return (
    <group
      ref={ref}
      position={[cur.x, cur.y, cur.z]}
      rotation={[0, cur.rot, 0]}
      onPointerDown={(e) => onItemPointerDown(e, it.uid)}
      onClick={stop}
      onContextMenu={(e) => onItemContextMenu(e, it.uid)}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {cat ? <DesignerModel item={cat} color={colorOf(cat, it.colorId)} glow={glow} /> : <Placeholder {...size} />}
      {(outline || hovered) && (
        <group ref={outlineRef}>
          <mesh position={[0, boxH / 2, 0]} raycast={() => null} renderOrder={8}>
            <boxGeometry args={[size.w + 0.02, boxH + 0.02, size.d + 0.02]} />
            <meshBasicMaterial color={outline ?? "#ffffff"} transparent opacity={blocking ? 0.22 : 0} depthWrite={false} depthTest={false} />
            <Edges color={outline ?? "#ffffff"} lineWidth={selected || blocking ? 2.5 : 1.5} renderOrder={9} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function ItemsLayer() {
  const items = useDesigner((s) => s.doc?.items);
  const plan = useDesigner((s) => s.plan);
  const iso = useDesigner(isolatedZone);
  const selected = useDesigner((s) => s.selected);
  if (!items || !plan) return null;
  return (
    <group>
      {items
        .filter((it) => selected.includes(it.uid) || zoneVisible(plan, iso, it.x, it.z))
        .map((it) => (
          <Item key={it.uid} it={it} />
        ))}
    </group>
  );
}
