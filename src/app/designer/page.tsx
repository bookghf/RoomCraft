import type { Metadata } from "next";
import DesignerHome from "@/features/designer/DesignerHome";
import SiteHeader from "../SiteHeader";

export const metadata: Metadata = { title: "Room designer — RoomCraft" };

export default function DesignerPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <DesignerHome />
    </div>
  );
}
