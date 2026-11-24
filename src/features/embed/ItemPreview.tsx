"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { DesignerModel } from "@/features/designer/scene/models";
import type { Params } from "@/features/designer/scene/parts";
import type { CatalogItem } from "@/features/designer/types";

/** What the back office sends with postMessage({ type: "roomcraft:preview-item", item }). */
interface PreviewSpec {
  template: string;
  params: Params;
  size: { w: number; d: number; h: number };
  color: string;
  mount: "floor" | "wall" | "ceiling";
  /** 0..1, how brightly lamps glow. */
  glow?: number;
}

function isSpec(v: unknown): v is PreviewSpec {
  const s = v as PreviewSpec;
  return (
    !!s &&
    typeof s.template === "string" &&
    !!s.params &&
    typeof s.params === "object" &&
    typeof s.color === "string" &&
    !!s.size &&
    [s.size.w, s.size.d, s.size.h].every((n) => typeof n === "number" && n > 0 && n <= 20)
  );
}

function specFromHash(): PreviewSpec | null {
  try {
    const v: unknown = JSON.parse(decodeURIComponent(location.hash.slice(1)) || "null");
    return isSpec(v) ? v : null;
  } catch {
    return null;
  }
}

export default function ItemPreview() {
  // A direct link can carry the item too: /embed/item#{"template":…}. (This page only renders in the browser.)
  const [spec, setSpec] = useState<PreviewSpec | null>(specFromHash);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; item?: unknown };
      if (data?.type === "roomcraft:preview-item" && isSpec(data.item)) setSpec(data.item);
    };
    window.addEventListener("message", onMessage);
    // Tell the page that framed us we're ready for the item.
    window.parent?.postMessage({ type: "roomcraft:preview-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!spec) return null;
  const { w, d, h } = spec.size;
  const item = { size: spec.size, model: { template: spec.template, params: spec.params } } as unknown as CatalogItem;
  const r = Math.max(w, d, h, 0.2);

  return (
    <Canvas shadows dpr={[1, 2]}>
      <color attach="background" args={["#f4f4f5"]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffffff", "#d8cfc2", 0.6]} />
      <directionalLight position={[r * 2, r * 4, r * 3]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      {/* The environment map downloads separately; don't hold the model back while it loads. */}
      <Suspense fallback={null}>
        <Environment preset="apartment" environmentIntensity={0.5} />
      </Suspense>
      {/* Keyed by size so the view re-frames when the size changes, but not when options or colour do. */}
      <PerspectiveCamera key={`cam${w}:${d}:${h}`} makeDefault fov={40} near={r / 100} far={r * 100} position={[r * 1.3, h / 2 + r * 0.8, r * 1.9]} />
      <OrbitControls key={`orbit${w}:${d}:${h}`} makeDefault enableDamping target={[0, h / 2, 0]} />

      {spec.mount === "wall" && (
        <mesh position={[0, h / 2, -d / 2 - 0.005]} receiveShadow>
          <planeGeometry args={[Math.max(w * 2.5, 1.5), Math.max(h * 2.5, 1.5)]} />
          <meshStandardMaterial color="#eceae6" />
        </mesh>
      )}
      {spec.mount === "ceiling" && (
        <mesh position={[0, h + 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[Math.max(w * 3, 1.5), Math.max(d * 3, 1.5)]} />
          <meshStandardMaterial color="#eceae6" side={2} />
        </mesh>
      )}

      <DesignerModel item={item} color={spec.color} glow={spec.glow ?? 0} />

      {spec.mount === "floor" && (
        <>
          <ContactShadows position={[0, 0.001, 0]} scale={r * 3} blur={2} opacity={0.35} far={r} />
          <Grid position={[0, 0, 0]} args={[10, 10]} cellSize={0.1} sectionSize={0.5} cellColor="#dedee2" sectionColor="#c4c4c8" fadeDistance={r * 8} infiniteGrid />
        </>
      )}
    </Canvas>
  );
}
