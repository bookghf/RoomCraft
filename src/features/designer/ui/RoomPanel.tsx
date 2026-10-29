"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { CEILING_LIMITS, EMPTY_LIMITS, EMPTY_PLAN_ID } from "@/features/designer/data/plans";
import { useT, type TKey } from "@/features/designer/i18n";
import { floorMaterials, floorSwatches, patternTexture, wallMaterials, wallSwatches, type PatternKind } from "@/features/designer/lib/materials";
import { beginGesture, endGesture, useDesigner } from "@/features/designer/store";
import { PanelHeader, Swatches } from "./common";
import { useMemo } from "react";

function MaterialChip({ kind, color, active, label, onClick }: { kind: PatternKind; color: string; active: boolean; label: string; onClick: () => void }) {
  const src = useMemo(() => (typeof document === "undefined" ? undefined : (patternTexture(kind).image as HTMLCanvasElement).toDataURL()), [kind]);
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`flex flex-col items-center gap-1 rounded-xl p-1 text-[11px] font-medium ${active ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"}`}>
      <span className="block size-12 rounded-lg ring-1 ring-black/10" style={{ backgroundColor: color, backgroundImage: src ? `url(${src})` : undefined, backgroundSize: "48px", backgroundBlendMode: "multiply" }} />
      {label}
    </button>
  );
}

function Stepper({ label, value, onChange, unit = "m" }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  const b = "inline-flex size-9 items-center justify-center rounded-full border border-stone-200 hover:bg-stone-100 disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-stone-700">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={b} onClick={() => onChange(value - EMPTY_LIMITS.step)} disabled={value <= EMPTY_LIMITS.min} aria-label={`${label} −`}>
          <Minus className="size-4" />
        </button>
        <span className="w-14 text-center text-sm font-semibold tabular-nums">
          {value.toFixed(1)} {unit}
        </span>
        <button type="button" className={b} onClick={() => onChange(value + EMPTY_LIMITS.step)} disabled={value >= EMPTY_LIMITS.max} aria-label={`${label} +`}>
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{title}</h3>
      {children}
    </section>
  );
}

export default function RoomPanel() {
  const t = useT();
  const doc = useDesigner((s) => s.doc);
  const setFloor = useDesigner((s) => s.setFloor);
  const setWall = useDesigner((s) => s.setWall);
  const setCeiling = useDesigner((s) => s.setCeiling);
  const setSize = useDesigner((s) => s.setSize);
  const setPanel = useDesigner((s) => s.setPanel);
  const patch = useDesigner((s) => s.patch);
  if (!doc) return null;
  const sw = (list: string[]) => list.map((hex) => ({ id: hex, hex, label: hex }));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title={t("roomSettings")} onClose={() => setPanel("catalog")}>
        <button type="button" onClick={() => patch({ dialog: "reset" })} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
          <RotateCcw className="size-3.5" /> {t("reset")}
        </button>
      </PanelHeader>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-5">
        <Section title={t("floor")}>
          <div className="flex flex-wrap gap-1">
            {floorMaterials.map((m) => (
              <MaterialChip key={m} kind={m} color={doc.floor.material === m ? doc.floor.color : "#e7e2da"} active={doc.floor.material === m} label={t(`mat_${m}` as TKey)} onClick={() => setFloor(m)} />
            ))}
          </div>
          <Swatches size="sm" colors={sw(floorSwatches)} value={doc.floor.color} onPick={(hex) => setFloor(doc.floor.material, hex)} />
        </Section>

        <Section title={t("walls")}>
          <div className="flex flex-wrap gap-1">
            {wallMaterials.map((m) => (
              <MaterialChip key={m} kind={m} color={doc.wall.material === m ? doc.wall.color : "#e7e2da"} active={doc.wall.material === m} label={t(`mat_${m}` as TKey)} onClick={() => setWall(m)} />
            ))}
          </div>
          <Swatches size="sm" colors={sw(wallSwatches)} value={doc.wall.color} onPick={(hex) => setWall(doc.wall.material, hex)} />
          <p className="text-[11px] text-stone-400">{t("fixedFinishes")}</p>
        </Section>

        {doc.planId === EMPTY_PLAN_ID && doc.size && (
          <Section title={t("roomSize")}>
            <Stepper label={t("width")} value={doc.size.w} onChange={(w) => setSize(w, doc.size!.d)} />
            <Stepper label={t("depth")} value={doc.size.d} onChange={(d) => setSize(doc.size!.w, d)} />
          </Section>
        )}

        <Section title={t("ceilingHeight")}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={CEILING_LIMITS.min}
              max={CEILING_LIMITS.max}
              step={CEILING_LIMITS.step}
              value={doc.ceiling}
              onPointerDown={beginGesture}
              onPointerUp={endGesture}
              onChange={(e) => setCeiling(Number(e.target.value))}
              aria-label={t("ceilingHeight")}
              className="h-6 flex-1 cursor-pointer accent-stone-900"
            />
            <span className="w-16 text-right text-sm font-semibold tabular-nums">{doc.ceiling.toFixed(2)} m</span>
          </div>
        </Section>
      </div>
    </div>
  );
}
