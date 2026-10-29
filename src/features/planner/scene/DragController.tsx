"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Raycaster, Vector2 } from "three";
import { getProduct } from "@/data/products";
import { placeItem } from "@/features/planner/lib/placement";
import { neighboursOf, usePlannerStore } from "@/features/planner/store/usePlannerStore";
import type { Vec3 } from "@/types/planner";
import { dragSession, intersectDragSurface } from "./dragSession";

const START_PX = 4;
const MIN_MOVE = 0.01;

/**
 * Window-level pointer handling for an active item drag. Updates the store's drag
 * preview on every move and commits a single moveItem (one history entry) on release.
 */
export default function DragController() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);

  useEffect(() => {
    const raycaster = new Raycaster();
    const ndc = new Vector2();

    function onMove(e: PointerEvent) {
      const session = dragSession.current;
      const { room, design, setDrag } = usePlannerStore.getState();
      if (!session || !room || !design || e.pointerId !== session.pointerId) return;
      if (!session.started && Math.hypot(e.clientX - session.downX, e.clientY - session.downY) < START_PX) return;
      session.started = true;
      const item = design.items.find((i) => i.uid === session.uid);
      const product = item && getProduct(item.productId);
      if (!item || !product) return;

      const rect = gl.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = intersectDragSurface(raycaster.ray, room, product, item.position[1]);
      if (!hit) return;

      const [ox, oy, oz] = session.offset;
      // On a different wall the along-wall offset no longer applies; keep only the vertical grab offset.
      const sameSurface = product.mount !== "wall" || hit.wallId === session.startWallId;
      const point: Vec3 = sameSurface ? [hit.point[0] + ox, hit.point[1] + oy, hit.point[2] + oz] : [hit.point[0], hit.point[1] + oy, hit.point[2]];
      const r = placeItem(room, product, point, session.rotationY, neighboursOf(design, item.uid), {
        grid: e.shiftKey ? 0.05 : undefined,
        preferWallId: hit.wallId,
      });
      setDrag({ uid: item.uid, position: r.position, rotationY: r.rotationY, valid: r.valid });
    }

    function onUp(e: PointerEvent) {
      const session = dragSession.current;
      // Listeners stay attached for the canvas lifetime, so a fast click can't outrun them.
      if (!session || e.pointerId !== session.pointerId) return;
      const { drag, moveItem, setDrag, setMode } = usePlannerStore.getState();
      if (drag && drag.uid === session.uid && drag.valid) {
        const [x, y, z] = session.startPosition;
        const moved = Math.hypot(drag.position[0] - x, drag.position[1] - y, drag.position[2] - z) > MIN_MOVE || Math.abs(drag.rotationY - session.rotationY) > 1e-3;
        if (moved) moveItem(session.uid, drag.position, drag.rotationY);
      }
      dragSession.current = null;
      setDrag(null);
      setMode("idle");
      const controls = get().controls as { enabled: boolean } | null;
      if (controls) controls.enabled = true;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [camera, gl, get]);

  return null;
}
