"use client";

import { installContent, type DesignerContent } from "./content";

/** Installs content loaded on the server so client components can read it synchronously. */
export default function ContentProvider({ content, children }: { content: DesignerContent; children: React.ReactNode }) {
  // Runs before the children render, on the server pass and in the browser.
  installContent(content);
  return children;
}
