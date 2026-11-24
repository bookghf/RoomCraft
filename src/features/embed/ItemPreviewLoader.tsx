"use client";

import dynamic from "next/dynamic";

// three.js only runs in the browser.
const ItemPreview = dynamic(() => import("./ItemPreview"), { ssr: false });

export default function ItemPreviewLoader() {
  return (
    <div className="fixed inset-0 bg-[#f4f4f5]">
      <ItemPreview />
    </div>
  );
}
