"use client";

import { useGLTF } from "@react-three/drei";
import { Component, Suspense, useMemo, type ReactNode } from "react";
import { Box3, Mesh, Vector3 } from "three";
import { Placeholder } from "./models";

interface Size {
  w: number;
  d: number;
  h: number;
}

/** Falls back to the placeholder box when a model URL fails to load. */
class ModelBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Scales the model uniformly to fit the catalog size, origin at bottom-centre. */
function Fitted({ url, w, d, h }: Size & { url: string }) {
  const { scene } = useGLTF(url);
  const { object, scale, offset } = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const box = new Box3().setFromObject(object);
    const dim = box.getSize(new Vector3());
    const scale = Math.min(w / (dim.x || 1), h / (dim.y || 1), d / (dim.z || 1));
    const centre = box.getCenter(new Vector3());
    const offset: [number, number, number] = [-centre.x * scale, -box.min.y * scale, -centre.z * scale];
    return { object, scale, offset };
  }, [scene, w, d, h]);

  return <primitive object={object} scale={scale} position={offset} />;
}

/** Catalog item drawn from an uploaded .glb file. */
export function GlbModel({ url, w, d, h }: Size & { url: string }) {
  const box = <Placeholder w={w} d={d} h={h} />;
  return (
    <ModelBoundary key={url} fallback={box}>
      <Suspense fallback={box}>
        <Fitted url={url} w={w} d={d} h={h} />
      </Suspense>
    </ModelBoundary>
  );
}
