"use client";

import { Clock, Copy, EllipsisVertical, LayoutGrid, Pencil, Star, Trash2, X } from "lucide-react";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { formatPrice, getPlanSpec, showroomSpecs, totalPrice, unitPlanSpecs } from "./content";
import { EMPTY_SIZE } from "./lib/plans";
import { presetItems } from "./lib/presets";
import { tx, useLang, useRestoreLang, useT } from "./i18n";
import { designerStorage, type RecentEntry } from "./lib/storage";
import { designUrl } from "./session";
import type { DesignDoc } from "./types";
import { Btn, Modal } from "./ui/common";
import LangSwitch from "./ui/LangSwitch";
import PlanThumbnail from "./ui/PlanThumbnail";

type Tab = "plans" | "recent" | "saved";

/** Saved and Recent lists from browser storage; null during server rendering. */
let listsCache: { saved: DesignDoc[]; recent: RecentEntry[] } | null = null;
const listeners = new Set<() => void>();
function readLists() {
  listsCache ??= { saved: designerStorage().savedList(), recent: designerStorage().recentList() };
  return listsCache;
}
function refreshLists() {
  listsCache = null;
  listeners.forEach((l) => l());
}

function subscribeLists(l: () => void) {
  listeners.add(l);
  return () => void listeners.delete(l);
}

function useLists() {
  // Lists change in the designer; read them fresh whenever this screen mounts.
  useState(() => (listsCache = null));
  const lists = useSyncExternalStore(subscribeLists, readLists, () => null);
  return { saved: lists?.saved ?? null, recent: lists?.recent ?? null, refresh: refreshLists };
}

