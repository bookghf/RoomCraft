import type { Metadata } from "next";
import DesignerHome from "@/features/designer/DesignerHome";
import SiteHeader from "../SiteHeader";

export const metadata: Metadata = { title: "Room designer", description: "Design your unit in 3D: pick an empty room or a 1- or 2-bedroom floor plan and furnish it with real measurements." };

export default function DesignerPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <DesignerHome />
    </div>
  );
}
