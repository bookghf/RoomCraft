import { ImageResponse } from "next/og";
import { BRAND, logoDataUri, SITE_NAME, SITE_TAGLINE } from "./brand";

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link preview card for chats and social posts. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 64, padding: "0 96px", background: BRAND.cream }}>
        <img src={logoDataUri(280)} width={280} height={280} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, letterSpacing: -3, color: BRAND.ink }}>
            Room<span style={{ color: BRAND.green }}>Craft</span>
          </div>
          <div style={{ fontSize: 44, color: "#6b655c", marginTop: 8 }}>{SITE_TAGLINE}</div>
          <div style={{ display: "flex", gap: 16, marginTop: 40, fontSize: 28, color: BRAND.green }}>
            {["Showrooms", "Floor plans", "Desktop & phone"].map((t) => (
              <div key={t} style={{ padding: "10px 22px", borderRadius: 999, border: `2px solid ${BRAND.greenLight}` }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
