"use client";

import { usePlannerStore } from "@/features/planner/store/usePlannerStore";

export default function ViewpointSwitcher() {
  const viewpoints = usePlannerStore((s) => s.room?.viewpoints);
  const active = usePlannerStore((s) => s.activeViewpoint);
  const goToViewpoint = usePlannerStore((s) => s.goToViewpoint);
  if (!viewpoints?.length) return null;

  return (
    <div className="flex gap-1 rounded-full bg-white/90 p-1 shadow-lg ring-1 ring-stone-200 backdrop-blur" role="toolbar" aria-label="Camera viewpoints">
      {viewpoints.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => goToViewpoint(v.id)}
          aria-pressed={active === v.id}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            active === v.id ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
