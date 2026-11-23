// Which parts of an uploaded .glb follow the colour the customer picks.
// Set in the back office as the item's "colorMaterials" template parameter: material names, "|"-separated.
// Keep roomcraft-backoffice/src/lib/colorMaterials.ts in step.

export const COLOR_MATERIALS_PARAM = "colorMaterials";

export function parseColorMaterials(params: Record<string, unknown> | undefined): string[] {
  const v = params?.[COLOR_MATERIALS_PARAM];
  return typeof v === "string" ? v.split("|").map((s) => s.trim()).filter(Boolean) : [];
}
