import { ImageResponse } from "next/og";
import { getSohbet, getSohbetSluglari } from "@/lib/content";

export const runtime = "nodejs";
export const alt = "Sohbet Arşivi";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export function generateStaticParams() {
  return getSohbetSluglari().map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: { slug: string } }) {
  const sohbet = getSohbet(params.slug);

  const baslik = sohbet?.baslik ?? "Sohbet Bulunamadı";
  const tarih = sohbet?.tarihTr ?? "";
  const sureDk = sohbet?.sureDk;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FAF7F2",
          padding: "80px",
        }}
      >
        {/* Üst teal çizgi */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "12px", backgroundColor: "#0F766E" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "#0F766E", fontSize: "32px", fontWeight: 600 }}>
            <span>☽</span>
            <span>Sohbet Arşivi</span>
          </div>

          <h1
            style={{
              fontSize: baslik.length > 40 ? "56px" : "72px",
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.2,
              marginTop: "40px",
              maxWidth: "1000px",
            }}
          >
            {baslik}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "36px", color: "#4B5563", borderTop: "2px solid #E5E7EB", paddingTop: "40px" }}>
          {tarih && <span>{tarih}</span>}
          {sureDk != null && (
            <>
              <span style={{ color: "#9CA3AF" }}>•</span>
              <span>⏱ {sureDk} dk</span>
            </>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
