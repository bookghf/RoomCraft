import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getRoom, rooms } from "@/data/rooms";
import Planner from "@/features/planner/Planner";


export function generateStaticParams() {
  return rooms.map((r) => ({ roomId: r.id }));
}

export async function generateMetadata(props: PageProps<"/planner/[roomId]">): Promise<Metadata> {
  const { roomId } = await props.params;
  const room = getRoom(roomId);
  return { title: room ? `${room.name} — RoomCraft planner` : "RoomCraft planner" };
}

export default function PlannerPage(props: PageProps<"/planner/[roomId]">) {
  return (
    <div className="h-dvh w-full overflow-hidden">
      <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted">Loading planner…</div>}>
        <PlannerRoute params={props.params} />
      </Suspense>
    </div>
  );
}

async function PlannerRoute({ params }: { params: PageProps<"/planner/[roomId]">["params"] }) {
  const { roomId } = await params;
  if (!getRoom(roomId)) notFound();
  return <Planner roomId={roomId} />;
}
