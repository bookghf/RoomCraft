"use client";

import { ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect } from "react";
import Toaster from "@/features/designer/ui/Toast";
import { formatPrice, getCatalogItem, totalPrice } from "./data/catalog";
import { getPlanSpec } from "./data/plans";
import { tx, useLang, useRestoreLang, useT } from "./i18n";
import { designerStorage } from "./lib/storage";
import { floorPoint } from "./scene/interaction";
import { openDesign, saveDesign, setLayerOnTop, syncRecent } from "./session";
import { contentKey, redo, undo, useDesigner, type DesignerState } from "./store";
import CatalogPanel, { ITEM_DRAG_TYPE } from "./ui/CatalogPanel";
import { ContextMenu, Dialogs, FullViewControls, ItemList, RoomChip, ShareMenu, Shortcuts, SizeMenu, TopLeftTools } from "./ui/CanvasUi";
import GroupPanel from "./ui/GroupPanel";
import { nudge } from "./ui/ItemPanel";
import ItemPanel from "./ui/ItemPanel";
import LangSwitch from "./ui/LangSwitch";
import RoomPanel from "./ui/RoomPanel";

const DesignerScene = dynamic(() => import("./scene/DesignerScene"), { ssr: false, loading: () => <Loading /> });

function Loading() {
  const t = useT();
  return (
    <div className="flex h-full items-center justify-center text-sm text-stone-500">
      <span className="animate-pulse">{t("loading")}</span>
    </div>
  );
}

function hasLayer(s: DesignerState) {
  return s.fullView || !!s.dialog || !!s.menu || s.shareOpen || s.sizeOpen || s.listOpen || s.moreOpen || s.selected.length > 0 || s.selectMode || s.panel === "room" || !!s.search;
}

/** Close the top-most thing, in the order the phone Back button uses. Returns false when nothing was open. */
export function closeTop(): boolean {
  const s = useDesigner.getState();
  if (s.fullView) s.patch({ fullView: false });
  else if (s.dialog) s.patch({ dialog: null });
  else if (s.menu) s.patch({ menu: null });
  else if (s.shareOpen || s.sizeOpen || s.listOpen || s.moreOpen) s.patch({ shareOpen: false, sizeOpen: false, listOpen: false, moreOpen: false });
  else if (s.selected.length || s.selectMode) {
    s.setSelectMode(false);
    s.select(null);
  } else if (s.panel === "room") s.setPanel("catalog");
  else if (s.search) s.patch({ search: "" });
  else return false;
  return true;
}

/**
 * On touch devices the browser Back button closes full view, menus, the selection, the Room panel
 * and search before leaving the page: one history entry stands in for "something is open".
 */
function useBackLayers() {
  useEffect(() => {
    if (!matchMedia("(pointer: coarse)").matches) return;
    let pushed = false;
    let ignorePop = false;
    const sync = () => {
      const open = hasLayer(useDesigner.getState());
      if (open && !pushed) {
        window.history.pushState({ dsgLayer: true }, "");
        pushed = true;
        setLayerOnTop(true);
      } else if (!open && pushed) {
        pushed = false;
        ignorePop = true;
        window.history.back();
      }
    };
    const onPop = () => {
      if (ignorePop) {
        ignorePop = false;
        setLayerOnTop(false);
        return;
      }
      if (!pushed) return;
      pushed = false;
      setLayerOnTop(false);
      closeTop();
      sync();
    };
    const unsub = useDesigner.subscribe(sync);
    window.addEventListener("popstate", onPop);
    return () => {
      unsub();
      window.removeEventListener("popstate", onPop);
    };
  }, []);
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

function onKeyDown(e: KeyboardEvent) {
  const s = useDesigner.getState();
  const mod = e.metaKey || e.ctrlKey;
  const key = e.key.toLowerCase();
  if (key === "escape") {
    if (closeTop()) e.preventDefault();
    return;
  }
  if (isTyping(e.target) || s.dialog) return;
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
  if (mod && key === "s") {
    e.preventDefault();
    saveDesign();
    return;
  }
  if (mod || e.altKey) return;
  if (key === "f") return s.patch({ fullView: !s.fullView, moreOpen: false, sizeOpen: false, shareOpen: false, listOpen: false, menu: null });
  if (key === "t") return s.setView(s.view === "top" ? "3d" : "top");
  if (!s.selected.length) return;
  const one = s.selected.length === 1 ? s.doc?.items.find((i) => i.uid === s.selected[0]) : undefined;
  const arrows: Record<string, "left" | "right" | "away" | "closer"> = { arrowleft: "left", arrowright: "right", arrowup: "away", arrowdown: "closer" };
  if (arrows[key]) {
    e.preventDefault();
    const step = s.nudgeStep;
    if (e.shiftKey) s.patch({ nudgeStep: 0.1 });
    nudge(arrows[key]);
    if (e.shiftKey) s.patch({ nudgeStep: step });
    return;
  }
  switch (key) {
    case "delete":
    case "backspace":
      e.preventDefault();
      s.removeSelection();
      break;
    case "r":
      s.turnSelection(e.shiftKey ? -Math.PI / 4 : Math.PI / 4);
      break;
    case "d":
      s.duplicateSelection();
      break;
    case "l":
      if (one) s.toggleLock(one.uid);
      break;
  }
}

function Header() {
  const t = useT();
  const lang = useLang();
  const doc = useDesigner((s) => s.doc);
  const savedId = useDesigner((s) => s.savedId);
  const baseline = useDesigner((s) => s.baseline);
  const spec = doc && getPlanSpec(doc.planId);
  const name = doc?.name || (savedId && designerStorage().getSaved(savedId)?.name) || t("untitled");
  const dirty = !!doc && savedId !== null && contentKey(doc) !== baseline;
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-2 sm:px-4">
      <Link href="/designer" className="inline-flex size-10 items-center justify-center rounded-full text-stone-700 hover:bg-stone-100" aria-label={t("back")}>
        <ChevronLeft className="size-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-stone-400">{spec ? tx(spec.name, lang) : t("appTitle")}</p>
        <h1 className="truncate text-sm font-semibold text-stone-900 sm:text-base">
          {name}
          {dirty && <span className="ml-2 align-middle text-[11px] font-medium text-amber-600">● {t("unsavedChanges")}</span>}
        </h1>
      </div>
      {!!doc?.items.length && (
        <button
          type="button"
          onClick={() => useDesigner.getState().patch({ listOpen: true })}
          className="hidden shrink-0 rounded-full px-3 py-1.5 text-right hover:bg-stone-100 sm:block"
          title={t("shoppingList")}
        >
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400">{t("total")}</span>
          <span className="block text-sm font-semibold tabular-nums text-stone-900">{formatPrice(totalPrice(doc.items), lang)}</span>
        </button>
      )}
      <LangSwitch />
    </header>
  );
}

