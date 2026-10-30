import type { DesignerContent } from "@/features/designer/content";
import { CATALOG_VERSION, catalog, categories } from "./catalog";
import { planSpecs } from "./plans";
import { roomTypes, showroomSpecs } from "./showrooms";

/** The seed data in the shape the app loads from the API. For tests only; the app uses the API. */
export const seedContent: DesignerContent = {
  catalogVersion: CATALOG_VERSION,
  categories,
  items: catalog,
  plans: [...planSpecs.filter((p) => p.id !== "empty"), ...showroomSpecs],
  roomTypes,
};
