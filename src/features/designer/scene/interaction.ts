"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useEffect } from "react";
import { Plane, Ray, Raycaster, Vector2, Vector3 } from "three";
import { getCatalogItem } from "@/features/designer/data/catalog";
import { checkItems, withDescendants, type Ctx } from "@/features/designer/lib/collision";
import { wallGeom, WALL_T } from "@/features/designer/lib/geometry";
import { alignSnap, alongFace, faceOf, faceZone, placeFlat, placeOnFace, transformItems, wallFaces, type Face, type Guide } from "@/features/designer/lib/placement";
import { buzz, t, useDesigner } from "@/features/designer/store";
import type { DItem, XZ } from "@/features/designer/types";
import { toast } from "@/features/designer/ui/Toast";
import { foldedWalls } from "./PlanShell";
import { isolatedZone, sceneRef } from "./sceneRef";

const START_PX = 4;
const TAP_PX = 6;
const LONG_PRESS_MS = 500;
const DOUBLE_TAP_MS = 350;

interface DragSession {
  uids: Set<string>;
  lead: DItem;
  group: boolean;
  wall: boolean;
  plane: number;
  offset: [number, number, number];
  startFace?: string;
  last: DItem[];
  start: DItem[];
  started: boolean;
  locked: boolean;
}

interface Track {
  uid: string;
  pointerId: number;
  pointerType: string;
  downX: number;
  downY: number;
  moved: boolean;
  additive: boolean;
  longPressed: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  drag: DragSession | null;
}

let track: Track | null = null;
let lastTap = { uid: "", at: 0 };

const raycaster = new Raycaster();
const ndc = new Vector2();
const plane = new Plane();
const hitV = new Vector3();
const normal = new Vector3();
const origin = new Vector3();

function setControls(enabled: boolean) {
  if (sceneRef.controls) sceneRef.controls.enabled = enabled;
}

/** Ray from the camera through a screen point. */
export function screenRay(clientX: number, clientY: number): Ray | null {
  const { gl, camera } = sceneRef;
  if (!gl || !camera) return null;
  const rect = gl.domElement.getBoundingClientRect();
  ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray;
}

export function floorPoint(clientX: number, clientY: number, y = 0): XZ | null {
  const ray = screenRay(clientX, clientY);
  if (!ray) return null;
  plane.set(normal.set(0, 1, 0), -y);
  return ray.intersectPlane(plane, hitV) ? [hitV.x, hitV.z] : null;
}

/** Nearest wall face under the ray that faces it and is not folded away. */
function wallHit(ray: Ray, ctx: Ctx): { face: Face; along: number; y: number; point: Vector3 } | null {
  const iso = isolatedZone(useDesigner.getState());
  let best: { face: Face; along: number; y: number; point: Vector3; dist: number } | null = null;
  for (const face of wallFaces(ctx.plan)) {
    if (foldedWalls.has(face.wall.id)) continue;
    if (iso && faceZone(face) !== iso) continue;
    const g = wallGeom(face.wall);
    normal.set(g.normal[0] * face.side, 0, g.normal[1] * face.side);
    if (ray.direction.dot(normal) >= 0) continue;
    origin.set(face.wall.a[0] + normal.x * (WALL_T / 2), 0, face.wall.a[1] + normal.z * (WALL_T / 2));
    plane.setFromNormalAndCoplanarPoint(normal, origin);
    if (!ray.intersectPlane(plane, hitV)) continue;
    const along = alongFace(face, hitV.x, hitV.z);
    if (along < -0.2 || along > g.length + 0.2 || hitV.y < -0.1 || hitV.y > ctx.ceiling + 0.1) continue;
    const dist = ray.origin.distanceTo(hitV);
    if (!best || dist < best.dist) best = { face, along, y: hitV.y, point: hitV.clone(), dist };
  }
  return best;
}

function startDrag(uid: string, ray: Ray): DragSession | null {
  const s = useDesigner.getState();
  const ctx = s.ctx();
  const lead = s.doc?.items.find((i) => i.uid === uid);
  const cat = lead && getCatalogItem(lead.itemId);
  if (!ctx || !lead || !cat) return null;
  const group = s.selected.length > 1 && s.selected.includes(uid);
  const uids = withDescendants(ctx.items, group ? s.selected : [uid]);
  const start = ctx.items.filter((i) => uids.has(i.uid));
  const locked = start.some((i) => i.locked && (i.uid === uid || s.selected.includes(i.uid)));
  const wall = cat.mount === "wall" && !group;
  let offset: [number, number, number] = [0, 0, 0];
  if (wall) {
    const hit = wallHit(ray, ctx);
    const face = faceOf(ctx.plan, lead);
    if (hit && face && hit.face.wall.id === face.wall.id && hit.face.side === face.side) offset = [alongFace(face, lead.x, lead.z) - hit.along, lead.y - hit.y, 0];
  } else {
    plane.set(normal.set(0, 1, 0), -lead.y);
    if (ray.intersectPlane(plane, hitV)) offset = [lead.x - hitV.x, 0, lead.z - hitV.z];
  }
  return { uids, lead, group, wall, plane: lead.y, offset, startFace: lead.wallId && `${lead.wallId}:${lead.side}`, last: start, start, started: false, locked };
}

