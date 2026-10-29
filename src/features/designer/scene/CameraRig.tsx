"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getCatalogItem } from "@/features/designer/data/catalog";
import { polygonBounds } from "@/features/designer/lib/geometry";
import { useDesigner, type CamRequest } from "@/features/designer/store";
import { sceneRef } from "./sceneRef";

const TWEEN_MS = 650;
export const MAX_DISTANCE = 40;
/** Elevated 3/4 view from the front-left, like a dollhouse. */
const DOLLHOUSE_DIR = new Vector3(-0.5, 0.95, 0.8).normalize();

interface Tween {
  fromPos: Vector3;
  fromTarget: Vector3;
  toPos: Vector3;
  toTarget: Vector3;
  start: number;
}

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Distance at which a sphere of `radius` fills the view, for both the vertical and horizontal field of view. */
export function fitDistance(camera: PerspectiveCamera, radius: number) {
  const vfov = (camera.fov * Math.PI) / 180;
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  return Math.min(MAX_DISTANCE, (radius / Math.sin(Math.min(vfov, hfov) / 2)) * 1.05);
}

export default function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const tween = useRef<Tween | null>(null);
  const get = useThree((s) => s.get);
  const cam = useDesigner((s) => s.cam);

  useEffect(() => {
    sceneRef.controls = controlsRef.current;
    return () => {
      sceneRef.controls = null;
    };
  }, []);

  // Requests wait here until the controls exist; the first frames can run before they mount.
  const pending = useRef<typeof cam>(null);
  useEffect(() => {
    pending.current = cam;
  }, [cam]);

  function startTween(req: CamRequest, controls: OrbitControlsImpl) {
    const s = useDesigner.getState();
    if (!s.plan || !s.doc) return false;
    const camera = get().camera as PerspectiveCamera;

    let bounds = s.plan.bounds;
    let minY = 0;
    let maxY = s.doc.ceiling;
    const focus = req.kind === "zone" ? req.id : req.kind === "view" ? s.focusZone : null;
    if (req.kind === "item") {
      const it = s.doc.items.find((i) => i.uid === req.uid);
      const c = it && getCatalogItem(it.itemId);
      if (!it || !c) return true;
      const r = Math.max(c.size.w, c.size.d) / 2 + 0.6;
      bounds = { minX: it.x - r, maxX: it.x + r, minZ: it.z - r, maxZ: it.z + r };
      minY = it.y;
      maxY = it.y + c.size.h;
    } else if (focus) {
      const zn = s.plan.zones.find((z) => z.id === focus);
      if (zn) bounds = polygonBounds(zn.polygon);
    }

    const target = new Vector3((bounds.minX + bounds.maxX) / 2, req.kind === "item" ? (minY + maxY) / 2 : 0.4, (bounds.minZ + bounds.maxZ) / 2);
    const radius = Math.hypot(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2;
    const top = s.view === "top" && req.kind !== "item";
    const dist = fitDistance(camera, top ? radius * 0.92 : radius * 1.05);
    let dir = top ? new Vector3(0, 1, 0.0001) : DOLLHOUSE_DIR.clone();
    if (req.kind === "item") {
      // Keep the current viewing direction when zooming to an item.
      dir = camera.position.clone().sub(controls.target).normalize();
      if (dir.y < 0.35) dir.setY(0.35).normalize();
    }
    if (top) target.y = 0;
    tween.current = { fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toPos: target.clone().add(dir.multiplyScalar(dist)), toTarget: target, start: performance.now() };
    return true;
  }

  useFrame(({ camera }) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (pending.current && startTween(pending.current.req, controls)) pending.current = null;
    const t = tween.current;
    if (t) {
      const k = Math.min(1, (performance.now() - t.start) / TWEEN_MS);
      const e = ease(k);
      camera.position.lerpVectors(t.fromPos, t.toPos, e);
      controls.target.lerpVectors(t.fromTarget, t.toTarget, e);
      controls.update();
      if (k >= 1) tween.current = null;
    }
    // Keep the orbit target near the plan so panning can't lose the room.
    const p = useDesigner.getState().plan;
    if (p) {
      const m = 2;
      controls.target.x = Math.min(p.bounds.maxX + m, Math.max(p.bounds.minX - m, controls.target.x));
      controls.target.z = Math.min(p.bounds.maxZ + m, Math.max(p.bounds.minZ - m, controls.target.z));
      controls.target.y = Math.min(3, Math.max(-0.5, controls.target.y));
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      minDistance={0.6}
      maxDistance={MAX_DISTANCE}
      // Any angle, from straight above to underneath.
      minPolarAngle={0.001}
      maxPolarAngle={Math.PI - 0.05}
      // Pan moves over the floor: left/right/front/back.
      screenSpacePanning={false}
      zoomToCursor
      onStart={() => {
        tween.current = null;
      }}
    />
  );
}
