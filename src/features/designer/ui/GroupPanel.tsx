"use client";

import { RotateCcw, RotateCw } from "lucide-react";
import { useT } from "@/features/designer/i18n";
import { useDesigner } from "@/features/designer/store";
import { PanelHeader } from "./common";
import { ActionRow, NudgePad } from "./ItemPanel";

export default function GroupPanel() {
  const t = useT();
  const count = useDesigner((s) => s.selected.length);
  const turn = useDesigner((s) => s.turnSelection);
  const patch = useDesigner((s) => s.patch);
  const b = "flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50";
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader
        title={t("selectedN", { n: count })}
        subtitle={t("select")}
        onClose={() => {
          useDesigner.getState().setSelectMode(false);
          useDesigner.getState().select(null);
          patch({ menu: null });
        }}
      />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <p className="text-sm text-stone-500">{t("groupHint")}</p>
        {count > 0 && (
          <>
            <div className="flex gap-2">
              <button type="button" className={b} onClick={() => turn(Math.PI / 4)}>
                <RotateCcw className="size-4" /> {t("turnLeft")}
              </button>
              <button type="button" className={b} onClick={() => turn(-Math.PI / 4)}>
                <RotateCw className="size-4" /> {t("turnRight")}
              </button>
            </div>
            <NudgePad />
            <ActionRow />
          </>
        )}
      </div>
    </div>
  );
}
