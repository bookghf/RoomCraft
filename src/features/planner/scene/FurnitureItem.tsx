"use client";

import { Edges, useCursor } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group } from "three";
import { getProduct } from "@/data/products";
import { usePlannerStore } from "@/features/planner/store/usePlannerStore";
import type { PlacedItem } from "@/types/planner";
import { isWallHidden } from "./dollhouse";
import { dragSession, intersectDragSurface } from "./dragSession";
import { FurnitureModel } from "./models/FurnitureModel";

const SELECT_COLOR = "#2f6fde";
const INVALID_COLOR = "#e5484d";

export default function FurnitureItem({ item }: { item: PlacedItem }) {
  const product = getProduct(item.productId);
  const selected = usePlannerStore((s) => s.selectedUid === item.uid);
  const drag = usePlannerStore((s) => (s.drag?.uid === item.uid ? s.drag : null));
  const get = useThree((s) => s.get);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, drag ? "grabbing" : "grab");
  const groupRef = useRef<Group>(null);

  // Wall-mounted items disappear together with their wall in the dollhouse view.
  useFrame(({ camera }) => {
    const g = groupRef.current;
    const room = usePlannerStore.getState().room;
    if (!g || !room || product?.mount !== "wall") return;
    g.visible = !isWallHidden(room, [Math.sin(g.rotation.y), Math.cos(g.rotation.y)], camera);
  });

  if (!product) return null;
  const position = drag?.position ?? item.position;
  const rotationY = drag?.rotationY ?? item.rotationY;
  const color = product.colors.find((c) => c.id === item.colorId)?.hex ?? product.colors[0]?.hex;
  const invalid = drag ? !drag.valid : false;
  const { w, d, h } = product.dimensions;
  const boxH = Math.max(h, 0.03);

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const { room, select, setMode } = usePlannerStore.getState();
    select(item.uid);
    if (!room || !product) return;
    const hit = intersectDragSurface(e.ray, room, product, item.position[1]);
    if (!hit) return;
    // Disable orbiting immediately so this pointer-down never starts a camera rotate.
    const controls = get().controls as { enabled: boolean } | null;
    if (controls) controls.enabled = false;
    dragSession.current = {
      uid: item.uid,
      pointerId: e.pointerId,
      offset: [item.position[0] - hit.point[0], item.position[1] - hit.point[1], item.position[2] - hit.point[2]],
      startWallId: hit.wallId,
      startPosition: item.position,
      rotationY: item.rotationY,
      downX: e.clientX,
      downY: e.clientY,
      started: false,
    };
    setMode("dragging");
  }

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerDown={onPointerDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <FurnitureModel product={product} color={color} />
      {(selected || invalid) && (
        <mesh position={[0, boxH / 2, 0]} raycast={() => null}>
          <boxGeometry args={[w + 0.03, boxH + 0.03, d + 0.03]} />
          <meshBasicMaterial color={INVALID_COLOR} transparent opacity={invalid ? 0.18 : 0} depthWrite={false} />
          <Edges color={invalid ? INVALID_COLOR : SELECT_COLOR} lineWidth={2} />
        </mesh>
      )}
    </group>
  );
}
