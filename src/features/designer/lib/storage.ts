import { z } from "zod";
import type { DesignDoc } from "@/features/designer/types";

export const KEYS = {
  saved: "roomDesigner:saved:v1",
  recent: "roomDesigner:recent:v1",
  measure: "roomDesigner:measure:v1",
  recentItems: "roomDesigner:recentItems:v1",
} as const;

export const RECENT_LIMIT = 10;
export const RECENT_ITEMS_LIMIT = 12;

const itemSchema = z.object({
  uid: z.string(),
  itemId: z.string(),
  colorId: z.string(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
  rot: z.number(),
  wallId: z.string().optional(),
  side: z.union([z.literal(1), z.literal(-1)]).optional(),
  on: z.string().optional(),
  locked: z.boolean().optional(),
});

export const docSchema = z.object({
  id: z.string(),
  planId: z.string(),
  name: z.string(),
  items: z.array(itemSchema),
  floor: z.object({ material: z.enum(["wood", "tile", "marble", "concrete", "carpet"]), color: z.string() }),
  wall: z.object({ material: z.enum(["paint", "stripes", "brick", "panel", "subway", "concrete"]), color: z.string() }),
  ceiling: z.number(),
  size: z.object({ w: z.number(), d: z.number() }).optional(),
  updatedAt: z.string(),
});

export interface RecentEntry {
  /** Session id: the saved design id when editing a saved design, else a new id. */
  id: string;
  savedId?: string;
  doc: DesignDoc;
  updatedAt: string;
}

const recentSchema = z.object({ id: z.string(), savedId: z.string().optional(), doc: docSchema, updatedAt: z.string() });

export interface MeasureSettings {
  item: boolean;
  distance: boolean;
  room: boolean;
}

export const defaultMeasure: MeasureSettings = { item: true, distance: true, room: false };

/** Minimal key-value storage so tests can run without a browser. */
export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserKV(): KV | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function read<T>(kv: KV | null, key: string, schema: z.ZodType<T>, fallback: T): T {
  if (!kv) return fallback;
  try {
    const raw = kv.getItem(key);
    if (!raw) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

function write(kv: KV | null, key: string, value: unknown) {
  try {
    kv?.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or privacy mode: the design still works, it just isn't kept.
  }
}

export function createDesignerStorage(kv: KV | null = browserKV()) {
  const savedList = () => read(kv, KEYS.saved, z.array(docSchema), [] as DesignDoc[]);
  const recentList = () => read(kv, KEYS.recent, z.array(recentSchema), [] as RecentEntry[]);

  return {
    savedList: () => savedList().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getSaved: (id: string) => savedList().find((d) => d.id === id),
    putSaved(doc: DesignDoc) {
      write(kv, KEYS.saved, [doc, ...savedList().filter((d) => d.id !== doc.id)]);
    },
    deleteSaved(id: string) {
      write(kv, KEYS.saved, savedList().filter((d) => d.id !== id));
      write(kv, KEYS.recent, recentList().filter((r) => r.savedId !== id));
    },

    recentList: () => recentList().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getRecent: (id: string) => recentList().find((r) => r.id === id),
    putRecent(entry: RecentEntry) {
      const list = [entry, ...recentList().filter((r) => r.id !== entry.id)];
      write(kv, KEYS.recent, list.slice(0, RECENT_LIMIT));
    },
    deleteRecent(id: string) {
      write(kv, KEYS.recent, recentList().filter((r) => r.id !== id));
    },

    measure: () => read(kv, KEYS.measure, z.object({ item: z.boolean(), distance: z.boolean(), room: z.boolean() }), defaultMeasure),
    setMeasure(m: MeasureSettings) {
      write(kv, KEYS.measure, m);
    },

    recentItems: () => read(kv, KEYS.recentItems, z.array(z.string()), [] as string[]),
    pushRecentItem(id: string) {
      const list = [id, ...read(kv, KEYS.recentItems, z.array(z.string()), [] as string[]).filter((x) => x !== id)];
      write(kv, KEYS.recentItems, list.slice(0, RECENT_ITEMS_LIMIT));
    },
  };
}

export type DesignerStorage = ReturnType<typeof createDesignerStorage>;

let shared: DesignerStorage | null = null;
export function designerStorage(): DesignerStorage {
  shared ??= createDesignerStorage();
  return shared;
}
