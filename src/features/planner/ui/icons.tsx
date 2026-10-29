import { Archive, Armchair, BedDouble, Flower2, Lamp, Sofa, Table2, Wallpaper, type LucideIcon } from "lucide-react";
import type { ProductCategory } from "@/types/planner";

export const categoryIcons: Record<ProductCategory, LucideIcon> = {
  beds: BedDouble,
  sofas: Sofa,
  storage: Archive,
  lighting: Lamp,
  textiles: Wallpaper,
  decor: Flower2,
  tables: Table2,
  chairs: Armchair,
};
