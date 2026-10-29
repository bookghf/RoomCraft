"use client";

import { nanoid } from "nanoid";
import { temporal } from "zundo";
import { create } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { toast } from "@/features/planner/ui/Toast";
import { normalizeAngle } from "@/features/planner/lib/placement";
import { getCatalogItem } from "./data/catalog";
import { CEILING_LIMITS, EMPTY_LIMITS, EMPTY_PLAN_ID, EMPTY_SIZE, getPlanSpec } from "./data/plans";
import { translate, useLangStore, type TKey } from "./i18n";
import { checkItems, withDescendants, type Ctx } from "./lib/collision";
import { cachedPlan, wallGeom, zoneCenter } from "./lib/geometry";
import { defaultFloorColor, defaultWallColor } from "./lib/materials";
import { alongFace, faceOf, findFreeSpot, mergeItems, placeFlat, placeOnFace, reseatForCeiling, transformItems, tryMoveSet, type Guide } from "./lib/placement";
import { defaultMeasure, designerStorage, type MeasureSettings } from "./lib/storage";
import type { Category, DesignDoc, DItem, FloorMat, Plan, WallMat, XZ } from "./types";

export const HISTORY_LIMIT = 50;

export interface DragPreview {
  /** Preview states of every moving item (selection plus what stands on it). */
  items: DItem[];
  valid: boolean;
  blockers: string[];
  guides: Guide[];
}

export type CamRequest = { kind: "zone"; id: string } | { kind: "item"; uid: string } | { kind: "all" } | { kind: "view" };

export type PanelKind = "catalog" | "room";

export interface DesignerState {
  plan: Plan | null;
  doc: DesignDoc | null;
  savedId: string | null;
  sessionId: string;
  /** Design content (without id/name/time) when loaded or last saved; Recent keeps only changes from it. */
  baseline: string;

  selected: string[];
  selectMode: boolean;
  drag: DragPreview | null;
  focusZone: string | null;
  onlyThisRoom: boolean;
  view: "3d" | "top";
  cam: { req: CamRequest; nonce: number } | null;

  panel: PanelKind;
  sheetCollapsed: boolean;
  catalogTab: Category | "recent";
  search: string;
  listOpen: boolean;
  sizeOpen: boolean;
  moreOpen: boolean;
  shareOpen: boolean;
  fullView: boolean;
  lights: boolean;
  measure: MeasureSettings;
  menu: { uid: string; x: number; y: number } | null;
  dialog: null | "save" | "reset";
  nudgeStep: number;

  load(doc: DesignDoc, opts: { savedId: string | null; sessionId: string; baseline: string }): void;
  setDoc(next: DesignDoc): void;
  ctx(): Ctx | null;

  addItem(itemId: string, near?: XZ): void;
  commitItems(changed: DItem[]): void;
  rotateTo(uid: string, rot: number): boolean;
  turnSelection(dRot: number): boolean;
  nudgeSelection(dx: number, dz: number, dy?: number): boolean;
  duplicateSelection(): void;
  removeSelection(): void;
  removeItems(uids: string[]): void;
  setColor(uid: string, colorId: string): void;
  toggleLock(uid: string): void;

  setFloor(material: FloorMat, color?: string): void;
  setWall(material: WallMat, color?: string): void;
  setCeiling(h: number): boolean;
  setSize(w: number, d: number): boolean;
  resetDesign(): void;

  select(uid: string | null, additive?: boolean): void;
  setSelectMode(on: boolean): void;
  setDrag(drag: DragPreview | null): void;

  focus(zoneId: string | null): void;
  stepRoom(dir: 1 | -1): void;
  setOnlyThisRoom(on: boolean): void;
  setView(view: "3d" | "top"): void;
  requestCam(req: CamRequest): void;

  setPanel(panel: PanelKind): void;
  patch(p: Partial<Pick<DesignerState, "sheetCollapsed" | "catalogTab" | "search" | "listOpen" | "sizeOpen" | "moreOpen" | "shareOpen" | "fullView" | "lights" | "menu" | "dialog" | "nudgeStep">>): void;
  setMeasure(m: Partial<MeasureSettings>): void;
}

