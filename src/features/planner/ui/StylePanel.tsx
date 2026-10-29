"use client";

import { X } from "lucide-react";
import { floorMaterials, wallPalette } from "@/features/planner/lib/styles";
import { usePlannerStore } from "@/features/planner/store/usePlannerStore";
import type { FloorMaterial } from "@/types/planner";

export default function StylePanel() {
  const open = usePlannerStore((s) => s.styleOpen);
  const wallColor = usePlannerStore((s) => s.design?.wallColor);
  const floor = usePlannerStore((s) => s.design?.floorMaterial);
  const setWallColor = usePlannerStore((s) => s.setWallColor);
  const setFloor = usePlannerStore((s) => s.setFloor);
  const setStyleOpen = usePlannerStore((s) => s.setStyleOpen);
  if (!open || !wallColor) return null;

  return (
    <div className="absolute right-3 top-3 z-20 w-72 rounded-xl border border-stone-200 bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">Room style</h2>
        <button type="button" onClick={() => setStyleOpen(false)} className="rounded-full p-1 hover:bg-stone-100" aria-label="Close style panel">
          <X className="size-4" />
        </button>
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">Wall colour</p>
      <div className="grid grid-cols-5 gap-2">
        {wallPalette.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={c.label}
            aria-label={c.label}
            onClick={() => setWallColor(c.hex)}
            className={`aspect-square rounded-full ring-offset-2 ${
              c.hex.toLowerCase() === wallColor.toLowerCase() ? "ring-2 ring-stone-900" : "ring-1 ring-stone-300"
            }`}
            style={{ background: c.hex }}
          />
        ))}
        <label
          className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-stone-300"
          title="Custom colour"
          style={{ background: "conic-gradient(#f87171,#facc15,#4ade80,#60a5fa,#c084fc,#f87171)" }}
        >
          <input
            type="color"
            value={wallColor}
            onChange={(e) => setWallColor(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Custom wall colour"
          />
        </label>
      </div>

      <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wider text-stone-500">Floor</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(floorMaterials) as FloorMaterial[]).map((m) => {
          const f = floorMaterials[m];
          return (
            <button
              key={m}
              type="button"
              onClick={() => setFloor(m)}
              className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs font-medium transition ${
                floor === m ? "border-stone-900 bg-stone-50" : "border-stone-200 hover:border-stone-400"
              }`}
            >
              <span
                className="size-6 shrink-0 rounded"
                style={{
                  background:
                    f.pattern === "planks"
                      ? `repeating-linear-gradient(0deg, ${f.base} 0 5px, ${f.line} 5px 6px)`
                      : f.pattern === "tiles"
                        ? `repeating-conic-gradient(${f.base} 0 25%, ${f.line} 0 50%) 0 0/12px 12px`
                        : f.base,
                }}
              />
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
