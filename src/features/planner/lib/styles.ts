import type { FloorMaterial } from "@/types/planner";

export const wallPalette: { hex: string; label: string }[] = [
  { hex: "#EDE8E0", label: "Linen" },
  { hex: "#F2F1EC", label: "Chalk" },
  { hex: "#DDE3EA", label: "Mist blue" },
  { hex: "#A8B5A0", label: "Sage" },
  { hex: "#E9D8C8", label: "Clay" },
  { hex: "#F5ECC8", label: "Butter" },
  { hex: "#C9B7D1", label: "Lilac" },
  { hex: "#5E6B73", label: "Slate" },
];

/** Procedural floor looks: base colour, plank/tile line colour, roughness. */
export const floorMaterials: Record<FloorMaterial, { label: string; base: string; line: string; roughness: number; pattern: "planks" | "tiles" | "none" }> = {
  oak: { label: "Light oak", base: "#c9a77c", line: "#a98657", roughness: 0.6, pattern: "planks" },
  walnut: { label: "Walnut", base: "#6e4b32", line: "#523421", roughness: 0.55, pattern: "planks" },
  "tile-grey": { label: "Grey tile", base: "#b9b9b5", line: "#8f8f8a", roughness: 0.35, pattern: "tiles" },
  "carpet-beige": { label: "Beige carpet", base: "#d6c8b0", line: "#d6c8b0", roughness: 1, pattern: "none" },
};