export function t(key: TKey, vars?: Record<string, string | number>) {
  return translate(useLangStore.getState().lang, key, vars);
}

/** Short haptic tick on phones; ignored where unsupported. */
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

export function planFor(doc: Pick<DesignDoc, "planId" | "size">): Plan | null {
  const spec = getPlanSpec(doc.planId, doc.size);
  return spec ? cachedPlan(spec) : null;
}

export function defaultDoc(planId: string, id: string = nanoid(10)): DesignDoc | null {
  const spec = getPlanSpec(planId);
  if (!spec) return null;
  return {
    id,
    planId,
    name: "",
    items: [],
    floor: { material: "wood", color: defaultFloorColor.wood },
    wall: { material: "paint", color: defaultWallColor.paint },
    ceiling: spec.ceiling,
    size: planId === EMPTY_PLAN_ID ? { ...EMPTY_SIZE } : undefined,
    updatedAt: new Date().toISOString(),
  };
}

/** Comparable design content, without id, name or timestamps. */
export function contentKey(doc: DesignDoc): string {
  const { planId, items, floor, wall, ceiling, size } = doc;
  return JSON.stringify({ planId, items, floor, wall, ceiling, size });
}

function describeBlocker(ref: string): string {
  if (ref.startsWith("wall:")) return t("aWall");
  if (ref.startsWith("fixture:")) return t("aFixture");
  const uid = ref.slice(5);
  const it = useDesigner.getState().doc?.items.find((i) => i.uid === uid);
  const cat = it && getCatalogItem(it.itemId);
  return cat ? cat.name[useLangStore.getState().lang] : t("aWall");
}

export function blockedToast(blockers: string[], fallback: TKey = "moveBlocked") {
  if (blockers.length) toast(t("blockedBy", { what: describeBlocker(blockers[0]) }));
  else toast(t(fallback));
  buzz([30, 40, 30]);
}

