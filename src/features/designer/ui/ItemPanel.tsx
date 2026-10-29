"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronsDown, ChevronsUp, Copy, Lock, LockOpen, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { useRef } from "react";
import { getCatalogItem } from "@/features/designer/data/catalog";
import { tx, useLang, useT } from "@/features/designer/i18n";
import { nudgeVector } from "@/features/designer/scene/interaction";
import { beginGesture, buzz, endGesture, useDesigner } from "@/features/designer/store";
import { ItemIcon } from "./CatalogPanel";
import { PanelHeader, Swatches } from "./common";

const STEPS = [0.01, 0.05, 0.1];
const SNAP_DEG = 45;
const SNAP_WITHIN = 4;

const toDeg = (r: number) => Math.round((r * 180) / Math.PI);
const toRad = (d: number) => (d * Math.PI) / 180;

export function nudge(dir: "left" | "right" | "away" | "closer") {
  const s = useDesigner.getState();
  const v = nudgeVector(dir, s.nudgeStep);
  const it = s.doc?.items.find((i) => i.uid === s.selected[0]);
  const wall = s.selected.length === 1 && it && getCatalogItem(it.itemId)?.mount === "wall";
  if (wall) {
    if (dir === "left" || dir === "right") s.nudgeSelection(v.along, 0);
    else s.nudgeSelection(0, 0, dir === "away" ? s.nudgeStep : -s.nudgeStep);
  } else s.nudgeSelection(v.dx, v.dz);
}

export function NudgePad({ wall }: { wall?: boolean }) {
  const t = useT();
  const step = useDesigner((s) => s.nudgeStep);
  const patch = useDesigner((s) => s.patch);
  const b = "inline-flex size-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-100 active:scale-95";
  return (
    <div className="flex items-center gap-3">
      <div className="grid grid-cols-3 gap-1">
        <span />
        <button type="button" className={b} onClick={() => nudge("away")} aria-label={wall ? t("raise") : t("moveAway")} title={wall ? t("raise") : t("moveAway")}>
          {wall ? <ChevronsUp className="size-4" /> : <ArrowUp className="size-4" />}
        </button>
        <span />
        <button type="button" className={b} onClick={() => nudge("left")} aria-label={t("moveLeft")} title={t("moveLeft")}>
          <ArrowLeft className="size-4" />
        </button>
        <button type="button" className={b} onClick={() => nudge("closer")} aria-label={wall ? t("lower") : t("moveCloser")} title={wall ? t("lower") : t("moveCloser")}>
          {wall ? <ChevronsDown className="size-4" /> : <ArrowDown className="size-4" />}
        </button>
        <button type="button" className={b} onClick={() => nudge("right")} aria-label={t("moveRight")} title={t("moveRight")}>
          <ArrowRight className="size-4" />
        </button>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{t("step")}</p>
        <div className="flex rounded-full border border-stone-200 p-0.5">
          {STEPS.map((s) => (
            <button key={s} type="button" onClick={() => patch({ nudgeStep: s })} className={`rounded-full px-2.5 py-1 text-xs font-medium ${step === s ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
              {Math.round(s * 100)} cm
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RotationSlider({ uid, rot }: { uid: string; rot: number }) {
  const t = useT();
  const rotateTo = useDesigner((s) => s.rotateTo);
  const active = useRef(false);
  const lastSnap = useRef<number | null>(null);
  const lastWarn = useRef(0);
  const deg = toDeg(rot);

  function begin() {
    if (active.current) return;
    active.current = true;
    beginGesture();
  }
  function end() {
    if (!active.current) return;
    active.current = false;
    endGesture();
  }
  function change(raw: number) {
    let d = raw;
    const nearest = Math.round(d / SNAP_DEG) * SNAP_DEG;
    if (Math.abs(d - nearest) <= SNAP_WITHIN) d = nearest;
    if (d === nearest && lastSnap.current !== nearest) buzz(5);
    lastSnap.current = d === nearest ? nearest : null;
    if (!rotateTo(uid, toRad(d === 180 ? 180 : d)) && performance.now() - lastWarn.current > 600) {
      lastWarn.current = performance.now();
      buzz([30, 40, 30]);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{t("rotation")}</p>
        <span className="text-xs font-semibold tabular-nums text-stone-700">{deg}°</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => useDesigner.getState().turnSelection(Math.PI / 4)} className="rounded-full p-1.5 text-stone-600 hover:bg-stone-100" aria-label={t("turnLeft")} title={t("turnLeft")}>
          <RotateCcw className="size-4" />
        </button>
        <div className="relative flex-1">
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={deg}
            onPointerDown={begin}
            onPointerUp={end}
            onKeyDown={begin}
            onKeyUp={end}
            onBlur={end}
            onChange={(e) => change(Number(e.target.value))}
            aria-label={t("rotation")}
            className="h-6 w-full cursor-pointer accent-stone-900"
          />
          <div className="pointer-events-none flex justify-between px-[7px] text-[9px] text-stone-400">
            {[-180, -90, 0, 90, 180].map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => useDesigner.getState().turnSelection(-Math.PI / 4)} className="rounded-full p-1.5 text-stone-600 hover:bg-stone-100" aria-label={t("turnRight")} title={t("turnRight")}>
          <RotateCw className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function ActionRow({ locked, onLock }: { locked?: boolean; onLock?: () => void }) {
  const t = useT();
  const duplicate = useDesigner((s) => s.duplicateSelection);
  const remove = useDesigner((s) => s.removeSelection);
  const b = "flex flex-1 flex-col items-center gap-1 rounded-xl border border-stone-200 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-40";
  return (
    <div className="flex gap-2">
      <button type="button" className={b} onClick={duplicate}>
        <Copy className="size-4" />
        {t("duplicate")}
      </button>
      {onLock && (
        <button type="button" className={`${b} ${locked ? "border-stone-900 bg-stone-900 text-white hover:bg-stone-800" : ""}`} onClick={onLock} aria-pressed={locked}>
          {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
          {locked ? t("locked") : t("lock")}
        </button>
      )}
      <button type="button" className={`${b} text-red-600 hover:bg-red-50`} onClick={remove} disabled={locked}>
        <Trash2 className="size-4" />
        {t("delete")}
      </button>
    </div>
  );
}

export default function ItemPanel() {
  const t = useT();
  const lang = useLang();
  const it = useDesigner((s) => s.doc?.items.find((i) => i.uid === s.selected[0]));
  const select = useDesigner((s) => s.select);
  const setColor = useDesigner((s) => s.setColor);
  const toggleLock = useDesigner((s) => s.toggleLock);
  if (!it) return null;
  const cat = getCatalogItem(it.itemId);
  const wall = cat?.mount === "wall";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title={cat ? tx(cat.name, lang) : t("unknownItem")} onClose={() => select(null)} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
            <ItemIcon item={cat} className="size-5" />
          </span>
          {cat && cat.colors.length > 1 && <Swatches colors={cat.colors.map((c) => ({ id: c.id, hex: c.hex, label: tx(c.name, lang) }))} value={it.colorId} onPick={(id) => setColor(it.uid, id)} />}
        </div>
        {!wall && !it.locked && <RotationSlider uid={it.uid} rot={it.rot} />}
        {!it.locked && <NudgePad wall={wall} />}
        <ActionRow locked={it.locked} onLock={() => toggleLock(it.uid)} />
        <p className="hidden text-[11px] text-stone-400 md:block">{t("keysHint")}</p>
      </div>
    </div>
  );
}
