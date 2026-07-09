import type { Metadata } from "next";
import AyetAkordeon from "@/components/AyetAkordeon";
import { getAyetIndeksi } from "@/lib/content";

export const metadata: Metadata = {
  title: "Ayet İndeksi",
  description:
    "Sohbetlerde geçen sure ve ayetler, Kur'an-ı Kerim sırasına göre düzenlenmiştir.",
};

export default function AyetlerSayfasi() {
  const gruplar = getAyetIndeksi();

  return (
    <main className="mx-auto max-w-site px-6 py-12">
      <header>
        <h1 className="font-serif text-4xl font-bold text-ink sm:text-5xl">
          Ayet İndeksi
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Sohbetlerde geçen sure ve ayetler. Kur'an-ı Kerim sırasına göre
          düzenlenmiştir.
        </p>
      </header>

      {gruplar.length > 0 ? (
        <AyetAkordeon gruplar={gruplar} />
      ) : (
        <p className="mt-8 text-muted">Henüz ayet referansı bulunmuyor.</p>
      )}

      <p className="mt-8 text-sm italic text-muted">
        Bazı ayet referansları konuşmacının parafrazından tahmini olarak
        çıkarılmıştır, kesin sure/ayet numarası olmayabilir.
      </p>
    </main>
  );
}
