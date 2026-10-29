"use client";

import { PanelLeftOpen } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect } from "react";
import { getProduct } from "@/data/products";
import { getPresetDesign, getRoom } from "@/data/rooms";
import { placeItem } from "@/features/planner/lib/placement";
import { decodeDesign, designStorage } from "@/features/planner/lib/serialize";
import { neighboursOf, redo, undo, usePlannerStore } from "@/features/planner/store/usePlannerStore";
import type { Design, Room } from "@/types/planner";
import CatalogPanel, { PRODUCT_DRAG_TYPE } from "./ui/CatalogPanel";
import ShoppingListDrawer, { ListBar } from "./ui/ShoppingListDrawer";
import StylePanel from "./ui/StylePanel";
import Toaster from "./ui/Toast";
import TopBar from "./ui/TopBar";
import ViewpointSwitcher from "./ui/ViewpointSwitcher";

const Scene = dynamic(() => import("@/features/planner/scene/Scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-stone-500">
      <span className="animate-pulse">Loading 3D room…</span>
    </div>
  ),
});

/** Load order: ?s= share → ?d= / #roomId/designId saved → last local design → room preset. */
function resolveDesign(room: Room): Design | undefined {
  const params = new URLSearchParams(window.location.search);
  const ok = (d: Design | null | undefined) => (d && d.roomId === room.id ? d : undefined);

  const s = params.get("s");
  const shared = s ? ok(decodeDesign(s)) : undefined;
  if (shared) return shared;

  const [hashRoom, hashDesign] = window.location.hash.replace(/^#/, "").split("/");
  const designId = params.get("d") ?? (hashRoom === room.id ? hashDesign : undefined);
  const saved = designId ? ok(designStorage.loadSaved(designId)) : undefined;
  if (saved) return saved;

  return ok(designStorage.loadLast(room.id)) ?? getPresetDesign(room.id);
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

function nudge(dx: number, dz: number) {
  const { room, design, selectedUid, moveItem } = usePlannerStore.getState();
  const item = design?.items.find((i) => i.uid === selectedUid);
  const product = item && getProduct(item.productId);
  if (!room || !design || !item || !product) return;
  const [x, y, z] = item.position;
  const r = placeItem(room, product, [x + dx, y, z + dz], item.rotationY, neighboursOf(design, item.uid), { wallSnap: false });
  if (r.valid) moveItem(item.uid, r.position, r.rotationY);
}

function onKeyDown(e: KeyboardEvent) {
  if (isTyping(e.target)) return;
  const s = usePlannerStore.getState();
  const mod = e.metaKey || e.ctrlKey;
  const key = e.key.toLowerCase();

  if (mod && key === "z") {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
    return;
  }
  if (mod && key === "y") {
    e.preventDefault();
    redo();
    return;
  }
  if (mod || e.altKey) return;

  if (key === "escape") {
    if (s.listOpen) s.setListOpen(false);
    else if (s.mode === "swapping") s.setMode("idle");
    else s.select(null);
    return;
  }

  const uid = s.selectedUid;
  if (!uid) return;
  const step = e.shiftKey ? 0.1 : 0.01;
  switch (key) {
    case "delete":
    case "backspace":
      e.preventDefault();
      s.removeItem(uid);
      break;
    case "r":
      s.rotateItem(uid);
      break;
    case "d":
      s.duplicateItem(uid);
      break;
    case "arrowleft":
      e.preventDefault();
      nudge(-step, 0);
      break;
    case "arrowright":
      e.preventDefault();
      nudge(step, 0);
      break;
    case "arrowup":
      e.preventDefault();
      nudge(0, -step);
      break;
    case "arrowdown":
      e.preventDefault();
      nudge(0, step);
      break;
  }
}

export default function Planner({ roomId }: { roomId: string }) {
  const room = getRoom(roomId);
  const loaded = usePlannerStore((s) => s.room?.id === roomId && !!s.design);
  const catalogOpen = usePlannerStore((s) => s.catalogOpen);
  const setCatalogOpen = usePlannerStore((s) => s.setCatalogOpen);

  useEffect(() => {
    if (!room) return;
    const design = resolveDesign(room);
    if (design) usePlannerStore.getState().loadRoom(room, design);
  }, [room]);

  // Persist the latest design per room (debounced).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = usePlannerStore.subscribe((s, prev) => {
      if (!s.design || s.design === prev.design) return;
      clearTimeout(timer);
      const d = s.design;
      timer = setTimeout(() => designStorage.saveLast(d), 400);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!room) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50 p-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">RoomCraft</p>
        <h1 className="text-2xl font-semibold text-stone-900">We couldn&apos;t find that room</h1>
        <p className="max-w-sm text-sm text-stone-600">The showroom “{roomId}” doesn&apos;t exist or has been removed.</p>
        <Link href="/" className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700">
          Browse rooms
        </Link>
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-stone-50 text-stone-900">
      <TopBar />
      <div className="relative flex min-h-0 flex-1">
        {catalogOpen && (
          <aside
            className="fixed inset-x-0 bottom-14 z-30 h-[55dvh] rounded-t-2xl border-t border-stone-200 bg-white shadow-2xl md:static md:z-auto md:h-auto md:w-80 md:shrink-0 md:rounded-none md:border-r md:border-t-0 md:shadow-none"
            aria-label="Product catalog"
          >
            <CatalogPanel />
          </aside>
        )}

        <main
          className="relative min-w-0 flex-1 bg-stone-200"
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes(PRODUCT_DRAG_TYPE)) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }
          }}
          onDrop={(e) => {
            const productId = e.dataTransfer.getData(PRODUCT_DRAG_TYPE);
            if (productId) {
              e.preventDefault();
              usePlannerStore.getState().addItem(productId);
            }
          }}
        >
          {loaded ? (
            <Scene />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              <span className="animate-pulse">Loading room…</span>
            </div>
          )}

          {!catalogOpen && (
            <button
              type="button"
              onClick={() => setCatalogOpen(true)}
              className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-medium text-stone-800 shadow-lg ring-1 ring-stone-200 hover:bg-stone-50"
            >
              <PanelLeftOpen className="size-4" /> Products
            </button>
          )}

          <StylePanel />

          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
            <div className="pointer-events-auto">
              <ViewpointSwitcher />
            </div>
          </div>
        </main>
      </div>
      <ListBar />
      <ShoppingListDrawer />
      <Toaster />
    </div>
  );
}
