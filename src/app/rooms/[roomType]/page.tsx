import { ArrowRight, ChevronLeft, Ruler } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPresetDesign, getRoomsByType, roomTypes } from "@/data/rooms";
import { roomBounds } from "@/features/planner/lib/placement";
import { formatPrice, shoppingList } from "@/features/planner/lib/pricing";
import type { Room } from "@/types/planner";
import SiteHeader from "../../SiteHeader";


export function generateStaticParams() {
  return roomTypes.map((t) => ({ roomType: t.id }));
}

export async function generateMetadata(props: PageProps<"/rooms/[roomType]">): Promise<Metadata> {
  const { roomType } = await props.params;
  const type = roomTypes.find((t) => t.id === roomType);
  return { title: type ? `${type.label} showrooms — RoomCraft` : "RoomCraft" };
}

/** Simple isometric room illustration tinted with the room's wall colour. */
function RoomIllustration({ room }: { room: Room }) {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
      <polygon points="100,20 180,55 180,100 100,65" fill={room.wallColor} opacity="0.95" />
      <polygon points="100,20 20,55 20,100 100,65" fill={room.wallColor} opacity="0.75" />
      <polygon points="100,65 180,100 100,118 20,100" fill="#000" opacity="0.12" />
      <polygon points="125,40 155,53 155,73 125,60" fill="#fff" opacity="0.6" />
      <polygon points="70,82 110,95 90,103 50,90" fill="#fff" opacity="0.7" />
    </svg>
  );
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
  const type = roomTypes.find((t) => t.id === roomType);
  if (!type) notFound();
  const list = getRoomsByType(type.id);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
        <nav className="pt-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeft className="size-4" /> All rooms
          </Link>
        </nav>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{type.label} showrooms</h1>
        <p className="mt-2 text-muted">{type.blurb}. Pick one to open it in the 3D planner.</p>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {roomTypes.map((t) => (
            <Link
              key={t.id}
              href={`/rooms/${t.id}`}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${
                t.id === type.id ? "border-foreground bg-foreground text-background" : "border-line bg-surface hover:border-foreground/40"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
            No showrooms for this room type yet. <Link href="/" className="underline">Browse other rooms</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((room) => {
              const b = roomBounds(room);
              const preset = getPresetDesign(room.id);
              const { count, total } = shoppingList(preset?.items ?? []);
              return (
                <Link
                  key={room.id}
                  href={`/planner/${room.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="aspect-[5/3] p-4" style={{ background: room.thumbnail }}>
                    <RoomIllustration room={room} />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-semibold">{room.name}</h2>
                    <p className="mt-1 text-sm text-muted">{room.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="size-3.5" />
                        {(b.maxX - b.minX).toFixed(1)} × {(b.maxZ - b.minZ).toFixed(1)} m
                      </span>
                      <span>{count} items</span>
                      <span className="font-medium text-foreground">{formatPrice(total)}</span>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                      Open in 3D <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
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