/** Lead item at (x, z) with everything it carries; the lead re-seats on surfaces (stacking) when single. */
function candidateAt(ctx: Ctx, d: DragSession, x: number, z: number): DItem[] {
  if (d.group) return transformItems(ctx.items, d.uids, x - d.lead.x, z - d.lead.z);
  const cat = getCatalogItem(d.lead.itemId)!;
  const placed = placeFlat(ctx, d.lead, cat, x, z, d.lead.rot, d.uids);
  const dy = placed.y - d.lead.y;
  const rest = new Set([...d.uids].filter((u) => u !== d.lead.uid));
  const carried = transformItems(ctx.items, rest, placed.x - d.lead.x, placed.z - d.lead.z).map((i) => ({ ...i, y: i.y + dy }));
  return [placed, ...carried];
}

function updateDrag(d: DragSession, ray: Ray, freeMove: boolean) {
  const s = useDesigner.getState();
  const ctx = s.ctx();
  if (!ctx) return;
  let guides: Guide[] = [];
  let blockers: string[] = [];
  let chosen = d.last;

  if (d.wall) {
    const hit = wallHit(ray, ctx);
    if (hit) {
      const cat = getCatalogItem(d.lead.itemId)!;
      const same = `${hit.face.wall.id}:${hit.face.side}` === d.startFace;
      // Crossing to another wall keeps only the vertical grab offset.
      const placed = placeOnFace(ctx, d.lead, cat, hit.face, hit.along + (same ? d.offset[0] : 0), hit.y + d.offset[1]);
      const r = checkItems(ctx, [placed]);
      if (r.valid) chosen = [placed];
      else blockers = r.blockers;
    }
  } else {
    plane.set(normal.set(0, 1, 0), -d.plane);
    if (!ray.intersectPlane(plane, hitV)) return;
    let x = hitV.x + d.offset[0];
    let z = hitV.z + d.offset[2];
    if (!d.group && !freeMove) {
      const snapped = alignSnap(ctx, getCatalogItem(d.lead.itemId)!, x, z, d.lead.rot, d.uids);
      x = snapped.x;
      z = snapped.z;
      guides = snapped.guides;
    }
    const want = candidateAt(ctx, d, x, z);
    const r = checkItems(ctx, want);
    if (r.valid) chosen = want;
    else {
      // Slide along whatever is in the way instead of stopping dead.
      blockers = r.blockers;
      guides = [];
      const lastLead = d.last.find((i) => i.uid === d.lead.uid) ?? d.lead;
      for (const [sx, sz] of [
        [x, lastLead.z],
        [lastLead.x, z],
      ]) {
        const alt = candidateAt(ctx, d, sx, sz);
        if (checkItems(ctx, alt).valid) {
          chosen = alt;
          break;
        }
      }
    }
  }
  d.last = chosen;
  s.setDrag({ items: chosen, valid: true, blockers, guides });
}

function cancelTimer(tr: Track) {
  if (tr.timer) clearTimeout(tr.timer);
  tr.timer = null;
}

export function onItemPointerDown(e: ThreeEvent<PointerEvent>, uid: string) {
  const ne = e.nativeEvent;
  const s = useDesigner.getState();
  if (s.fullView || (ne.pointerType === "mouse" && ne.button !== 0) || track) return;
  e.stopPropagation();
  const additive = s.selectMode || (ne.pointerType === "mouse" && (ne.shiftKey || ne.metaKey || ne.ctrlKey));
  const selected = s.selected.includes(uid);
  const tr: Track = { uid, pointerId: ne.pointerId, pointerType: ne.pointerType, downX: ne.clientX, downY: ne.clientY, moved: false, additive, longPressed: false, timer: null, drag: null };
  track = tr;

  const canDrag = additive ? selected : selected || ne.pointerType === "mouse";
  if (canDrag) {
    if (!selected) s.select(uid);
    tr.drag = startDrag(uid, e.ray);
    // Stop the camera from orbiting with this pointer.
    if (tr.drag) setControls(false);
  }
  if (ne.pointerType !== "mouse") {
    tr.timer = setTimeout(() => {
      if (track !== tr || tr.moved) return;
      tr.longPressed = true;
      tr.drag = null;
      setControls(true);
      const st = useDesigner.getState();
      st.setDrag(null);
      if (!st.selected.includes(uid)) st.select(uid);
      st.patch({ menu: { uid, x: tr.downX, y: tr.downY } });
      buzz(15);
    }, LONG_PRESS_MS);
  }
}

