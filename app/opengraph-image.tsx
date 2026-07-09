import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Sohbet Arşivi";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAF7F2",
          padding: "80px",
        }}
      >
        {/* Üst teal çizgi */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "12px", backgroundColor: "#0F766E" }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "120px",
            height: "120px",
            backgroundColor: "#0F766E",
            borderRadius: "24px",
            marginBottom: "40px",
            color: "white",
            fontSize: "56px",
          }}
        >
          ☽
        </div>
        <h1
          style={{
            fontSize: "80px",
            fontWeight: 700,
            color: "#1F2937",
            letterSpacing: "-0.02em",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          Sohbet Arşivi
        </h1>
        <p
          style={{
            fontSize: "36px",
            color: "#4B5563",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          Türkçe İslami sohbet kayıtları için okuma ve dinleme arşivi.
        </p>
      </div>
    ),
    { ...size }
  );
}
