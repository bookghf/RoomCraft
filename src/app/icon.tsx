import { logoSvg } from "./brand";

export const size = { width: 64, height: 64 };
export const contentType = "image/svg+xml";

/** Favicon as crisp SVG. */
export default function Icon() {
  return new Response(logoSvg(64), { headers: { "Content-Type": contentType } });
}
