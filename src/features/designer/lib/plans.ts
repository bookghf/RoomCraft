import type { PlanSpec, Text } from "@/features/designer/types";
import { WALL_T } from "./geometry";

/**
 * Plan helpers that are code, not data: the empty room is generated from its current width
 * and depth, so it is built here rather than loaded from the API.
 */

const t = (en: string, th: string, zh: string): Text => ({ en, th, zh });

export const EMPTY_PLAN_ID = "empty";
export const EMPTY_SIZE = { w: 4, d: 4 };
export const EMPTY_LIMITS = { min: 2, max: 10, step: 0.5 };
export const CEILING_LIMITS = { min: 2.4, max: 3, step: 0.05, default: 2.6 };

/** The empty room is generated from its current width and depth. */
export function emptyPlanSpec(w = EMPTY_SIZE.w, d = EMPTY_SIZE.d): PlanSpec {
  return {
    id: EMPTY_PLAN_ID,
    name: t("Empty room", "ห้องเปล่า", "空房间"),
    area: null,
    zones: [
      {
        id: "room",
        kind: "room",
        name: t("Room", "ห้อง", "房间"),
        polygon: [
          [0, 0],
          [w, 0],
          [w, d],
          [0, d],
        ],
      },
    ],
    openings: [
      { type: "window", at: [w / 2, 0], width: Math.min(1.6, w - 0.6), sill: 0.9, height: 1.3 },
      { type: "door", at: [w - 0.75, d], width: 0.9 },
    ],
    fixtures: [],
    ceiling: CEILING_LIMITS.default,
    resizable: { w, d },
  };
}

/** Inner room size in metres (wall face to wall face). */
export function showroomSize(spec: PlanSpec): { w: number; d: number } {
  const xs = spec.zones[0].polygon.map((p) => p[0]);
  const zs = spec.zones[0].polygon.map((p) => p[1]);
  const cm = (v: number) => Math.round(v * 100) / 100;
  return { w: cm(Math.max(...xs) - Math.min(...xs) - WALL_T), d: cm(Math.max(...zs) - Math.min(...zs) - WALL_T) };
}
