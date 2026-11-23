"use client";

import { useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import { Box3, Mesh, Vector3, type Color, type Material } from "three";
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

interface Paint {
  /** Colour for the materials in `materials`. */
  color?: string;
  /** Material names that follow the item colour; the rest keep the file's look. */
  materials?: string[];
}

/** Scales the model uniformly to fit the catalog size, origin at bottom-centre, and recolours the chosen materials. */
function Fitted({ url, w, d, h, color, materials }: Size & Paint & { url: string }) {
  const { scene } = useGLTF(url);
  const key = materials?.join("|") ?? "";
  const { object, scale, offset, painted } = useMemo(() => {
    const object = scene.clone(true);
    const names = new Set(key ? key.split("|") : []);
    // Recoloured materials are our own copies: the cached scene is shared by every instance.
    const painted: Material[] = [];
    const paint = (m: Material) => {
      const col = (m as Material & { color?: Color }).color;
      if (!color || !col || !names.has(m.name)) return m;
      const copy = m.clone() as Material & { color: Color };
      copy.color.set(color);
      painted.push(copy);
      return copy;
    };
    object.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (names.size) o.material = Array.isArray(o.material) ? o.material.map(paint) : paint(o.material);
      }
    });
    const box = new Box3().setFromObject(object);
    const dim = box.getSize(new Vector3());
    const scale = Math.min(w / (dim.x || 1), h / (dim.y || 1), d / (dim.z || 1));
    const centre = box.getCenter(new Vector3());
    const offset: [number, number, number] = [-centre.x * scale, -box.min.y * scale, -centre.z * scale];
    return { object, scale, offset, painted };
  }, [scene, w, d, h, color, key]);
  useEffect(() => () => painted.forEach((m) => m.dispose()), [painted]);

  return <primitive object={object} scale={scale} position={offset} />;
}

/** Catalog item drawn from an uploaded .glb file. */
export function GlbModel({ url, w, d, h, color, materials }: Size & Paint & { url: string }) {
  const box = <Placeholder w={w} d={d} h={h} />;
  return (
    <ModelBoundary key={url} fallback={box}>
      <Suspense fallback={box}>
        <Fitted url={url} w={w} d={d} h={h} color={color} materials={materials} />
      </Suspense>
    </ModelBoundary>
  );
}
