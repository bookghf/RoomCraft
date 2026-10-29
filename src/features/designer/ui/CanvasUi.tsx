"use client";

import {
  Box,
  ChevronLeft,
  ChevronRight,
  Copy,
  Ellipsis,
  Eye,
  EyeOff,
  Grid2x2,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  Lightbulb,
  List,
  Lock,
  LockOpen,
  Maximize,
  Minimize,
  Pencil,
  Redo2,
  Ruler,
  Save,
  Share2,
  ShoppingBag,
  SquareDashedMousePointer,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useState } from "react";
import { colorOf, formatPrice, getCatalogItem, totalPrice } from "@/features/designer/data/catalog";
import { tx, useLang, useLangStore, useT } from "@/features/designer/i18n";
import { capturePicture, sharePicture } from "@/features/designer/scene/capture";
import { planTitle, saveDesign, shareLink } from "@/features/designer/session";
import { redo, t as translateNow, undo, useDesigner, useTemporal } from "@/features/designer/store";
import { toast } from "@/features/designer/ui/Toast";
import { ItemIcon } from "./CatalogPanel";
import { Btn, CloseButton, glass, Modal, RoundButton, Swatches, Toggle } from "./common";

export function TopLeftTools() {
  const t = useT();
  const canUndo = useTemporal((s) => s.pastStates.length > 0);
  const canRedo = useTemporal((s) => s.futureStates.length > 0);
  const selectMode = useDesigner((s) => s.selectMode);
  const setSelectMode = useDesigner((s) => s.setSelectMode);
  return (
    <div className="pointer-events-auto flex gap-1.5">
      <RoundButton icon={Undo2} label={t("undo")} onClick={undo} disabled={!canUndo} />
      <RoundButton icon={Redo2} label={t("redo")} onClick={redo} disabled={!canRedo} />
      <RoundButton icon={SquareDashedMousePointer} label={t("select")} onClick={() => setSelectMode(!selectMode)} active={selectMode} showLabel={selectMode} />
    </div>
  );
}

