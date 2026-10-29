"use client";

import { ChevronLeft, Palette, Redo2, Save, Share2, Undo2, X } from "lucide-react";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { designStorage, encodeDesign } from "@/features/planner/lib/serialize";
import { redo, undo, usePlannerStore, useTemporalStore } from "@/features/planner/store/usePlannerStore";
import { toast } from "./Toast";

const btn =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40";

export default function TopBar() {
  const router = useRouter();
  const room = usePlannerStore((s) => s.room);
  const styleOpen = usePlannerStore((s) => s.styleOpen);
  const setStyleOpen = usePlannerStore((s) => s.setStyleOpen);
  const canUndo = useTemporalStore((s) => s.pastStates.length > 0);
  const canRedo = useTemporalStore((s) => s.futureStates.length > 0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  function save() {
    const design = usePlannerStore.getState().design;
    if (!room || !design) return;
    const id = nanoid(10);
    designStorage.saveSaved({ ...design, id, updatedAt: new Date().toISOString() });
    router.replace(`/planner/${room.id}?d=${id}`, { scroll: false });
    toast("Design saved");
  }

  async function share() {
    const design = usePlannerStore.getState().design;
    if (!room || !design) return;
    const url = `${window.location.origin}/planner/${room.id}?s=${encodeDesign(design)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      setShareUrl(url);
    }
  }

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-3 sm:px-4">
      <Link
        href={room ? `/rooms/${room.type}` : "/"}
        className="inline-flex size-9 items-center justify-center rounded-full text-stone-700 hover:bg-stone-100"
        aria-label="Back to showrooms"
      >
        <ChevronLeft className="size-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">RoomCraft</p>
        <h1 className="truncate text-sm font-semibold text-stone-900 sm:text-base">{room?.name ?? "Loading…"}</h1>
      </div>

      <div className="flex items-center gap-0.5 rounded-full border border-stone-200 p-0.5">
        <button type="button" className={btn} onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)" aria-label="Undo">
          <Undo2 className="size-4" />
        </button>
        <button type="button" className={btn} onClick={redo} disabled={!canRedo} title="Redo (Shift+Ctrl/Cmd+Z)" aria-label="Redo">
          <Redo2 className="size-4" />
        </button>
      </div>

      <button
        type="button"
        className={`${btn} ${styleOpen ? "bg-stone-100" : ""}`}
        onClick={() => setStyleOpen(!styleOpen)}
        aria-pressed={styleOpen}
        title="Wall colour & floor"
      >
        <Palette className="size-4" />
        <span className="hidden sm:inline">Style</span>
      </button>
      <button type="button" className={btn} onClick={save} title="Save design">
        <Save className="size-4" />
        <span className="hidden sm:inline">Save</span>
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-700"
        onClick={share}
        title="Copy share link"
      >
        <Share2 className="size-4" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {shareUrl && (
        <div className="absolute right-3 top-14 z-40 mt-2 w-[min(420px,calc(100vw-24px))] rounded-xl border border-stone-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-stone-800">Copy this link to share</p>
            <button type="button" onClick={() => setShareUrl(null)} className="rounded-full p-1 hover:bg-stone-100" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <input
            readOnly
            value={shareUrl}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-stone-300 bg-stone-50 px-2 py-1.5 font-mono text-xs text-stone-700"
          />
        </div>
      )}
    </header>
  );
}
