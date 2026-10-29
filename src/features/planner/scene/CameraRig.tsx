"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { roomBounds, roomCenter } from "@/features/planner/lib/placement";
import { usePlannerStore } from "@/features/planner/store/usePlannerStore";
import type { Room } from "@/types/planner";

const TWEEN_MS = 600;
const MIN_CAMERA_Y = 0.2;

interface Tween {
  fromPos: Vector3;
  fromTarget: Vector3;
  toPos: Vector3;
  toTarget: Vector3;
  start: number;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function roomDiagonal(room: Room) {
  const b = roomBounds(room);
  return Math.hypot(b.maxX - b.minX, b.maxZ - b.minZ);
}

/** Elevated 3/4 "dollhouse" view from outside the front-left corner. */
function dollhouseView(room: Room): { position: Vector3; target: Vector3 } {
  const c = roomCenter(room);
  const diag = roomDiagonal(room);
  return {
    position: new Vector3(c[0] - diag * 0.55, diag * 0.95, c[2] + diag * 0.85),
    target: new Vector3(c[0], 0.5, c[2]),
  };
}

export default function CameraRig() {
  const room = usePlannerStore((s) => s.room);
  const mode = usePlannerStore((s) => s.mode);
  const nonce = usePlannerStore((s) => s.viewpointNonce);
  const get = useThree((s) => s.get);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const tween = useRef<Tween | null>(null);

  // Initial dollhouse view whenever a new room loads.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!room || !controls) return;
    const { camera } = get();
    const v = dollhouseView(room);
    camera.position.copy(v.position);
    controls.target.copy(v.target);
    controls.update();
    tween.current = null;
  }, [room, get]);

  // Tween to the active viewpoint on every goToViewpoint call.
  useEffect(() => {
    const controls = controlsRef.current;
    const { room: r, activeViewpoint } = usePlannerStore.getState();
    if (!nonce || !r || !controls) return;
    const vp = r.viewpoints.find((v) => v.id === activeViewpoint);
    if (!vp) return;
    const { camera } = get();
    tween.current = {
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPos: new Vector3(...vp.position),
      toTarget: new Vector3(...vp.target),
      start: performance.now(),
    };
  }, [nonce, get]);

  useFrame(({ camera }) => {
    const controls = controlsRef.current;
    if (!controls || !room) return;
    const t = tween.current;
    if (t) {
      const k = Math.min(1, (performance.now() - t.start) / TWEEN_MS);
      const e = easeInOutCubic(k);
      camera.position.lerpVectors(t.fromPos, t.toPos, e);
      controls.target.lerpVectors(t.fromTarget, t.toTarget, e);
      if (k >= 1) tween.current = null;
    }
    // Keep the orbit target inside the room and the camera above the floor.
    const b = roomBounds(room);
    controls.target.x = Math.min(b.maxX, Math.max(b.minX, controls.target.x));
    controls.target.z = Math.min(b.maxZ, Math.max(b.minZ, controls.target.z));
    controls.target.y = Math.min(2.5, Math.max(0, controls.target.y));
    if (camera.position.y < MIN_CAMERA_Y) camera.position.y = MIN_CAMERA_Y;
    if (t) controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={mode !== "dragging"}
      enableDamping
      dampingFactor={0.12}
      minDistance={0.5}
      maxDistance={room ? roomDiagonal(room) * 2.5 : 20}
      maxPolarAngle={Math.PI * 0.48}
    />
  );
}
