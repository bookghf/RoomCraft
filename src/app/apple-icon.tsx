import { ImageResponse } from "next/og";
import { logoDataUri } from "./brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon; iOS rounds the corners itself, so the tile is square. */
export default function AppleIcon() {
  return new ImageResponse(<img src={logoDataUri(180, false)} width={180} height={180} alt="" />, size);
}
