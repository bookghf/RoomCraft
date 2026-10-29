import type { PlanSpec, Text, XZ, Zone } from "@/features/designer/types";
import { showroomSpecs } from "./showrooms";

/**
 * Unit plans for the designer. The 30, 32 and 65 m² layouts are approximations of the
 * sales-drawing room arrangements (walls on centre-lines, sizes in metres); plan heights
 * default to 2.60 m because the drawings do not state them.
 */

const t = (en: string, th: string, zh: string): Text => ({ en, th, zh });

const names = {
  room: t("Room", "ห้อง", "房间"),
  bedroom: t("Bedroom", "ห้องนอน", "卧室"),
  master: t("Master bedroom", "ห้องนอนใหญ่", "主卧"),
  bedroom2: t("Bedroom 2", "ห้องนอน 2", "次卧"),
  living: t("Living room", "ห้องนั่งเล่น", "客厅"),
  livingDining: t("Living & dining", "นั่งเล่นและทานอาหาร", "客餐厅"),
  kitchen: t("Kitchen", "ครัว", "厨房"),
  bath: t("Bathroom", "ห้องน้ำ", "浴室"),
  bath2: t("Bathroom 2", "ห้องน้ำ 2", "浴室 2"),
  balcony: t("Balcony", "ระเบียง", "阳台"),
};

function rect(x0: number, z0: number, x1: number, z1: number): XZ[] {
  return [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ];
}

function zone(id: string, kind: Zone["kind"], name: Text, polygon: XZ[]): Zone {
  return { id, kind, name, polygon };
}

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
    zones: [zone("room", "room", names.room, rect(0, 0, w, d))],
    openings: [
      { type: "window", at: [w / 2, 0], width: Math.min(1.6, w - 0.6), sill: 0.9, height: 1.3 },
      { type: "door", at: [w - 0.75, d], width: 0.9 },
    ],
    fixtures: [],
    ceiling: CEILING_LIMITS.default,
    resizable: { w, d },
  };
}

const plan30: PlanSpec = {
  id: "1br-30",
  name: t("1 Bedroom 30 m²", "1 ห้องนอน 30 ตร.ม.", "一室 30 m²"),
  area: 30,
  zones: [
    zone("bath", "bath", names.bath, rect(0, 0, 1.6, 2)),
    zone("kitchen", "kitchen", names.kitchen, rect(1.6, 0, 3, 2)),
    zone("living", "room", names.living, rect(0, 2, 3, 4)),
    zone("bedroom", "room", names.bedroom, rect(3, 0, 6, 4)),
    zone("balcony", "balcony", names.balcony, rect(0, 4, 3, 5)),
  ],
  open: [[[1.6, 2], [3, 2]]],
  openings: [
    { type: "door", at: [2.3, 0], width: 0.9 },
    { type: "door", at: [1.6, 1.4], width: 0.7 },
    { type: "door", at: [3, 2.6], width: 0.8 },
    { type: "slider", at: [1.5, 4], width: 2 },
    { type: "window", at: [4.5, 4], width: 1.6, sill: 0.5, height: 1.7 },
    { type: "window", at: [6, 2], width: 1.2, sill: 0.9, height: 1.2 },
  ],
  fixtures: [
    { id: "shower", type: "shower", x: 0.51, z: 0.51, rot: 0, w: 0.9, d: 0.9, h: 2 },
    { id: "toilet", type: "toilet", x: 0.41, z: 1.55, rot: Math.PI / 2, w: 0.4, d: 0.7, h: 0.8 },
    { id: "basin", type: "basin", x: 1.25, z: 0.285, rot: 0, w: 0.5, d: 0.45, h: 0.85 },
    { id: "kitchen", type: "kitchen", x: 2.64, z: 1.32, rot: -Math.PI / 2, w: 1.3, d: 0.6, h: 0.9 },
  ],
  ceiling: CEILING_LIMITS.default,
};

