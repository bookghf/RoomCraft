"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import SiteHeader from "./SiteHeader";

/** Shown when a page can't load the catalog or rooms from the RoomCraft API. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t load the rooms right now.</h1>
        <p className="max-w-md text-muted">The RoomCraft service didn&apos;t answer. Check your connection and try again in a moment.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-ink transition hover:opacity-90"
          >
            <RotateCw className="size-4" /> Try again
          </button>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-sm font-medium transition hover:border-foreground/40">
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}
