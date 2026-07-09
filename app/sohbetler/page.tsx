import { Suspense } from "react";
import type { Metadata } from "next";
import ArsivIstemci from "@/components/ArsivIstemci";
import {
  getKavramlar,
  getSohbetMetalar,
  getSureFacet,
  getYilFacet,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Tüm Sohbetler",
  description: "Kavram, tarih ve sureye göre filtreleyerek sohbetleri keşfedin.",
};

export default function SohbetlerSayfasi() {
  const sohbetler = getSohbetMetalar();
  const kavramFacet = getKavramlar().map(({ slug, kisaAd, adet }) => ({
    slug,
    kisaAd,
    adet,
  }));
  const yilFacet = getYilFacet();
  const sureFacet = getSureFacet();

  return (
    <main className="mx-auto max-w-site px-6 py-12">
      <header>
        <h1 className="font-serif text-4xl font-bold text-ink sm:text-5xl">
          Tüm Sohbetler
        </h1>
        <p className="mt-2 text-muted">{sohbetler.length} sohbet</p>
      </header>

      <Suspense fallback={<p className="mt-8 text-muted">Yükleniyor…</p>}>
        <ArsivIstemci
          sohbetler={sohbetler}
          kavramFacet={kavramFacet}
          yilFacet={yilFacet}
          sureFacet={sureFacet}
        />
      </Suspense>
    </main>
  );
}
