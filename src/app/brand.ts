/** RoomCraft brand: name, copy and the logo mark shared by the header, icons and share images. */

export const SITE_NAME = "RoomCraft";
export const SITE_URL = "https://roomcraft-sable.vercel.app";
export const SITE_TAGLINE = "Design your room in 3D";
export const SITE_DESCRIPTION =
  "Plan your room in 3D. Start from a styled showroom or your unit's floor plan, then add, move and restyle furniture with real measurements, on desktop or phone.";

export const BRAND = {
  green: "#2f5d50",
  greenLight: "#a9c6bb",
  cream: "#faf8f5",
  ink: "#1f1d1a",
} as const;

/**
 * The mark: an isometric room corner (two walls, a wooden floor and a window) on a rounded green tile.
 * Drawn on a 64×64 grid; LOGO_TRANSFORM scales the room up to fill the tile.
 */
export const LOGO_TRANSFORM = "translate(32 31) scale(1.18) translate(-32 -31)";

export const LOGO_SHAPES: { d: string; fill: string }[] = [
  { d: "M14 40 14 22 32 12 32 30Z", fill: "#f4efe6" },
  { d: "M32 30 32 12 50 22 50 40Z", fill: "#d9cfbf" },
  { d: "M32 30 14 40 32 50 50 40Z", fill: "#d4a574" },
  { d: "M38 20.3 45 24.2 45 32.2 38 28.3Z", fill: BRAND.greenLight },
  { d: "M23 37.2 32 32 41 37.2 32 42.4Z", fill: "#c08f5c" },
];

export function logoSvg(size: number, rounded = true) {
  const paths = LOGO_SHAPES.map((s) => `<path d="${s.d}" fill="${s.fill}"/>`).join("");
  const bg = `<rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="${BRAND.green}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${bg}<g transform="${LOGO_TRANSFORM}">${paths}</g></svg>`;
}

export function logoDataUri(size: number, rounded = true) {
  return `data:image/svg+xml;base64,${Buffer.from(logoSvg(size, rounded)).toString("base64")}`;
}