function PanelContent() {
  const panel = useDesigner((s) => s.panel);
  const count = useDesigner((s) => s.selected.length);
  const selectMode = useDesigner((s) => s.selectMode);
  if (panel === "room") return <RoomPanel />;
  if (selectMode || count > 1) return <GroupPanel />;
  if (count === 1) return <ItemPanel />;
  return <CatalogPanel />;
}

function SheetHandle() {
  const t = useT();
  const collapsed = useDesigner((s) => s.sheetCollapsed);
  const patch = useDesigner((s) => s.patch);
  return (
    <button type="button" onClick={() => patch({ sheetCollapsed: !collapsed })} className="flex w-full items-center justify-center gap-1 py-1.5 text-stone-400 md:hidden" aria-expanded={!collapsed} aria-label={t("catalog")}>
      <span className="h-1 w-10 rounded-full bg-stone-300" />
      {collapsed ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
    </button>
  );
}

export default function Designer({ planId }: { planId: string }) {
  const t = useT();
  useRestoreLang();
  useBackLayers();
  const loaded = useDesigner((s) => s.doc?.planId === planId);
  const fullView = useDesigner((s) => s.fullView);
  const collapsed = useDesigner((s) => s.sheetCollapsed);
  const missing = !getPlanSpec(planId);

  useEffect(() => {
    openDesign(planId);
  }, [planId]);

  // Keep unsaved work in Recent (debounced), and flush when leaving.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      const d = useDesigner.getState().doc;
      if (d) syncRecent(d);
    };
    const unsub = useDesigner.subscribe((s, prev) => {
      if (!s.doc || s.doc === prev.doc || s.doc.id !== prev.doc?.id) return;
      clearTimeout(timer);
      timer = setTimeout(flush, 400);
    });
    window.addEventListener("pagehide", flush);
    return () => {
      clearTimeout(timer);
      unsub();
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (missing) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-stone-600">{t("planNotFound")}</p>
        <Link href="/designer" className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white">
          {t("back")}
        </Link>
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-stone-50 text-stone-900">
      <Header />
      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        {!fullView && (
          <aside
            className={`order-2 flex shrink-0 flex-col overflow-hidden border-t border-stone-200 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.06)] md:order-1 md:h-auto md:w-80 md:border-r md:border-t-0 md:shadow-none ${collapsed ? "h-auto" : "h-[min(44dvh,400px)]"}`}
          >
            <SheetHandle />
            <div className={`min-h-0 flex-1 ${collapsed ? "hidden md:block" : ""}`}>
              <PanelContent />
            </div>
          </aside>
        )}

        <main
          className="relative order-1 min-h-0 flex-1 bg-stone-200 md:order-2"
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes(ITEM_DRAG_TYPE)) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }
          }}
          onDrop={(e) => {
            const id = e.dataTransfer.getData(ITEM_DRAG_TYPE);
            if (!id) return;
            e.preventDefault();
            const cat = getCatalogItem(id);
            const p = floorPoint(e.clientX, e.clientY, cat?.mount === "ceiling" ? useDesigner.getState().doc!.ceiling - cat.size.h : 0);
            useDesigner.getState().addItem(id, p ?? undefined);
          }}
        >
          {loaded ? <DesignerScene /> : <Loading />}

          {loaded && !fullView && (
            <>
              <div className="pointer-events-none absolute left-3 top-3 z-10">
                <TopLeftTools />
              </div>
              <div className="pointer-events-none absolute inset-x-16 top-[60px] z-10 flex justify-center md:inset-x-0 md:top-3">
                <RoomChip />
              </div>
              <div className="pointer-events-none absolute right-3 top-3 z-20">
                <Shortcuts />
              </div>
              <div className="pointer-events-none absolute right-16 top-3 z-20 flex flex-col items-end gap-2 md:right-3 md:top-16">
                <SizeMenu />
                <ShareMenu />
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 top-[112px] z-10 flex max-w-[calc(100%-5rem)] flex-col md:top-16">
                <ItemList />
              </div>
            </>
          )}
          {loaded && (
            <div className="pointer-events-none absolute bottom-3 right-3 z-20">
              <FullViewControls />
            </div>
          )}
        </main>
      </div>
      <ContextMenu />
      <Dialogs />
      <Toaster />
    </div>
  );
}
