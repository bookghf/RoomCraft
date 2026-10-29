"use client";

import { AdaptiveDpr, Environment } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import { Object3D } from "three";
import { useDesigner } from "@/features/designer/store";
import CameraRig from "./CameraRig";
import { useItemPointerHandling } from "./interaction";
import ItemsLayer from "./ItemsLayer";
import Overlays from "./Overlays";
import PlanShell from "./PlanShell";
import { OVERLAY_LAYER, sceneRef } from "./sceneRef";

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

function Bridge() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    sceneRef.gl = gl;
    sceneRef.scene = scene;
    sceneRef.camera = camera;
    camera.layers.enable(OVERLAY_LAYER);
  }, [gl, scene, camera]);
  useItemPointerHandling();
  return null;
}

function Daylight() {
  const plan = useDesigner((s) => s.plan);
  const lights = useDesigner((s) => s.lights);
  const target = useMemo(() => new Object3D(), []);
  if (!plan) return null;
  const b = plan.bounds;
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  const s = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 0.85 + 1;
  target.position.set(cx, 0, cz);
  const dim = lights ? 0.25 : 1;
  return (
    <>
      <primitive object={target} />
      <ambientLight intensity={0.35 * dim} />
      <hemisphereLight args={["#ffffff", "#d8cfc2", 0.6 * dim]} />
      <directionalLight
        position={[cx - 4, 9, cz + 6]}
        intensity={2 * dim}
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
        shadow-camera-far={30}
        target={target}
      />
    </>
  );
}

export default function DesignerScene() {
  const lights = useDesigner((s) => s.lights);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.05, far: 300, position: [-6, 10, 12] }}
      onPointerMissed={(e) => {
        if (e.type === "click") useDesigner.getState().select(null);
      }}
      onContextMenu={(e) => e.preventDefault()}
      className="touch-none select-none"
    >
      <color attach="background" args={[lights ? "#3f3d3a" : "#eceae6"]} />
      <AdaptiveDpr pixelated />
      <Daylight />
      <SilentBoundary>
        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={lights ? 0.15 : 0.5} />
        </Suspense>
      </SilentBoundary>
      <Suspense fallback={null}>
        <PlanShell />
        <ItemsLayer />
        <Overlays />
      </Suspense>
      <CameraRig />
      <Bridge />
    </Canvas>
  );
}
