import { describe, expect, it } from "vitest";
import { getCatalogItem } from "@/features/designer/content";
import { emptyPlanSpec, planSpecs } from "@/features/designer/data/plans";
import type { DItem } from "@/features/designer/types";
import { BASE_SCORE, gradeOf, homeFengShui, roomFengShui } from "./fengshui";
import { resolvePlan } from "./geometry";

// 4 x 4 m room: window at x 1.2–2.8 on the front wall (z = 0), door at x 2.8–3.7 on the back wall (z = 4).
const room = resolvePlan(emptyPlanSpec(4, 4));
const H = Math.PI / 2;
let n = 0;
const item = (itemId: string, x: number, z: number, rot = 0): DItem => ({ uid: `u${n++}`, itemId, colorId: "", x, y: 0, z, rot });
const score = (items: DItem[]) => roomFengShui(room, room.zones[0], items, getCatalogItem);
const rules = (items: DItem[]) => score(items).reasons.map((r) => r.rule);

describe("feng shui", () => {
  it("starts every room from the same base score", () => {
    expect(score([])).toMatchObject({ base: BASE_SCORE, score: BASE_SCORE, reasons: [] });
  });

  it("gives the same layout the same score", () => {
    const layout = [item("bed-double", 1.085, 1.5, H), item("plant", 3.5, 0.5)];
    expect(score(layout)).toEqual(score(layout));
  });

  it("rewards a headboard against a solid wall", () => {
    expect(rules([item("bed-double", 1.085, 1.5, H)])).toEqual(["bedHeadWall"]);
  });

  it("marks down a bed facing the door and a headboard under a window", () => {
    const r = rules([item("bed-double", 3.1, 1.085)]);
    expect(r).toContain("bedFacesDoor");
    expect(r).toContain("bedUnderWindow");
  });

  it("marks down a bed standing away from every wall", () => {
    expect(rules([item("bed-double", 2, 2, H)])).toContain("bedNoHeadWall");
  });

  it("checks whether you can see the door from the desk", () => {
    expect(rules([item("desk", 1, 0.36)])).toContain("deskBackToDoor");
    expect(rules([item("desk", 1, 3.64, Math.PI)])).toContain("deskSeesDoor");
  });

  it("marks down a mirror facing the bed", () => {
    const mirror = { ...item("mirror", 3.925, 1.5, -H), y: 1.2 };
    expect(rules([item("bed-double", 1.085, 1.5, H), mirror])).toContain("mirrorFacesBed");
  });

  it("caps the plant bonus", () => {
    const plants = [item("plant", 0.4, 0.4), item("plant", 3.6, 0.4), item("plant", 0.4, 2), item("plant", 0.4, 3)];
    expect(score(plants).reasons.find((r) => r.rule === "plants")?.points).toBe(6);
  });

  it("adds the rule points to the base score", () => {
    const r = score([item("bed-double", 1.085, 1.5, H)]);
    expect(r.score).toBe(BASE_SCORE + 8);
    expect(r.grade).toBe(gradeOf(r.score));
  });

  it("scores each room from its own furniture and averages the furnished rooms", () => {
    // 1br-30: bedroom x 3–6 / z 0–4, living x 0–3 / z 2–4.
    const plan = resolvePlan(planSpecs.find((p) => p.id === "1br-30")!);
    const home = homeFengShui(plan, [item("bed-double", 4.5, 1.085), item("plant", 0.4, 2.4)], getCatalogItem);
    const bedroom = home.rooms.find((r) => r.zoneId === "bedroom")!;
    const living = home.rooms.find((r) => r.zoneId === "living")!;
    expect(bedroom.items).toBe(1);
    expect(bedroom.reasons.map((r) => r.rule)).toContain("bedHeadWall");
    expect(living.reasons).toEqual([{ rule: "plants", points: 2 }]);
    expect(home.scored).toBe(2);
    expect(home.score).toBe(Math.round((bedroom.score + living.score) / 2));
  });

  it("gives an unfurnished home the base score", () => {
    const plan = resolvePlan(planSpecs.find((p) => p.id === "1br-30")!);
    expect(homeFengShui(plan, [], getCatalogItem)).toMatchObject({ score: BASE_SCORE, scored: 0 });
  });
});