const plan32: PlanSpec = {
  id: "1br-32",
  name: t("1 Bedroom 32 m²", "1 ห้องนอน 32 ตร.ม.", "一室 32 m²"),
  area: 32,
  zones: [
    zone("bath", "bath", names.bath, rect(0, 0, 1.8, 2.2)),
    zone("kitchen", "kitchen", names.kitchen, rect(1.8, 0, 3.4, 2.2)),
    zone("living", "room", names.living, rect(0, 2.2, 3.4, 4.4)),
    zone("bedroom", "room", names.bedroom, rect(3.4, 0, 6.4, 4.4)),
    zone("balcony", "balcony", names.balcony, rect(3.4, 4.4, 6.4, 5.4)),
  ],
  open: [[[1.8, 2.2], [3.4, 2.2]]],
  openings: [
    { type: "door", at: [2.6, 0], width: 0.9 },
    { type: "door", at: [1.3, 2.2], width: 0.7 },
    { type: "door", at: [3.4, 3], width: 0.8 },
    { type: "window", at: [1.7, 4.4], width: 2, sill: 0.5, height: 1.7 },
    { type: "slider", at: [4.9, 4.4], width: 1.8 },
    { type: "window", at: [6.4, 1.6], width: 1.2, sill: 0.9, height: 1.2 },
  ],
  fixtures: [
    { id: "shower", type: "shower", x: 0.51, z: 0.51, rot: 0, w: 0.9, d: 0.9, h: 2 },
    { id: "toilet", type: "toilet", x: 0.41, z: 1.6, rot: Math.PI / 2, w: 0.4, d: 0.7, h: 0.8 },
    { id: "basin", type: "basin", x: 1.35, z: 0.285, rot: 0, w: 0.5, d: 0.45, h: 0.85 },
    { id: "kitchen", type: "kitchen", x: 3.04, z: 1.45, rot: -Math.PI / 2, w: 1.38, d: 0.6, h: 0.9 },
    { id: "fridge", type: "fridge", x: 2.19, z: 1.7, rot: Math.PI / 2, w: 0.6, d: 0.65, h: 1.7 },
  ],
  ceiling: CEILING_LIMITS.default,
};

const plan65: PlanSpec = {
  id: "2br-65",
  name: t("2 Bedrooms 65 m²", "2 ห้องนอน 65 ตร.ม.", "两室 65 m²"),
  area: 65,
  zones: [
    zone("bedroom2", "room", names.bedroom2, rect(0, 0, 3.4, 3.6)),
    zone("bath2", "bath", names.bath2, rect(3.4, 0, 5.2, 2.2)),
    zone("kitchen", "kitchen", names.kitchen, rect(5.2, 0, 9, 2.2)),
    zone("master", "room", names.master, rect(0, 3.6, 3.4, 6.4)),
    zone("living", "room", names.livingDining, [
      [3.4, 2.2],
      [9, 2.2],
      [9, 6.4],
      [5.2, 6.4],
      [5.2, 5],
      [3.4, 5],
    ]),
    zone("bath", "bath", names.bath, rect(3.4, 5, 5.2, 6.4)),
    zone("balcony", "balcony", names.balcony, rect(5.2, 6.4, 9, 7.6)),
  ],
  open: [[[5.2, 2.2], [9, 2.2]]],
  openings: [
    { type: "door", at: [8.2, 0], width: 0.95 },
    { type: "door", at: [4.3, 2.2], width: 0.75 },
    { type: "door", at: [3.4, 2.9], width: 0.8 },
    { type: "door", at: [3.4, 4.3], width: 0.8 },
    { type: "door", at: [4.6, 5], width: 0.7 },
    { type: "slider", at: [7.1, 6.4], width: 2.4 },
    { type: "window", at: [0, 1.8], width: 1.4, sill: 0.9, height: 1.2 },
    { type: "window", at: [0, 5], width: 1.6, sill: 0.6, height: 1.5 },
    { type: "window", at: [1.7, 6.4], width: 1.4, sill: 0.9, height: 1.2 },
    { type: "window", at: [9, 1.1], width: 1, sill: 1.1, height: 0.9 },
    { type: "window", at: [9, 4.3], width: 1.8, sill: 0.5, height: 1.7 },
  ],
  fixtures: [
    { id: "shower2", type: "shower", x: 3.91, z: 0.51, rot: 0, w: 0.9, d: 0.9, h: 2 },
    { id: "toilet2", type: "toilet", x: 4.79, z: 0.6, rot: -Math.PI / 2, w: 0.4, d: 0.7, h: 0.8 },
    { id: "basin2", type: "basin", x: 3.685, z: 1.6, rot: Math.PI / 2, w: 0.5, d: 0.45, h: 0.85 },
    { id: "shower", type: "shower", x: 3.91, z: 5.89, rot: 0, w: 0.9, d: 0.9, h: 2 },
    { id: "toilet", type: "toilet", x: 4.75, z: 5.99, rot: Math.PI, w: 0.4, d: 0.7, h: 0.8 },
    { id: "kitchen", type: "kitchen", x: 6.43, z: 0.36, rot: 0, w: 2.34, d: 0.6, h: 0.9 },
    { id: "fridge", type: "fridge", x: 5.59, z: 1.45, rot: Math.PI / 2, w: 0.6, d: 0.65, h: 1.7 },
  ],
  ceiling: CEILING_LIMITS.default,
};

export const planSpecs: PlanSpec[] = [emptyPlanSpec(), plan30, plan32, plan65];

/** Unit floor plans and furnished showrooms, everything the designer can open. */
export const allPlanSpecs: PlanSpec[] = [...planSpecs, ...showroomSpecs];

export function getPlanSpec(id: string, size?: { w: number; d: number }): PlanSpec | undefined {
  if (id === EMPTY_PLAN_ID) return emptyPlanSpec(size?.w, size?.d);
  return allPlanSpecs.find((p) => p.id === id);
}