export function RoomChip() {
  const t = useT();
  const lang = useLang();
  const plan = useDesigner((s) => s.plan);
  const focusZone = useDesigner((s) => s.focusZone);
  const only = useDesigner((s) => s.onlyThisRoom);
  const s = useDesigner.getState();
  if (!plan) return null;
  const zone = plan.zones.find((z) => z.id === focusZone);
  const multi = plan.zones.length > 1;
  const arrow = "inline-flex size-8 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100";
  return (
    <div className="pointer-events-auto flex max-w-full flex-col items-center gap-1.5">
      <div className={`flex items-center gap-0.5 rounded-full p-1 ${glass}`}>
        {multi && (
          <button type="button" className={arrow} onClick={() => s.stepRoom(-1)} aria-label={t("prevRoom")} title={t("prevRoom")}>
            <ChevronLeft className="size-4" />
          </button>
        )}
        <span className="max-w-[40vw] truncate px-2 text-sm font-semibold text-stone-900">{zone ? tx(zone.name, lang) : t("allRooms")}</span>
        {multi && (
          <button type="button" className={arrow} onClick={() => s.stepRoom(1)} aria-label={t("nextRoom")} title={t("nextRoom")}>
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>
      {zone && (
        <div className="flex gap-1.5">
          {multi && (
            <button type="button" onClick={() => s.setOnlyThisRoom(!only)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${only ? "bg-stone-900 text-white" : `${glass} text-stone-700`}`}>
              {only ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              {only ? t("showOthers") : t("onlyThisRoom")}
            </button>
          )}
          <button type="button" onClick={() => s.focus(null)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-stone-700 ${glass}`}>
            <LayoutGrid className="size-3.5" /> {t("allRooms")}
          </button>
        </div>
      )}
    </div>
  );
}

/** Top-right shortcuts: Top/3D, Room, Save, More (Size, Lights, Share, Items). On wide screens everything shows. */
export function Shortcuts() {
  const t = useT();
  const view = useDesigner((s) => s.view);
  const panel = useDesigner((s) => s.panel);
  const more = useDesigner((s) => s.moreOpen);
  const lights = useDesigner((s) => s.lights);
  const sizeOpen = useDesigner((s) => s.sizeOpen);
  const shareOpen = useDesigner((s) => s.shareOpen);
  const listOpen = useDesigner((s) => s.listOpen);
  const s = useDesigner.getState();

  const extras = (
    <>
      <RoundButton icon={Ruler} label={t("size")} active={sizeOpen} onClick={() => s.patch({ sizeOpen: !sizeOpen, shareOpen: false, moreOpen: false })} />
      <RoundButton icon={Lightbulb} label={t("lights")} active={lights} onClick={() => s.patch({ lights: !lights })} />
      <RoundButton icon={Share2} label={t("share")} active={shareOpen} onClick={() => s.patch({ shareOpen: !shareOpen, sizeOpen: false, moreOpen: false })} />
      <RoundButton icon={List} label={t("items")} active={listOpen} onClick={() => s.patch({ listOpen: !listOpen, moreOpen: false })} />
    </>
  );

  return (
    // On phones the More tools open as a row beside the More button, clear of the top-left tools and room chip.
    <div className="pointer-events-auto flex items-end gap-1.5 md:items-start">
      {more && <div className="flex gap-1.5 md:hidden">{extras}</div>}
      <div className="flex flex-col gap-1.5 md:flex-row">
        <div className="hidden gap-1.5 md:flex">{extras}</div>
        <RoundButton icon={view === "top" ? Box : Grid2x2} label={view === "top" ? t("view3d") : t("top")} showLabel onClick={() => s.setView(view === "top" ? "3d" : "top")} />
        <RoundButton icon={Pencil} label={t("room")} active={panel === "room"} onClick={() => s.setPanel(panel === "room" ? "catalog" : "room")} />
        <RoundButton icon={Save} label={t("save")} onClick={() => saveDesign()} />
        <RoundButton icon={more ? X : Ellipsis} label={more ? t("close") : t("more")} active={more} onClick={() => s.patch({ moreOpen: !more })} className="md:hidden" />
      </div>
    </div>
  );
}

export function SizeMenu() {
  const t = useT();
  const open = useDesigner((s) => s.sizeOpen);
  const m = useDesigner((s) => s.measure);
  const only = useDesigner((s) => s.onlyThisRoom && !!s.focusZone);
  const setMeasure = useDesigner((s) => s.setMeasure);
  const patch = useDesigner((s) => s.patch);
  if (!open) return null;
  return (
    <div className={`pointer-events-auto w-64 rounded-2xl p-3 pt-1 ${glass}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-900">{t("measurements")}</p>
        <CloseButton onClick={() => patch({ sizeOpen: false })} />
      </div>
      <Toggle label={t("itemSize")} checked={m.item} onChange={(v) => setMeasure({ item: v })} />
      <Toggle label={t("distances")} checked={m.distance} onChange={(v) => setMeasure({ distance: v })} />
      <div className={only ? "opacity-40" : ""}>
        <Toggle label={t("roomSizeLines")} checked={m.room} onChange={(v) => setMeasure({ room: v })} />
      </div>
    </div>
  );
}

function pictureMeta() {
  const s = useDesigner.getState();
  const lang = useLangStore.getState().lang;
  const title = s.doc?.name || planTitle(s.doc?.planId ?? "", lang);
  const subtitle = `${planTitle(s.doc?.planId ?? "", lang)} · ${new Date().toLocaleDateString()}`;
  return { title, subtitle };
}

export async function sharePictureNow(view: "current" | "top", clean: boolean) {
  const { title, subtitle } = pictureMeta();
  const blob = await capturePicture({ view, clean, title, subtitle });
  if (!blob) return;
  const result = await sharePicture(blob, `${title.replace(/[^\p{L}\p{N}]+/gu, "-")}.png`, title);
  if (result === "downloaded") toast(translateNow("pictureSaved"));
}

export function ShareMenu() {
  const t = useT();
  const open = useDesigner((s) => s.shareOpen);
  const patch = useDesigner((s) => s.patch);
  if (!open) return null;
  const go = (view: "current" | "top") => {
    patch({ shareOpen: false });
    void sharePictureNow(view, false);
  };
  const b = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-stone-800 hover:bg-stone-100";
  return (
    <div className={`pointer-events-auto w-60 rounded-2xl p-2 pt-1 ${glass}`}>
      <div className="flex items-center justify-between pl-2">
        <p className="text-sm font-semibold text-stone-900">{t("shareTitle")}</p>
        <CloseButton onClick={() => patch({ shareOpen: false })} />
      </div>
      <button type="button" className={b} onClick={() => go("current")}>
        <ImageIcon className="size-4" /> {t("shareCurrent")}
      </button>
      <button type="button" className={b} onClick={() => go("top")}>
        <Grid2x2 className="size-4" /> {t("shareTop")}
      </button>
      <button
        type="button"
        className={b}
        onClick={() => {
          patch({ shareOpen: false });
          void shareLinkNow();
        }}
      >
        <Link2 className="size-4" /> {t("copyLink")}
      </button>
    </div>
  );
}

/** Phones get the share sheet; elsewhere the link goes to the clipboard. */
async function shareLinkNow() {
  const url = shareLink();
  if (!url) return;
  if (typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches) {
    try {
      await navigator.share({ url, title: pictureMeta().title });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast(translateNow("linkCopied"));
  } catch {
    toast(translateNow("linkFailed"));
  }
}

export function FullViewControls() {
  const t = useT();
  const full = useDesigner((s) => s.fullView);
  const patch = useDesigner((s) => s.patch);
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      {full && <RoundButton icon={Share2} label={t("sharePicture")} onClick={() => void sharePictureNow("current", true)} />}
      <RoundButton
        icon={full ? Minimize : Maximize}
        label={full ? t("exitFullView") : t("fullView")}
        active={full}
        onClick={() => patch({ fullView: !full, moreOpen: false, sizeOpen: false, shareOpen: false, listOpen: false, menu: null })}
      />
    </div>
  );
}

export function ItemList() {
  const t = useT();
  const lang = useLang();
  const open = useDesigner((s) => s.listOpen);
  const items = useDesigner((s) => s.doc?.items);
  const selected = useDesigner((s) => s.selected);
  const [tab, setTab] = useState<"items" | "shopping">("items");
  const s = useDesigner.getState();
  if (!open || !items) return null;
  const tabBtn = (id: typeof tab) => `flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${tab === id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`;
  return (
    <div className={`pointer-events-auto flex max-h-full w-80 flex-col rounded-2xl ${glass}`}>
      <div className="flex items-center gap-2 py-1 pl-3 pr-1">
        <div className="flex flex-1 gap-1 rounded-xl bg-stone-100 p-0.5" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "items"} className={tabBtn("items")} onClick={() => setTab("items")}>
            {t("placedItems")} · {items.length}
          </button>
          <button type="button" role="tab" aria-selected={tab === "shopping"} className={tabBtn("shopping")} onClick={() => setTab("shopping")}>
            {t("shoppingList")}
          </button>
        </div>
        <CloseButton onClick={() => s.patch({ listOpen: false })} />
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-stone-500">{t("noItems")}</p>
      ) : tab === "items" ? (
        <ol className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {items.map((it, i) => {
            const cat = getCatalogItem(it.itemId);
            return (
              <li key={it.uid}>
                <button
                  type="button"
                  onClick={() => {
                    s.select(it.uid);
                    s.requestCam({ kind: "item", uid: it.uid });
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm ${selected.includes(it.uid) ? "bg-amber-100" : "hover:bg-stone-100"}`}
                >
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-stone-900">{i + 1}</span>
                  <span className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: colorOf(cat, it.colorId) }} />
                  <ItemIcon item={cat} className="size-4 shrink-0 text-stone-500" />
                  <span className="min-w-0 flex-1 truncate text-stone-800">{cat ? tx(cat.name, lang) : t("unknownItem")}</span>
                  {it.locked && <Lock className="size-3.5 text-stone-400" />}
                  {cat && <span className="shrink-0 text-xs tabular-nums text-stone-500">{formatPrice(cat.price, lang)}</span>}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <ShoppingLines />
      )}
      {items.length > 0 && (
        <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2.5 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
            <ShoppingBag className="size-4" /> {t("total")}
          </span>
          <span className="font-semibold tabular-nums text-stone-900">{formatPrice(totalPrice(items), lang)}</span>
        </div>
      )}
    </div>
  );
}

/** Placed items grouped by product and colour, like a basket. */
function ShoppingLines() {
  const lang = useLang();
  const items = useDesigner((s) => s.doc?.items) ?? [];
  const s = useDesigner.getState();
  const lines = new Map<string, { itemId: string; colorId: string; uids: string[] }>();
  for (const it of items) {
    const key = `${it.itemId}:${it.colorId}`;
    const line = lines.get(key) ?? { itemId: it.itemId, colorId: it.colorId, uids: [] };
    line.uids.push(it.uid);
    lines.set(key, line);
  }
  return (
    <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
      {[...lines.values()].map((l) => {
        const cat = getCatalogItem(l.itemId);
        if (!cat) return null;
        const color = cat.colors.find((c) => c.id === l.colorId) ?? cat.colors[0];
        return (
          <li key={`${l.itemId}:${l.colorId}`}>
            <button
              type="button"
              onClick={() => {
                s.select(l.uids[0]);
                s.requestCam({ kind: "item", uid: l.uids[0] });
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-stone-100"
            >
              <span className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: color?.hex }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-stone-800">{tx(cat.name, lang)}</span>
                <span className="block truncate text-[11px] text-stone-500">
                  {color ? tx(color.name, lang) : ""}
                  {cat.sku ? ` · ${cat.sku}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-right text-xs tabular-nums">
                <span className="block text-stone-500">
                  {l.uids.length} × {formatPrice(cat.price, lang)}
                </span>
                <span className="block font-semibold text-stone-900">{formatPrice(cat.price * l.uids.length, lang)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Long-press (touch) or right-click (mouse) quick menu. */
export function ContextMenu() {
  const t = useT();
  const lang = useLang();
  const menu = useDesigner((s) => s.menu);
  const it = useDesigner((s) => s.doc?.items.find((i) => i.uid === s.menu?.uid));
  const s = useDesigner.getState();
  if (!menu || !it) return null;
  // Above the finger when there is room, else below; kept on screen.
  const W = 288;
  const H = 150;
  const left = Math.min(Math.max(8, menu.x - W / 2), window.innerWidth - W - 8);
  const top = menu.y - H - 24 > 8 ? menu.y - H - 24 : Math.min(menu.y + 24, window.innerHeight - H - 8);
  const cat = getCatalogItem(it.itemId);
  const close = () => s.patch({ menu: null });
  const b = "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40";
  return (
    <div
      role="menu"
      aria-label={t("quickMenu")}
      className={`fixed z-40 w-72 rounded-2xl p-2 ${glass}`}
      style={{ left, top }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 pl-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-900">{cat ? tx(cat.name, lang) : t("unknownItem")}</p>
        <CloseButton onClick={close} />
      </div>
      {cat && cat.colors.length > 1 && (
        <div className="px-2 pb-2">
          <Swatches size="sm" colors={cat.colors.map((c) => ({ id: c.id, hex: c.hex, label: tx(c.name, lang) }))} value={it.colorId} onPick={(id) => s.setColor(it.uid, id)} />
        </div>
      )}
      <div className="flex gap-1 border-t border-stone-100 pt-1">
        <button
          type="button"
          className={b}
          onClick={() => {
            s.duplicateSelection();
            close();
          }}
        >
          <Copy className="size-4" /> {t("duplicate")}
        </button>
        <button type="button" className={b} onClick={() => s.toggleLock(it.uid)}>
          {it.locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />} {it.locked ? t("unlock") : t("lock")}
        </button>
        <button type="button" className={`${b} text-red-600 hover:bg-red-50`} disabled={it.locked} onClick={() => s.removeItems([it.uid])}>
          <Trash2 className="size-4" /> {t("delete")}
        </button>
      </div>
    </div>
  );
}

function SaveDialog() {
  const t = useT();
  const patch = useDesigner((s) => s.patch);
  const [name, setName] = useState(() => useDesigner.getState().doc?.name ?? "");
  return (
    <Modal
      title={t("nameDesign")}
      onClose={() => patch({ dialog: null })}
      footer={
        <>
          <Btn onClick={() => patch({ dialog: null })}>{t("cancel")}</Btn>
          <Btn kind="primary" disabled={!name.trim()} onClick={() => saveDesign(name.trim())}>
            {t("save")}
          </Btn>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) saveDesign(name.trim());
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("untitled")}
          maxLength={60}
          aria-label={t("designName")}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-base text-stone-900 outline-none focus:border-stone-600"
        />
      </form>
    </Modal>
  );
}

export function Dialogs() {
  const t = useT();
  const dialog = useDesigner((s) => s.dialog);
  const patch = useDesigner((s) => s.patch);
  if (dialog === "save") return <SaveDialog />;
  if (dialog === "reset") {
    return (
      <Modal
        title={t("resetQ")}
        onClose={() => patch({ dialog: null })}
        footer={
          <>
            <Btn onClick={() => patch({ dialog: null })}>{t("cancel")}</Btn>
            <Btn kind="danger" onClick={() => useDesigner.getState().resetDesign()}>
              {t("reset")}
            </Btn>
          </>
        }
      >
        {t("resetBody")}
      </Modal>
    );
  }
  return null;
}
