"use client";

import { nanoid } from "nanoid";
import { temporal } from "zundo";
import { create } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { getProduct } from "@/data/products";
import { findFreeSpot, normalizeAngle, placeItem, type Neighbour } from "@/features/planner/lib/placement";
import type { Design, FloorMaterial, PlacedItem, ProductCategory, Room, Vec3 } from "@/types/planner";

export type PlannerMode = "idle" | "dragging" | "swapping";

/** Live transform while dragging; not part of undo history. */
export interface DragPreview {
  uid: string;
  position: Vec3;
  rotationY: number;
  valid: boolean;
}

export interface PlannerState {
  room: Room | null;
  design: Design | null;
  selectedUid: string | null;
  mode: PlannerMode;
  drag: DragPreview | null;
  activeViewpoint: string | null;
  /** Bumped on every goToViewpoint so re-selecting the same viewpoint re-tweens. */
  viewpointNonce: number;
  catalogOpen: boolean;
  catalogCategory: ProductCategory | null;
  listOpen: boolean;
  styleOpen: boolean;

  loadRoom(room: Room, design: Design): void;
  addItem(productId: string, at?: Vec3, colorId?: string): string | null;
  moveItem(uid: string, position: Vec3, rotationY?: number): void;
  rotateItem(uid: string, deltaY?: number): void;
  duplicateItem(uid: string): void;
  removeItem(uid: string): void;
  removeItems(uids: string[]): void;
  swapItem(uid: string, newProductId: string): void;
  setItemColor(uid: string, colorId: string): void;
  setWallColor(hex: string): void;
  setFloor(m: FloorMaterial): void;
  select(uid: string | null): void;
  setMode(mode: PlannerMode): void;
  setDrag(drag: DragPreview | null): void;
  goToViewpoint(id: string): void;
  setCatalogOpen(open: boolean, category?: ProductCategory | null): void;
  setListOpen(open: boolean): void;
  setStyleOpen(open: boolean): void;
}

export function neighboursOf(design: Design, exceptUid?: string): Neighbour[] {
  return design.items.flatMap((item) => {
    const product = item.uid === exceptUid ? undefined : getProduct(item.productId);
    return product ? [{ item, product }] : [];
  });
}

function touch(design: Design, items: PlacedItem[]): Design {
  return { ...design, items, updatedAt: new Date().toISOString() };
}

export const usePlannerStore = create<PlannerState>()(
  temporal(
    (set, get) => ({
      room: null,
      design: null,
      selectedUid: null,
      mode: "idle",
      drag: null,
      activeViewpoint: null,
      viewpointNonce: 0,
      catalogOpen: true,
      catalogCategory: null,
      listOpen: false,
      styleOpen: false,

      loadRoom(room, design) {
        set({ room, design, selectedUid: null, mode: "idle", drag: null, activeViewpoint: room.viewpoints[0]?.id ?? null });
        usePlannerStore.temporal.getState().clear();
      },

      addItem(productId, at, colorId) {
        const { room, design } = get();
        const product = getProduct(productId);
        if (!room || !design || !product) return null;
        const spot = findFreeSpot(room, product, neighboursOf(design), at);
        const item: PlacedItem = { uid: nanoid(8), productId, position: spot.position, rotationY: spot.rotationY, colorId: colorId ?? product.colors[0]?.id };
        set({ design: touch(design, [...design.items, item]), selectedUid: item.uid, mode: "idle" });
        return item.uid;
      },

      moveItem(uid, position, rotationY) {
        const { design } = get();
        if (!design) return;
        set({
          design: touch(
            design,
            design.items.map((i) => (i.uid === uid ? { ...i, position, rotationY: rotationY ?? i.rotationY } : i)),
          ),
        });
      },

      rotateItem(uid, deltaY = Math.PI / 2) {
        const { room, design } = get();
        const item = design?.items.find((i) => i.uid === uid);
        const product = item && getProduct(item.productId);
        if (!room || !design || !item || !product || product.mount === "wall") return;
        const rot = normalizeAngle(item.rotationY + deltaY);
        const r = placeItem(room, product, item.position, rot, neighboursOf(design, uid), { wallSnap: false });
        // Rotating into another item is refused rather than creating an overlap.
        if (r.valid) get().moveItem(uid, r.position, r.rotationY);
      },

      duplicateItem(uid) {
        const { design } = get();
        const item = design?.items.find((i) => i.uid === uid);
        if (!item) return;
        get().addItem(item.productId, [item.position[0] + 0.3, item.position[1], item.position[2] + 0.3], item.colorId);
      },

      removeItem(uid) {
        get().removeItems([uid]);
      },

      removeItems(uids) {
        const { design, selectedUid } = get();
        if (!design) return;
        set({
          design: touch(design, design.items.filter((i) => !uids.includes(i.uid))),
          selectedUid: selectedUid && uids.includes(selectedUid) ? null : selectedUid,
        });
      },

      swapItem(uid, newProductId) {
        const { room, design } = get();
        const item = design?.items.find((i) => i.uid === uid);
        const product = getProduct(newProductId);
        if (!room || !design || !item || !product) return;
        const r = placeItem(room, product, item.position, item.rotationY, neighboursOf(design, uid), { wallSnap: false });
        set({
          design: touch(
            design,
            design.items.map((i) =>
              i.uid === uid ? { ...i, productId: newProductId, colorId: product.colors[0]?.id, position: r.position, rotationY: r.rotationY } : i,
            ),
          ),
          mode: "idle",
        });
      },

      setItemColor(uid, colorId) {
        const { design } = get();
        if (!design) return;
        set({ design: touch(design, design.items.map((i) => (i.uid === uid ? { ...i, colorId } : i))) });
      },

      setWallColor(hex) {
        const { design } = get();
        if (design) set({ design: { ...design, wallColor: hex, updatedAt: new Date().toISOString() } });
      },

      setFloor(m) {
        const { design } = get();
        if (design) set({ design: { ...design, floorMaterial: m, updatedAt: new Date().toISOString() } });
      },

      select(uid) {
        set({ selectedUid: uid, mode: get().mode === "swapping" && !uid ? "idle" : get().mode });
      },
      setMode(mode) {
        set({ mode });
      },
      setDrag(drag) {
        set({ drag });
      },
      goToViewpoint(id) {
        set({ activeViewpoint: id, viewpointNonce: get().viewpointNonce + 1 });
      },
      setCatalogOpen(open, category) {
        set({ catalogOpen: open, ...(category !== undefined ? { catalogCategory: category } : {}) });
      },
      setListOpen(open) {
        set({ listOpen: open });
      },
      setStyleOpen(open) {
        set({ styleOpen: open });
      },
    }),
    {
      // Only the design is tracked; UI flags and drag previews never create history entries.
      partialize: (s) => ({ design: s.design }),
      equality: (a, b) => a.design === b.design,
      limit: 100,
    },
  ),
);

export function useTemporalStore<T>(selector: (s: ReturnType<typeof usePlannerStore.temporal.getState>) => T): T {
  return useStoreWithEqualityFn(usePlannerStore.temporal, selector);
}

export function undo() {
  usePlannerStore.temporal.getState().undo();
}
export function redo() {
  usePlannerStore.temporal.getState().redo();
}