export function onItemContextMenu(e: ThreeEvent<MouseEvent>, uid: string) {
  e.stopPropagation();
  e.nativeEvent.preventDefault();
  const s = useDesigner.getState();
  if (s.fullView) return;
  if (!s.selected.includes(uid)) s.select(uid);
  s.patch({ menu: { uid, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY } });
}

function handleTap(tr: Track) {
  const s = useDesigner.getState();
  if (s.menu) s.patch({ menu: null });
  if (tr.additive) {
    s.select(tr.uid, true);
    return;
  }
  s.select(tr.uid);
  const now = performance.now();
  if (lastTap.uid === tr.uid && now - lastTap.at < DOUBLE_TAP_MS) {
    s.requestCam({ kind: "item", uid: tr.uid });
    lastTap = { uid: "", at: 0 };
  } else lastTap = { uid: tr.uid, at: now };
}

/** Tap on a room floor: closes menus, clears the selection, else focuses the room. */
export function onZoneTap(zoneId: string, e: ThreeEvent<MouseEvent>) {
  if (e.delta > TAP_PX) return;
  e.stopPropagation();
  const s = useDesigner.getState();
  if (s.menu) return s.patch({ menu: null });
  if (s.selected.length && !s.selectMode) return s.select(null);
  if (s.selectMode || s.fullView) return;
  const iso = isolatedZone(s);
  if (iso && iso !== zoneId) return;
  if (s.focusZone !== zoneId) s.focus(zoneId);
}

/** Window-level move/up handling for item taps, drags and long-presses. Mount once inside the Canvas. */
export function useItemPointerHandling() {
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const tr = track;
      if (!tr || e.pointerId !== tr.pointerId) return;
      const dist = Math.hypot(e.clientX - tr.downX, e.clientY - tr.downY);
      if (dist > TAP_PX) {
        tr.moved = true;
        cancelTimer(tr);
      }
      const d = tr.drag;
      if (!d || (!d.started && dist < START_PX)) return;
      if (d.locked) {
        if (!d.started) toast(t("lockedToast"));
        d.started = true;
        return;
      }
      d.started = true;
      const ray = screenRay(e.clientX, e.clientY);
      if (ray) updateDrag(d, ray, e.altKey);
    }

    function onUp(e: PointerEvent) {
      const tr = track;
      if (!tr || e.pointerId !== tr.pointerId) return;
      cancelTimer(tr);
      track = null;
      const s = useDesigner.getState();
      const d = tr.drag;
      if (d?.started && !d.locked) {
        const changed = d.last.some((it, i) => it !== d.start[i]);
        if (changed) s.commitItems(d.last);
        s.setDrag(null);
      } else if (!tr.moved && !tr.longPressed) handleTap(tr);
      if (s.drag) s.setDrag(null);
      setControls(true);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);
}

/** Screen-relative nudge: left/right/away/closer mapped to the plan axis nearest the camera's view. */
export function nudgeVector(dir: "left" | "right" | "away" | "closer", step: number): { dx: number; dz: number; along: number } {
  const cam = sceneRef.camera;
  const target = sceneRef.controls?.target;
  let fx = 0;
  let fz = -1;
  if (cam && target) {
    fx = target.x - cam.position.x;
    fz = target.z - cam.position.z;
    if (Math.hypot(fx, fz) < 1e-3) {
      // Straight down: use the camera's up vector as "away".
      const up = new Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      fx = up.x;
      fz = up.z;
    }
  }
  // Snap the view direction to the nearest plan axis.
  const away: XZ = Math.abs(fx) > Math.abs(fz) ? [Math.sign(fx), 0] : [0, Math.sign(fz) || -1];
  const right: XZ = [-away[1], away[0]];
  const v: XZ = dir === "away" ? away : dir === "closer" ? [-away[0], -away[1]] : dir === "right" ? right : [-right[0], -right[1]];
  // For wall items: "right" on screen is along the wall direction whose sign matches the screen right vector.
  const s = useDesigner.getState();
  const it = s.doc?.items.find((i) => i.uid === s.selected[0]);
  const face = it && s.plan ? faceOf(s.plan, it) : undefined;
  let along = 0;
  if (face && (dir === "left" || dir === "right")) {
    const g = wallGeom(face.wall);
    const sx = right[0] * g.dir[0] + right[1] * g.dir[1];
    // If the wall runs towards/away from the viewer, use the facing direction instead.
    const sign = Math.abs(sx) > 0.5 ? Math.sign(sx) : Math.sign(-(face.side * (g.normal[0] * away[1] - g.normal[1] * away[0]))) || 1;
    along = (dir === "right" ? 1 : -1) * sign * step;
  }
  return { dx: v[0] * step, dz: v[1] * step, along };
}
