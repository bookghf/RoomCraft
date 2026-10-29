import type { MetadataRoute } from "next";
import { BRAND, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "./brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: BRAND.cream,
    theme_color: BRAND.cream,
    icons: [
      { src: "/icon", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
