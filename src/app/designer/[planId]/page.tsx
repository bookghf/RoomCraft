import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPlanSpec, planSpecs } from "@/features/designer/data/plans";
import Designer from "@/features/designer/Designer";

export function generateStaticParams() {
  return planSpecs.map((p) => ({ planId: p.id }));
}

export async function generateMetadata(props: PageProps<"/designer/[planId]">): Promise<Metadata> {
  const { planId } = await props.params;
  const spec = getPlanSpec(planId);
  return { title: spec ? `${spec.name.en} — RoomCraft designer` : "RoomCraft designer" };
}

export default function DesignerPlanPage(props: PageProps<"/designer/[planId]">) {
  return (
    <div className="h-dvh w-full overflow-hidden">
      <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted">Loading designer…</div>}>
        <DesignerRoute params={props.params} />
      </Suspense>
    </div>
  );
}

async function DesignerRoute({ params }: { params: PageProps<"/designer/[planId]">["params"] }) {
  const { planId } = await params;
  if (!getPlanSpec(planId)) notFound();
  return <Designer planId={planId} />;
}