function when(iso: string, lang: string) {
  return new Date(iso).toLocaleString(lang === "zh" ? "zh-CN" : lang === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function SectionTitle({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mb-3 mt-8 first:mt-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted">{blurb}</p>
    </div>
  );
}

function Card({
  href,
  doc,
  title,
  subtitle,
  badge,
  thumbBg,
  children,
}: {
  href: string;
  doc: Pick<DesignDoc, "planId" | "size" | "items">;
  title: string;
  subtitle: string;
  badge?: string;
  thumbBg?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={href} className="flex flex-1 flex-col">
        <div className="aspect-[4/3] bg-stone-50 p-3" style={thumbBg ? { background: thumbBg } : undefined}>
          <PlanThumbnail doc={doc} className="h-full w-full" />
        </div>
        <div className="flex-1 p-3 pr-12">
          <h3 className="truncate font-semibold text-stone-900">{title}</h3>
          <p className="truncate text-xs text-stone-500">{subtitle}</p>
          {badge && <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">{badge}</span>}
        </div>
      </Link>
      {children}
    </div>
  );
}

export default function DesignerHome() {
  useRestoreLang();
  const t = useT();
  const lang = useLang();
  const [tab, setTab] = useState<Tab>("plans");
  const { saved, recent, refresh } = useLists();
  const [menuFor, setMenuFor] = useState<DesignDoc | null>(null);
  const [renaming, setRenaming] = useState<DesignDoc | null>(null);
  const [deleting, setDeleting] = useState<DesignDoc | null>(null);
  const [name, setName] = useState("");

  const planName = (id: string) => tx(getPlanSpec(id)?.name, lang);
  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid; count?: number }[] = [
    { id: "plans", label: t("plans"), icon: LayoutGrid },
    { id: "recent", label: t("recent"), icon: Clock, count: recent?.length },
    { id: "saved", label: t("saved"), icon: Star, count: saved?.length },
  ];

  function duplicate(d: DesignDoc) {
    designerStorage().putSaved({ ...d, id: nanoid(10), name: t("copyOf", { name: d.name || t("untitled") }), updatedAt: new Date().toISOString() });
    setMenuFor(null);
    refresh();
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-8 sm:pt-12">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">3D</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{t("appTitle")}</h1>
          <p className="mt-2 max-w-xl text-muted">{t("appBlurb")}</p>
        </div>
        <LangSwitch />
      </div>

      <div className="sticky top-0 z-10 -mx-4 mt-6 border-b border-line bg-background/90 px-4 backdrop-blur sm:mx-0 sm:px-0" role="tablist">
        <div className="flex gap-1">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition ${tab === id ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
            >
              <Icon className="size-4" />
              {label}
              {!!count && <span className="rounded-full bg-stone-200 px-1.5 text-[11px] text-stone-700">{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === "plans" && (
        <>
          <SectionTitle title={t("floorPlans")} blurb={t("floorPlansBlurb")} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unitPlanSpecs().map((p) => {
              const doc = { planId: p.id, size: p.resizable, items: [] };
              const sub = p.area ? t("area", { n: p.area }) : t("resizable", { w: EMPTY_SIZE.w, d: EMPTY_SIZE.d });
              return <Card key={p.id} href={designUrl(p.id)} doc={doc} title={tx(p.name, lang)} subtitle={`${sub} · ${p.zones.length > 1 ? p.zones.map((z) => tx(z.name, lang)).join(", ") : tx(p.zones[0].name, lang)}`} />;
            })}
          </div>
          <SectionTitle title={t("showrooms")} blurb={t("showroomsBlurb")} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {showroomSpecs().map((p) => {
              const items = presetItems(p);
              return (
                <Card
                  key={p.id}
                  href={designUrl(p.id)}
                  doc={{ planId: p.id, items }}
                  title={tx(p.name, lang)}
                  subtitle={`${t("area", { n: p.area ?? 0 })} · ${t("itemsCount", { n: items.length })} · ${formatPrice(totalPrice(items), lang)}`}
                  thumbBg={p.showroom?.thumbnail}
                />
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {tab === "recent" &&
          recent?.map((r) => (
            <Card
              key={r.id}
              href={designUrl(r.doc.planId, { r: r.id })}
              doc={r.doc}
              title={(r.savedId && saved?.find((s) => s.id === r.savedId)?.name) || r.doc.name || t("untitled")}
              subtitle={`${planName(r.doc.planId)} · ${t("itemsCount", { n: r.doc.items.length })} · ${when(r.updatedAt, lang)}`}
              badge={t("unsavedChanges")}
            >
              <button
                type="button"
                onClick={() => {
                  designerStorage().deleteRecent(r.id);
                  refresh();
                }}
                className="absolute bottom-3 right-3 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                aria-label={t("discard")}
                title={t("discard")}
              >
                <X className="size-4" />
              </button>
            </Card>
          ))}
        {tab === "recent" && recent?.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-line p-10 text-center text-muted">{t("emptyRecent")}</p>}

        {tab === "saved" &&
          saved?.map((d) => (
            <Card key={d.id} href={designUrl(d.planId, { d: d.id })} doc={d} title={d.name || t("untitled")} subtitle={`${planName(d.planId)} · ${t("itemsCount", { n: d.items.length })} · ${when(d.updatedAt, lang)}`}>
              <button type="button" onClick={() => setMenuFor(d)} className="absolute bottom-3 right-3 rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800" aria-label={t("more")}>
                <EllipsisVertical className="size-4" />
              </button>
            </Card>
          ))}
        {tab === "saved" && saved?.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-line p-10 text-center text-muted">{t("emptySaved")}</p>}
      </div>

      {menuFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center" onPointerDown={(e) => e.target === e.currentTarget && setMenuFor(null)}>
          <div role="menu" className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <p className="truncate border-b border-stone-100 px-5 py-3 text-sm font-semibold text-stone-900">{menuFor.name || t("untitled")}</p>
            {[
              {
                icon: Pencil,
                label: t("rename"),
                run: () => {
                  setName(menuFor.name);
                  setRenaming(menuFor);
                  setMenuFor(null);
                },
              },
              { icon: Copy, label: t("duplicate"), run: () => duplicate(menuFor) },
              {
                icon: Trash2,
                label: t("delete"),
                danger: true,
                run: () => {
                  setDeleting(menuFor);
                  setMenuFor(null);
                },
              },
            ].map(({ icon: Icon, label, run, danger }) => (
              <button key={label} type="button" role="menuitem" onClick={run} className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-medium hover:bg-stone-50 ${danger ? "text-red-600" : "text-stone-800"}`}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
            <button type="button" onClick={() => setMenuFor(null)} className="w-full border-t border-stone-100 px-5 py-3 text-center text-sm font-medium text-stone-500 hover:bg-stone-50">
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {renaming && (
        <Modal
          title={t("renameDesign")}
          onClose={() => setRenaming(null)}
          footer={
            <>
              <Btn onClick={() => setRenaming(null)}>{t("cancel")}</Btn>
              <Btn
                kind="primary"
                disabled={!name.trim()}
                onClick={() => {
                  designerStorage().putSaved({ ...renaming, name: name.trim(), updatedAt: new Date().toISOString() });
                  setRenaming(null);
                  refresh();
                }}
              >
                {t("save")}
              </Btn>
            </>
          }
        >
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} aria-label={t("designName")} className="w-full rounded-xl border border-stone-300 px-3 py-2 text-base text-stone-900 outline-none focus:border-stone-600" />
        </Modal>
      )}

      {deleting && (
        <Modal
          title={t("deleteDesignQ", { name: deleting.name || t("untitled") })}
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Btn onClick={() => setDeleting(null)}>{t("cancel")}</Btn>
              <Btn
                kind="danger"
                onClick={() => {
                  designerStorage().deleteSaved(deleting.id);
                  setDeleting(null);
                  refresh();
                }}
              >
                {t("delete")}
              </Btn>
            </>
          }
        >
          {t("deleteDesignBody")}
        </Modal>
      )}
    </div>
  );
}
