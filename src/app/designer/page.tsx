import type { Metadata } from "next";
import { loadContent } from "@/features/designer/api";
import ContentProvider from "@/features/designer/ContentProvider";
import DesignerHome from "@/features/designer/DesignerHome";
import SiteHeader from "../SiteHeader";

export const metadata: Metadata = { title: "Room designer", description: "Design your unit in 3D: pick an empty room or a 1- or 2-bedroom floor plan and furnish it with real measurements." };

export default async function DesignerPage() {
  const content = await loadContent();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <ContentProvider content={content}>
        <DesignerHome />
      </ContentProvider>
    </div>
  );
}
