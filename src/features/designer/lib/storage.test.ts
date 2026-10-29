import { describe, expect, it } from "vitest";
import type { DesignDoc } from "@/features/designer/types";
import { createDesignerStorage, RECENT_ITEMS_LIMIT, RECENT_LIMIT, type KV } from "./storage";

function memoryKV(): KV {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}

const doc = (id: string, updatedAt = "2026-10-29T00:00:00.000Z"): DesignDoc => ({
  id,
  planId: "empty",
  name: id,
  items: [],
  floor: { material: "wood", color: "#c8a27a" },
  wall: { material: "paint", color: "#efebe4" },
  ceiling: 2.6,
  size: { w: 4, d: 4 },
  updatedAt,
});

describe("designer storage", () => {
  it("saves, updates and deletes designs", () => {
    const s = createDesignerStorage(memoryKV());
    s.putSaved(doc("a"));
    s.putSaved({ ...doc("a"), name: "renamed" });
    expect(s.savedList()).toHaveLength(1);
    expect(s.getSaved("a")?.name).toBe("renamed");
    s.deleteSaved("a");
    expect(s.savedList()).toHaveLength(0);
  });

  it("keeps the last 10 recent entries, newest first", () => {
    const s = createDesignerStorage(memoryKV());
    for (let i = 0; i < 12; i++) {
      const at = `2026-10-29T00:00:${String(i).padStart(2, "0")}.000Z`;
      s.putRecent({ id: `r${i}`, doc: doc(`r${i}`, at), updatedAt: at });
    }
    const list = s.recentList();
    expect(list).toHaveLength(RECENT_LIMIT);
    expect(list[0].id).toBe("r11");
  });

  it("drops recent changes of a saved design when the design is deleted", () => {
    const s = createDesignerStorage(memoryKV());
    s.putSaved(doc("a"));
    s.putRecent({ id: "a", savedId: "a", doc: doc("a"), updatedAt: "2026-10-29T00:00:00.000Z" });
    s.deleteSaved("a");
    expect(s.recentList()).toHaveLength(0);
  });

  it("keeps the last 12 recently used items without duplicates", () => {
    const s = createDesignerStorage(memoryKV());
    for (let i = 0; i < 15; i++) s.pushRecentItem(`item${i}`);
    s.pushRecentItem("item14");
    const list = s.recentItems();
    expect(list).toHaveLength(RECENT_ITEMS_LIMIT);
    expect(list[0]).toBe("item14");
    expect(new Set(list).size).toBe(list.length);
  });

  it("ignores corrupt data", () => {
    const kv = memoryKV();
    kv.setItem("roomDesigner:saved:v1", "{not json");
    expect(createDesignerStorage(kv).savedList()).toEqual([]);
  });
});
