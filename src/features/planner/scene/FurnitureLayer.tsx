"use client";

import { usePlannerStore } from "@/features/planner/store/usePlannerStore";
import FurnitureItem from "./FurnitureItem";

export default function FurnitureLayer() {
  const items = usePlannerStore((s) => s.design?.items);
  return <group>{items?.map((item) => <FurnitureItem key={item.uid} item={item} />)}</group>;
}
