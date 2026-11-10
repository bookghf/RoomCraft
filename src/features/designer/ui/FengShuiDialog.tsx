"use client";

import { useMemo, useState } from "react";
import { getCatalogItem } from "@/features/designer/content";
import { tx, useLang, useT, type TKey } from "@/features/designer/i18n";
import { homeFengShui, type FengShuiGrade, type RoomFengShui } from "@/features/designer/lib/fengshui";
import { useDesigner } from "@/features/designer/store";
import { Btn, Modal } from "./common";

const GRADE_TONE: Record<FengShuiGrade, string> = { excellent: "text-emerald-600", good: "text-emerald-600", fair: "text-amber-600", poor: "text-red-600" };

function ScoreLine({ score, grade }: { score: number; grade: FengShuiGrade }) {
  const t = useT();
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-semibold tabular-nums text-stone-900">{score}</span>
      <span className="text-sm text-stone-500">/ 100</span>
      <span className={`ml-auto text-sm font-semibold ${GRADE_TONE[grade]}`}>{t(`fsGrade_${grade}` as TKey)}</span>
    </div>
  );
}

function RoomDetails({ room }: { room: RoomFengShui }) {
  const t = useT();
  return (
    <>
      <ScoreLine score={room.score} grade={room.grade} />
      <ul className="mt-3 divide-y divide-stone-100 border-y border-stone-100">
        <li className="flex justify-between gap-3 py-1.5">
          <span>{t("fengShuiBase")}</span>
          <span className="tabular-nums text-stone-900">{room.base}</span>
        </li>
        {room.reasons.map((r) => (
          <li key={r.rule} className="flex justify-between gap-3 py-1.5">
            <span>{t(`fs_${r.rule}` as TKey)}</span>
            <span className={`shrink-0 tabular-nums font-medium ${r.points > 0 ? "text-emerald-600" : "text-red-600"}`}>{r.points > 0 ? `+${r.points}` : r.points}</span>
          </li>
        ))}
      </ul>
      {!room.reasons.length && <p className="mt-2">{t("fengShuiNone")}</p>}
    </>
  );
}

/** Feng Shui score for one room or the whole home, as the design stands when the dialog opens. */
export function FengShuiDialog() {
  const t = useT();
  const lang = useLang();
  const patch = useDesigner((s) => s.patch);
  const doc = useDesigner((s) => s.doc);
  const plan = useDesigner((s) => s.plan);
  const focusZone = useDesigner((s) => s.focusZone);
  const home = useMemo(() => (doc && plan ? homeFengShui(plan, doc.items, getCatalogItem) : null), [doc, plan]);
  const firstFurnished = home?.rooms.find((r) => r.items > 0)?.zoneId;
  const [mode, setMode] = useState<"room" | "all">(focusZone ? "room" : "all");
  const [zoneId, setZoneId] = useState<string | undefined>(focusZone ?? firstFurnished ?? plan?.zones[0]?.id);
  if (!home || !plan) return null;
  const zoneName = (id: string) => tx(plan.zones.find((z) => z.id === id)?.name, lang);
  const room = home.rooms.find((r) => r.zoneId === zoneId) ?? home.rooms[0];
  const tab = (m: "room" | "all", label: string) => (
    <button type="button" onClick={() => setMode(m)} className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium ${mode === m ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`} aria-pressed={mode === m}>
      {label}
    </button>
  );

  return (
    <Modal title={t("fengShuiTitle")} onClose={() => patch({ dialog: null })} footer={<Btn kind="primary" onClick={() => patch({ dialog: null })}>{t("close")}</Btn>}>
      <div className="mb-3 flex gap-1 rounded-full bg-stone-100 p-1">
        {tab("room", t("fsThisRoom"))}
        {tab("all", t("allRooms"))}
      </div>
      {mode === "room" ? (
        <>
          {plan.zones.length > 1 && (
            <label className="mb-3 flex items-center gap-2">
              <span className="text-xs text-stone-500">{t("fsRoom")}</span>
              <select className="flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm text-stone-900" value={room.zoneId} onChange={(e) => setZoneId(e.target.value)}>
                {plan.zones.map((z) => (
                  <option key={z.id} value={z.id}>{tx(z.name, lang)}</option>
                ))}
              </select>
            </label>
          )}
          <RoomDetails room={room} />
        </>
      ) : (
        <>
          <p className="mb-1 text-xs text-stone-500">{t("fsOverall")}</p>
          <ScoreLine score={home.score} grade={home.grade} />
          <p className="mt-1 text-xs text-stone-400">{home.scored ? t("fsAverageNote", { n: home.scored }) : t("fsNoRooms")}</p>
          <ul className="mt-3 divide-y divide-stone-100 border-y border-stone-100">
            {home.rooms.map((r) => (
              <li key={r.zoneId}>
                <button
                  type="button"
                  className="flex w-full justify-between gap-3 py-1.5 text-left hover:text-stone-900"
                  onClick={() => {
                    setZoneId(r.zoneId);
                    setMode("room");
                  }}
                >
                  <span>{zoneName(r.zoneId)}</span>
                  {r.items ? <span className={`tabular-nums font-medium ${GRADE_TONE[r.grade]}`}>{r.score}</span> : <span className="text-xs text-stone-400">{t("fsNoFurniture")}</span>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-3 text-xs text-stone-400">{t("fengShuiNote")}</p>
    </Modal>
  );
}
