import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadInstalledContent } from "@/features/designer/api";
import ContentProvider from "@/features/designer/ContentProvider";
import { allPlanSpecs, getPlanSpec } from "@/features/designer/content";
import Designer from "@/features/designer/Designer";

export async function generateStaticParams() {
  await loadInstalledContent();
  return allPlanSpecs().map((p) => ({ planId: p.id }));
}

export async function generateMetadata(props: PageProps<"/designer/[planId]">): Promise<Metadata> {
  const { planId } = await props.params;
  await loadInstalledContent();
  const spec = getPlanSpec(planId);
  return { title: spec ? `${spec.name.en} · Room designer` : "Room designer" };
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
  const content = await loadInstalledContent();
  if (!getPlanSpec(planId)) notFound();
  return (
    <ContentProvider content={content}>
      <Designer planId={planId} />
    </ContentProvider>
  );
}
