import { ArrowRight, ChevronLeft, Ruler } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadContent, loadInstalledContent } from "@/features/designer/api";
import { formatPrice, roomTypes, showroomsOfType, totalPrice } from "@/features/designer/content";
import { showroomSize } from "@/features/designer/lib/plans";
import { presetItems } from "@/features/designer/lib/presets";
import PlanThumbnail from "@/features/designer/ui/PlanThumbnail";
import SiteHeader from "../../SiteHeader";

export async function generateStaticParams() {
  const { roomTypes } = await loadContent();
  return roomTypes.map((t) => ({ roomType: t.id }));
}

export async function generateMetadata(props: PageProps<"/rooms/[roomType]">): Promise<Metadata> {
  const { roomType } = await props.params;
  const type = (await loadContent()).roomTypes.find((t) => t.id === roomType);
  return { title: type ? `${type.name.en} showrooms` : "Showrooms" };
}

export default function RoomTypePage(props: PageProps<"/rooms/[roomType]">) {
  return (
    <Suspense fallback={<div className="flex min-h-full flex-col"><SiteHeader /></div>}>
      <RoomTypeGallery params={props.params} />
    </Suspense>
  );
}

async function RoomTypeGallery({ params }: { params: PageProps<"/rooms/[roomType]">["params"] }) {
  const { roomType } = await params;
  await loadInstalledContent();
  const type = roomTypes().find((t) => t.id === roomType);
  if (!type) notFound();
  const list = showroomsOfType(type.id);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
        <nav className="pt-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeft className="size-4" /> All rooms
          </Link>
        </nav>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{type.name.en} showrooms</h1>
        <p className="mt-2 text-muted">{type.blurb.en}. Pick one to open it furnished in the room designer.</p>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {roomTypes().map((t) => (
            <Link
              key={t.id}
              href={`/rooms/${t.id}`}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${
                t.id === type.id ? "border-foreground bg-foreground text-background" : "border-line bg-surface hover:border-foreground/40"
              }`}
            >
              {t.name.en}
            </Link>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
            No showrooms for this room type yet. <Link href="/" className="underline">Browse other rooms</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((spec) => {
              const room = spec.showroom!;
              const items = presetItems(spec);
              const size = showroomSize(spec);
              return (
                <Link
                  key={spec.id}
                  href={`/designer/${spec.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="aspect-[5/3] p-4" style={{ background: room.thumbnail }}>
                    <PlanThumbnail doc={{ planId: spec.id, items }} className="h-full w-full drop-shadow-sm" />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-semibold">{spec.name.en}</h2>
                    <p className="mt-1 text-sm text-muted">{room.description.en}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="size-3.5" />
                        {size.w.toFixed(1)} × {size.d.toFixed(1)} m
                      </span>
                      <span>{items.length} items</span>
                      <span className="font-medium text-foreground">{formatPrice(totalPrice(items))}</span>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                      Open in the designer <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
