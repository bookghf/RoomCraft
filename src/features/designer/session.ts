"use client";

import { nanoid } from "nanoid";
import { toast } from "@/features/planner/ui/Toast";
import { getPlanSpec } from "./data/plans";
import { designerStorage } from "./lib/storage";
import { contentKey, defaultDoc, t, useDesigner } from "./store";
import type { DesignDoc } from "./types";

/** URL updates wait while a back-button layer entry is on top of the history (see useBackLayers). */
let pendingUrl: string | null = null;
let layerOnTop = false;

export function setLayerOnTop(v: boolean) {
  layerOnTop = v;
  if (!v && pendingUrl) {
    window.history.replaceState(null, "", pendingUrl);
    pendingUrl = null;
  }
}

export function replaceUrl(url: string) {
  if (layerOnTop) pendingUrl = url;
  else window.history.replaceState(null, "", url);
}

export function designUrl(planId: string, params: { d?: string; r?: string } = {}) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return `/designer/${planId}${q ? `?${q}` : ""}`;
}

/**
 * Open order: ?r= recent entry → ?d= saved design → a new design of the plan.
 * Recent entries remember which saved design (if any) they are unsaved changes to.
 */
export function openDesign(planId: string) {
  const store = designerStorage();
  const params = new URLSearchParams(window.location.search);
  const r = params.get("r");
  const d = params.get("d");

  const recent = r ? store.getRecent(r) : undefined;
  if (recent && recent.doc.planId === planId) {
    const saved = recent.savedId ? store.getSaved(recent.savedId) : undefined;
    const base = saved ?? defaultDoc(planId)!;
    useDesigner.getState().load(recent.doc, { savedId: saved?.id ?? null, sessionId: recent.id, baseline: contentKey(base) });
    return true;
  }
  const saved = d ? store.getSaved(d) : undefined;
  if (saved && saved.planId === planId) {
    useDesigner.getState().load(saved, { savedId: saved.id, sessionId: saved.id, baseline: contentKey(saved) });
    return true;
  }
  const fresh = defaultDoc(planId);
  if (!fresh) return false;
  useDesigner.getState().load(fresh, { savedId: null, sessionId: fresh.id, baseline: contentKey(fresh) });
  if (r || d) replaceUrl(designUrl(planId));
  return true;
}

/** Keep unsaved work in Recent; drop it once it matches the saved (or untouched) design again. */
export function syncRecent(doc: DesignDoc) {
  const { sessionId, savedId, baseline } = useDesigner.getState();
  const store = designerStorage();
  const clean = contentKey(doc) === baseline;
  if (clean) store.deleteRecent(sessionId);
  else store.putRecent({ id: sessionId, savedId: savedId ?? undefined, doc, updatedAt: new Date().toISOString() });
  // Point the URL at the unsaved work so a reload brings it back.
  const params: { d?: string; r?: string } = {};
  if (savedId) params.d = savedId;
  if (!clean) params.r = sessionId;
  const url = designUrl(doc.planId, params);
  if (url !== window.location.pathname + window.location.search) replaceUrl(url);
}

/** Save (or update) the current design. Returns false when a name is needed first. */
export function saveDesign(name?: string): boolean {
  const s = useDesigner.getState();
  const doc = s.doc;
  if (!doc) return false;
  const store = designerStorage();
  if (!s.savedId && !name) {
    s.patch({ dialog: "save" });
    return false;
  }
  const id = s.savedId ?? nanoid(10);
  // Undo can bring back a doc from before the first save, so keep the stored name.
  const saved: DesignDoc = { ...doc, id, name: name ?? (store.getSaved(id)?.name || doc.name), updatedAt: new Date().toISOString() };
  store.putSaved(saved);
  store.deleteRecent(s.sessionId);
  // The name is not part of the undo history.
  useDesigner.temporal.getState().pause();
  useDesigner.setState({ doc: { ...doc, id, name: saved.name }, savedId: id, sessionId: id, baseline: contentKey(saved), dialog: null });
  useDesigner.temporal.getState().resume();
  replaceUrl(designUrl(doc.planId, { d: id }));
  toast(t("savedToast"));
  return true;
}

export function planTitle(planId: string, lang: "en" | "th" | "zh") {
  const spec = getPlanSpec(planId);
  return spec ? spec.name[lang] : planId;
}