export const useDesigner = create<DesignerState>()(
  temporal(
    (set, get) => ({
      plan: null,
      doc: null,
      savedId: null,
      sessionId: "",
      baseline: "",
      selected: [],
      selectMode: false,
      drag: null,
      focusZone: null,
      onlyThisRoom: false,
      view: "3d",
      cam: null,
      panel: "catalog",
      sheetCollapsed: false,
      catalogTab: "bedroom",
      search: "",
      listOpen: false,
      sizeOpen: false,
      moreOpen: false,
      shareOpen: false,
      fullView: false,
      lights: false,
      measure: defaultMeasure,
      menu: null,
      dialog: null,
      nudgeStep: 0.05,

      load(doc, opts) {
        set({
          doc,
          plan: planFor(doc),
          ...opts,
          selected: [],
          selectMode: false,
          drag: null,
          focusZone: null,
          onlyThisRoom: false,
          view: "3d",
          panel: "catalog",
          menu: null,
          dialog: null,
          fullView: false,
          measure: designerStorage().measure(),
          catalogTab: designerStorage().recentItems().length ? "recent" : "bedroom",
          cam: { req: { kind: "all" }, nonce: (get().cam?.nonce ?? 0) + 1 },
        });
        useDesigner.temporal.getState().clear();
      },

      setDoc(next) {
        set({ doc: { ...next, updatedAt: new Date().toISOString() }, plan: planFor(next) });
      },

      ctx() {
        const { plan, doc } = get();
        return plan && doc ? { plan, ceiling: doc.ceiling, items: doc.items } : null;
      },

      addItem(itemId, near) {
        const { doc, focusZone } = get();
        const ctx = get().ctx();
        const cat = getCatalogItem(itemId);
        if (!doc || !ctx || !cat) return;
        const base: DItem = { uid: nanoid(8), itemId, colorId: cat.colors[0]?.id ?? "", x: 0, y: 0, z: 0, rot: 0 };
        const placed = findFreeSpot(ctx, cat, base, near ? null : focusZone, near);
        if (!placed) {
          toast(t("noSpace"));
          buzz([30, 40, 30]);
          return;
        }
        get().setDoc({ ...doc, items: [...doc.items, placed] });
        designerStorage().pushRecentItem(itemId);
        set({ selected: [placed.uid], panel: "catalog", selectMode: false });
      },

      commitItems(changed) {
        const { doc } = get();
        if (!doc || !changed.length) return;
        get().setDoc({ ...doc, items: mergeItems(doc.items, changed) });
      },

      rotateTo(uid, rot) {
        const { doc } = get();
        const ctx = get().ctx();
        const it = doc?.items.find((i) => i.uid === uid);
        const cat = it && getCatalogItem(it.itemId);
        if (!doc || !ctx || !it || !cat || cat.mount === "wall") return false;
        if (it.locked) {
          toast(t("lockedToast"));
          return false;
        }
        const set_ = withDescendants(doc.items, [uid]);
        const r = tryMoveSet(ctx, set_, 0, 0, normalizeAngle(rot - it.rot), [it.x, it.z]);
        if (!r.valid) return false;
        get().commitItems(r.items);
        return true;
      },

      turnSelection(dRot) {
        const { doc, selected } = get();
        const ctx = get().ctx();
        if (!doc || !ctx || !selected.length) return false;
        const items = doc.items.filter((i) => selected.includes(i.uid));
        if (items.some((i) => i.locked)) {
          toast(t("lockedToast"));
          return false;
        }
        if (items.some((i) => getCatalogItem(i.itemId)?.mount === "wall")) return false;
        const pivot: XZ = [items.reduce((s, i) => s + i.x, 0) / items.length, items.reduce((s, i) => s + i.z, 0) / items.length];
        const r = tryMoveSet(ctx, withDescendants(doc.items, selected), 0, 0, dRot, pivot);
        if (!r.valid) {
          blockedToast(r.blockers, "rotateBlocked");
          return false;
        }
        get().commitItems(r.items);
        buzz(8);
        return true;
      },

      nudgeSelection(dx, dz, dy = 0) {
        const { doc, selected, plan } = get();
        const ctx = get().ctx();
        if (!doc || !ctx || !plan || !selected.length) return false;
        const items = doc.items.filter((i) => selected.includes(i.uid));
        if (items.some((i) => i.locked)) {
          toast(t("lockedToast"));
          return false;
        }
        // A single wall item slides along its wall (dx = along) and up/down (dy).
        if (items.length === 1 && getCatalogItem(items[0].itemId)?.mount === "wall") {
          const it = items[0];
          const cat = getCatalogItem(it.itemId)!;
          const face = faceOf(plan, it);
          if (!face) return false;
          const moved = placeOnFace(ctx, it, cat, face, alongFace(face, it.x, it.z) + dx, it.y + dy);
          const r = checkItems(ctx, [moved]);
          if (!r.valid) {
            blockedToast(r.blockers);
            return false;
          }
          get().commitItems([moved]);
          return true;
        }
        const r = tryMoveSet(ctx, withDescendants(doc.items, selected), dx, dz);
        if (!r.valid) {
          blockedToast(r.blockers);
          return false;
        }
        get().commitItems(r.items);
        return true;
      },

      duplicateSelection() {
        const { doc, selected } = get();
        const ctx = get().ctx();
        if (!doc || !ctx || !selected.length) return;
        const all = withDescendants(doc.items, selected);
        const source = doc.items.filter((i) => all.has(i.uid));
        const ids = new Map(source.map((i) => [i.uid, nanoid(8)]));
        const copy = source.map((i) => ({ ...i, uid: ids.get(i.uid)!, on: i.on ? (ids.get(i.on) ?? i.on) : undefined, locked: false }));
        const rootIds = selected.map((u) => ids.get(u)!).filter(Boolean);

        // A single wall item slides along its wall to the next free spot.
        if (copy.length === 1 && getCatalogItem(copy[0].itemId)?.mount === "wall") {
          const placed = findFreeSpot(ctx, getCatalogItem(copy[0].itemId)!, copy[0], null, [copy[0].x, copy[0].z]);
          if (!placed) return void toast(t("noSpace"));
          get().setDoc({ ...doc, items: [...doc.items, placed] });
          set({ selected: [placed.uid] });
          return;
        }

        const withCopies: Ctx = { ...ctx, items: [...doc.items, ...copy] };
        const copyIds = new Set(copy.map((c) => c.uid));
        for (let ring = 1; ring < 40; ring++) {
          for (const [ox, oz] of [
            [1, 1],
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
            [-1, -1],
            [1, -1],
            [-1, 1],
          ]) {
            let moved = transformItems(withCopies.items, copyIds, ox * ring * 0.15, oz * ring * 0.15);
            // Copies of stacked items re-seat on whatever surface (or floor) is under their new spot.
            for (const root of moved.filter((m) => m.on && !copyIds.has(m.on))) {
              const cat = getCatalogItem(root.itemId);
              if (!cat) continue;
              const seated = placeFlat({ ...ctx, items: doc.items }, root, cat, root.x, root.z, root.rot, copyIds);
              const dy = seated.y - root.y;
              const kids = withDescendants(moved, [root.uid]);
              moved = moved.map((m) => (m.uid === root.uid ? seated : kids.has(m.uid) ? { ...m, y: m.y + dy } : m));
            }
            if (checkItems(withCopies, moved).valid) {
              get().setDoc({ ...doc, items: [...doc.items, ...moved] });
              set({ selected: rootIds });
              return;
            }
          }
        }
        toast(t("noSpace"));
      },

      removeSelection() {
        get().removeItems(get().selected);
      },

      removeItems(uids) {
        const { doc } = get();
        if (!doc) return;
        const removable = uids.filter((u) => !doc.items.find((i) => i.uid === u)?.locked);
        if (removable.length < uids.length) toast(t("lockedToast"));
        if (!removable.length) return;
        const gone = new Set(removable);
        // Items standing on a removed item drop to the floor.
        const items = doc.items.filter((i) => !gone.has(i.uid)).map((i) => (i.on && gone.has(i.on) ? { ...i, y: 0, on: undefined } : i));
        get().setDoc({ ...doc, items });
        set({ selected: get().selected.filter((u) => !gone.has(u)), menu: null });
      },

      setColor(uid, colorId) {
        const { doc } = get();
        if (!doc) return;
        get().setDoc({ ...doc, items: doc.items.map((i) => (i.uid === uid ? { ...i, colorId } : i)) });
      },

      toggleLock(uid) {
        const { doc } = get();
        if (!doc) return;
        get().setDoc({ ...doc, items: doc.items.map((i) => (i.uid === uid ? { ...i, locked: !i.locked } : i)) });
      },

      setFloor(material, color) {
        const { doc } = get();
        if (doc) get().setDoc({ ...doc, floor: { material, color: color ?? (material === doc.floor.material ? doc.floor.color : defaultFloorColor[material]) } });
      },

      setWall(material, color) {
        const { doc } = get();
        if (doc) get().setDoc({ ...doc, wall: { material, color: color ?? (material === doc.wall.material ? doc.wall.color : defaultWallColor[material]) } });
      },

      setCeiling(h) {
        const { doc, plan } = get();
        if (!doc || !plan) return false;
        const ceiling = Math.round(Math.min(CEILING_LIMITS.max, Math.max(CEILING_LIMITS.min, h)) * 100) / 100;
        if (ceiling === doc.ceiling) return true;
        const ctx: Ctx = { plan, ceiling, items: doc.items };
        const items = reseatForCeiling(ctx, doc.items);
        const r = checkItems({ ...ctx, items }, items);
        if (!r.valid) {
          toast(t("ceilingBlocked"));
          buzz([30, 40, 30]);
          return false;
        }
        get().setDoc({ ...doc, ceiling, items });
        return true;
      },

      setSize(w, d) {
        const { doc, plan } = get();
        if (!doc || !plan || doc.planId !== EMPTY_PLAN_ID || !doc.size) return false;
        const clampSize = (v: number) => Math.min(EMPTY_LIMITS.max, Math.max(EMPTY_LIMITS.min, Math.round(v / EMPTY_LIMITS.step) * EMPTY_LIMITS.step));
        const size = { w: clampSize(w), d: clampSize(d) };
        const { w: ow, d: od } = doc.size;
        if (size.w === ow && size.d === od) return true;
        const next = planFor({ planId: doc.planId, size });
        if (!next) return false;
        const dw = size.w - ow;
        const dd = size.d - od;
        const ctx: Ctx = { plan: next, ceiling: doc.ceiling, items: doc.items };

        // Furniture keeps its distance to the nearest wall: items in the far half move with the far wall.
        const rootShift = new Map<string, XZ>();
        for (const it of doc.items) {
          if (it.on) continue;
          rootShift.set(it.uid, [it.x > ow / 2 ? dw : 0, it.z > od / 2 ? dd : 0]);
        }
        const shiftOf = (it: DItem): XZ => {
          let cur: DItem | undefined = it;
          while (cur?.on) cur = doc.items.find((i) => i.uid === cur!.on);
          return (cur && rootShift.get(cur.uid)) ?? [0, 0];
        };
        const items = doc.items.map((it) => {
          const cat = getCatalogItem(it.itemId);
          if (cat?.mount === "wall") {
            const oldFace = faceOf(plan, it);
            const face = faceOf(next, it);
            if (!oldFace || !face) return it;
            const oldLen = wallGeom(oldFace.wall).length;
            const along = alongFace(oldFace, it.x, it.z);
            const u = along > oldLen / 2 ? along + (wallGeom(face.wall).length - oldLen) : along;
            return placeOnFace(ctx, it, cat, face, u, it.y);
          }
          const [sx, sz] = shiftOf(it);
          return { ...it, x: it.x + sx, z: it.z + sz };
        });
        const r = checkItems({ ...ctx, items }, items);
        if (!r.valid) {
          toast(t("shrinkBlocked"));
          buzz([30, 40, 30]);
          return false;
        }
        get().setDoc({ ...doc, size, items });
        set({ cam: { req: { kind: "all" }, nonce: (get().cam?.nonce ?? 0) + 1 } });
        return true;
      },

      resetDesign() {
        const { doc } = get();
        if (!doc) return;
        const fresh = defaultDoc(doc.planId, doc.id);
        if (!fresh) return;
        get().setDoc({ ...fresh, name: doc.name });
        set({ selected: [], dialog: null, focusZone: null, onlyThisRoom: false, cam: { req: { kind: "all" }, nonce: (get().cam?.nonce ?? 0) + 1 } });
      },

      select(uid, additive) {
        const { selected, selectMode, doc } = get();
        if (!uid) {
          set({ selected: [], menu: null });
          return;
        }
        if (additive || selectMode) {
          const it = doc?.items.find((i) => i.uid === uid);
          const cat = it && getCatalogItem(it.itemId);
          if (!it || !cat) return;
          if (selected.includes(uid)) {
            set({ selected: selected.filter((s) => s !== uid) });
            return;
          }
          const groupable = (i: DItem) => !i.on && getCatalogItem(i.itemId)?.mount !== "wall";
          const current = doc!.items.filter((i) => selected.includes(i.uid));
          if (!groupable(it) || (current.length && !current.every(groupable))) {
            if (current.length) {
              toast(t("groupSkip"));
              return;
            }
          }
          set({ selected: [...selected, uid], panel: "catalog" });
          return;
        }
        set({ selected: [uid], panel: "catalog", menu: null });
      },

      setSelectMode(on) {
        set({ selectMode: on, selected: on ? get().selected : get().selected.slice(0, 1) });
      },

      setDrag(drag) {
        set({ drag });
      },

      focus(zoneId) {
        set({ focusZone: zoneId, onlyThisRoom: zoneId ? get().onlyThisRoom : false });
        get().requestCam(zoneId ? { kind: "zone", id: zoneId } : { kind: "all" });
      },

      stepRoom(dir) {
        const { plan, focusZone } = get();
        if (!plan) return;
        const zones = plan.zones;
        const i = zones.findIndex((z) => z.id === focusZone);
        const next = zones[(i + dir + zones.length) % zones.length] ?? zones[0];
        get().focus(next.id);
      },

      setOnlyThisRoom(on) {
        set({ onlyThisRoom: on });
      },

      setView(view) {
        set({ view });
        get().requestCam({ kind: "view" });
      },

      requestCam(req) {
        set({ cam: { req, nonce: (get().cam?.nonce ?? 0) + 1 } });
      },

      setPanel(panel) {
        set({ panel, selected: panel === "room" ? [] : get().selected, selectMode: panel === "room" ? false : get().selectMode, sheetCollapsed: false });
      },

      patch(p) {
        set(p);
      },

      setMeasure(m) {
        const measure = { ...get().measure, ...m };
        set({ measure });
        designerStorage().setMeasure(measure);
      },
    }),
    {
      // Only the design is tracked; UI state never creates history entries.
      partialize: (s) => ({ doc: s.doc }),
      equality: (a, b) => a.doc === b.doc,
      limit: HISTORY_LIMIT,
    },
  ),
);

