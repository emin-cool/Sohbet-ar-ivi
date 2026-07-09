import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


// Gövde: Inter · Başlıklar: Lora (zarif serif)
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sohbet Arşivi",
    template: "%s · Sohbet Arşivi",
  },
  description:
    "Türkçe İslami sohbet kayıtları için okuma ve dinleme arşivi. Kavram, ayet ve konuya göre gezinin.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" data-theme="light" className={`${inter.variable} ${lora.variable}`}>
      <head>
        {/* Kayıtlı tema/yazı tercihini FOUC olmadan uygula (okuma ayarları). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('sohbet-arsivi:tema');if(t)document.documentElement.dataset.theme=t;var y=localStorage.getItem('sohbet-arsivi:yazi');if(y)document.documentElement.style.setProperty('--reading-scale',y);var f=localStorage.getItem('sohbet-arsivi:odak');if(f==='true')document.body.dataset.focus='true';}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
      </body>
    </html>
  );
}
