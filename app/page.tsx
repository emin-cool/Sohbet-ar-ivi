import Link from "next/link";
import DevamEt from "@/components/DevamEt";
import HeroArama from "@/components/HeroArama";
import SohbetKarti from "@/components/SohbetKarti";
import { getKavramlar, getSohbetMetalar } from "@/lib/content";

export default function AnaSayfa() {
  const sohbetler = getSohbetMetalar();
  const sonEklenenler = sohbetler.slice(0, 3);
  const kavramlar = getKavramlar().slice(0, 9);
  const enCok = kavramlar[0]?.adet ?? 1;

  return (
    <main className="mx-auto max-w-site px-6">
      {/* Hero */}
      <section className="py-16 text-center sm:py-20">
        <h1 className="mx-auto max-w-3xl font-serif text-4xl font-bold leading-tight text-ink sm:text-5xl">
          Dijital Sığınağa Hoş Geldiniz
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Türkçe İslami sohbet kayıtları. Kavram, ayet ve konuya göre okuyun,
          dinleyin.
        </p>
        <div className="mt-8">
          <HeroArama />
        </div>
      </section>

      {/* Kaldığın yerden devam et (localStorage — kayıt yoksa render edilmez) */}
      <DevamEt
        sohbetler={sohbetler.map((s) => ({ slug: s.slug, baslik: s.baslik }))}
      />

      {/* Son Eklenen Sohbetler */}
      <section className="py-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-serif text-3xl font-semibold text-ink">
            Son Eklenen Sohbetler
          </h2>
          <Link
            href="/sohbetler"
            className="text-sm font-medium text-accent transition-colors hover:text-accent-strong"
          >
            Tümünü Gör
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {sonEklenenler.map((s) => (
            <SohbetKarti key={s.slug} sohbet={s} />
          ))}
        </div>
      </section>

      {/* Kavramlar Arasında Gezin */}
      <section className="border-t border-line py-16">
        <p className="mb-8 text-center text-sm font-semibold uppercase tracking-wider text-muted">
          Kavramlar Arasında Gezin
        </p>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {kavramlar.map((k, i) => {
            // Sıklığa göre boyut/renk (design/home.png tag cloud)
            const oran = k.adet / enCok;
            const boyut =
              oran > 0.75
                ? "text-4xl"
                : oran > 0.5
                  ? "text-3xl"
                  : oran > 0.3
                    ? "text-2xl"
                    : "text-xl";
            const renk = i % 3 === 0 ? "text-accent" : "text-ink/80";
            return (
              <Link
                key={k.slug}
                href={`/kavram/${k.slug}`}
                className={`font-serif ${boyut} ${renk} lowercase leading-none transition-colors hover:text-accent`}
              >
                {k.kisaAd}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