/** Keep plan in sync with the doc when undo/redo restores a different room size. */
useDesigner.subscribe((s, prev) => {
  if (s.doc && s.doc !== prev.doc && (s.doc.size?.w !== prev.doc?.size?.w || s.doc.size?.d !== prev.doc?.size?.d || s.doc.planId !== prev.doc?.planId)) {
    useDesigner.setState({ plan: planFor(s.doc) });
  }
});

export function useTemporal<T>(selector: (s: ReturnType<typeof useDesigner.temporal.getState>) => T): T {
  return useStoreWithEqualityFn(useDesigner.temporal, selector);
}

export function undo() {
  useDesigner.temporal.getState().undo();
  pruneSelection();
}

export function redo() {
  useDesigner.temporal.getState().redo();
  pruneSelection();
}

function pruneSelection() {
  const { doc, selected } = useDesigner.getState();
  const alive = selected.filter((u) => doc?.items.some((i) => i.uid === u));
  if (alive.length !== selected.length) useDesigner.setState({ selected: alive });
}

/**
 * Live gestures (rotation slider) change the design many times; this collapses them into one undo step.
 */
let gestureSnapshot: DesignDoc | null = null;
export function beginGesture() {
  gestureSnapshot = useDesigner.getState().doc;
  useDesigner.temporal.getState().pause();
}
export function endGesture() {
  const t = useDesigner.temporal.getState();
  const final = useDesigner.getState().doc;
  if (!gestureSnapshot) return t.resume();
  useDesigner.setState({ doc: gestureSnapshot });
  t.resume();
  if (final && final !== gestureSnapshot) useDesigner.setState({ doc: final });
  gestureSnapshot = null;
}

export function zoneFocusPoint(plan: Plan, zoneId: string): XZ {
  const zn = plan.zones.find((z) => z.id === zoneId);
  return zn ? zoneCenter(zn) : [0, 0];
}

export function selectedItems(s: Pick<DesignerState, "doc" | "selected">): DItem[] {
  return s.doc?.items.filter((i) => s.selected.includes(i.uid)) ?? [];
}

/** Rigidly move the selection in the preview without committing (used by drag code). */
export function previewMove(ctx: Ctx, uids: Set<string>, dx: number, dz: number) {
  return transformItems(ctx.items, uids, dx, dz);
}
