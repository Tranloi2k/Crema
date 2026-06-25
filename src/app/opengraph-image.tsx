import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "72px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              fontSize: "36px",
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div style={{ fontSize: "48px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "900px" }}>
          <div style={{ fontSize: "56px", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Design beautiful emails without writing HTML
          </div>
          <div style={{ fontSize: "28px", lineHeight: 1.4, color: "#cbd5e1" }}>{SITE_DESCRIPTION}</div>
        </div>

        <div style={{ fontSize: "24px", color: "#94a3b8" }}>{SITE_TAGLINE}</div>
      </div>
    ),
    { ...size }
  );
}
