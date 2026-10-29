"use client";

import { AdaptiveDpr, Environment, Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, Suspense, useMemo, type ReactNode } from "react";
import { Object3D } from "three";
import { getProduct } from "@/data/products";
import { roomBounds, roomCenter, wallHeight, wallInfo } from "@/features/planner/lib/placement";
import { usePlannerStore } from "@/features/planner/store/usePlannerStore";
import ItemToolbar from "@/features/planner/ui/ItemToolbar";
import type { Room, Vec3 } from "@/types/planner";
import CameraRig from "./CameraRig";
import DragController from "./DragController";
import FurnitureLayer from "./FurnitureLayer";
import RoomShell from "./RoomShell";

/** Swallows loader errors (e.g. the HDR environment failing offline) so the scene still renders. */
class SilentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Sun placed outside the first window, shining in towards the room centre. */
function Sun({ room }: { room: Room }) {
  const { position, target, extent } = useMemo(() => {
    const c = roomCenter(room);
    const b = roomBounds(room);
    const extent = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    const withWindow = room.walls.find((w) => w.openings?.some((o) => o.type === "window")) ?? room.walls[0];
    const info = wallInfo(withWindow);
    const o = withWindow.openings?.find((x) => x.type === "window");
    const along = o ? o.offset + o.width / 2 : info.length / 2;
    const wx = info.a[0] + info.dir[0] * along;
    const wz = info.a[1] + info.dir[1] * along;
    const position: Vec3 = [wx - info.normal[0] * 4 + info.dir[0] * 1.5, 4.5, wz - info.normal[1] * 4 + info.dir[1] * 1.5];
    return { position, target: c, extent };
  }, [room]);

  // The target must live in the scene graph, otherwise the light (and its shadow camera) aims at the origin.
  const targetObj = useMemo(() => new Object3D(), []);
  targetObj.position.set(...target);

  const s = extent * 1.2;
  return (
    <>
    <primitive object={targetObj} />
    <directionalLight
      position={position}
      intensity={2.2}
      color="#fff1de"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
      shadow-camera-left={-s}
      shadow-camera-right={s}
      shadow-camera-top={s}
      shadow-camera-bottom={-s}
      shadow-camera-near={0.5}
      shadow-camera-far={20}
      target={targetObj}
    />
    </>
  );
}

/** Floating ItemToolbar above the selected item's bounding box; hidden while dragging. */
function SelectionToolbar() {
  const room = usePlannerStore((s) => s.room);
  const mode = usePlannerStore((s) => s.mode);
  const item = usePlannerStore((s) => s.design?.items.find((i) => i.uid === s.selectedUid));
  const product = item && getProduct(item.productId);
  if (!room || !item || !product || mode === "dragging") return null;
  const [x, y, z] = item.position;
  const top = product.mount === "ceiling" ? y - 0.15 : Math.min(y + product.dimensions.h + 0.2, wallHeight(room) + 0.2);
  return (
    <Html position={[x, top, z]} center zIndexRange={[20, 0]}>
      <ItemToolbar />
    </Html>
  );
}

export default function Scene() {
  const room = usePlannerStore((s) => s.room);
  const select = usePlannerStore((s) => s.select);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 50, near: 0.05, far: 100, position: [6, 6, 8] }}
      // R3F defaults to ACES Filmic tone mapping with sRGB output.
      onPointerMissed={() => select(null)}
      className="touch-none"
    >
      <color attach="background" args={["#eceae6"]} />
      <AdaptiveDpr pixelated />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffffff", "#d8cfc2", 0.55]} />
      {room && <Sun room={room} />}
      <SilentBoundary>
        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.55} />
        </Suspense>
      </SilentBoundary>
      <Suspense fallback={null}>
        <RoomShell />
        <FurnitureLayer />
      </Suspense>
      <DragController />
      <CameraRig />
      <SelectionToolbar />
    </Canvas>
  );
}
