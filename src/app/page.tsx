import { ArrowRight, Box, MousePointerClick, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { roomTypes, showroomsOfType } from "@/features/designer/data/showrooms";
import SiteHeader from "./SiteHeader";

const steps = [
  { icon: Box, title: "Pick a showroom", text: "Start from a styled room designed for the way you live." },
  { icon: MousePointerClick, title: "Make it yours", text: "Move, rotate, restyle and add pieces right in 3D, or start from your unit's floor plan." },
  { icon: ShoppingBag, title: "See the total", text: "Your shopping list updates with every change." },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
        <section className="py-14 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">3D room planner</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">Plan your room in 3D, before you buy a thing.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Choose a ready-made showroom, walk around it, and rearrange the furniture until it feels like home.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/rooms/bedroom"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-ink transition hover:opacity-90"
            >
              Start with a bedroom <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/designer"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-sm font-medium transition hover:border-foreground/40"
            >
              Design your unit&apos;s floor plan <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section aria-labelledby="room-types">
          <h2 id="room-types" className="text-xl font-semibold">
            What room are you designing?
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roomTypes.map((t) => {
              const count = showroomsOfType(t.id).length;
              return (
                <Link
                  key={t.id}
                  href={`/rooms/${t.id}`}
                  className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="h-36" style={{ background: t.gradient }} />
                  <div className="flex items-end justify-between gap-3 p-4">
                    <div>
                      <h3 className="font-semibold">{t.name.en}</h3>
                      <p className="text-sm text-muted">{t.blurb.en}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {count} {count === 1 ? "showroom" : "showrooms"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-line bg-surface p-5">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-muted">RoomCraft demo · furniture and rooms are fictional</footer>
    </div>
  );
}
