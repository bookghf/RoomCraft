import type { Metadata } from "next";
import ItemPreviewLoader from "@/features/embed/ItemPreviewLoader";

export const metadata: Metadata = {
  title: "Item preview",
  robots: { index: false, follow: false },
};

/** A single catalog item drawn by the designer's own 3D code. The back office shows it in a frame while staff edit an item. */
export default function ItemPreviewPage() {
  return <ItemPreviewLoader />;
}
