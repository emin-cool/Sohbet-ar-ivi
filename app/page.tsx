import Link from "next/link";
import DevamEt from "@/components/DevamEt";
import HeroArama from "@/components/HeroArama";
import SohbetKarti from "@/components/SohbetKarti";
import { getKavramlar, getSohbetMetalar } from "@/lib/content";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AnaSayfa() {
  const sohbetler = await getSohbetMetalar();
  const sonEklenenler = sohbetler.slice(0, 3);
  const kavramlar = (await getKavramlar()).slice(0, 9);
  const enCok = kavramlar[0]?.adet ?? 1;

  const session = await getServerSession(authOptions);
  let dbDevamEt = null;

  if (session && session.user) {
    const lastProgress = await prisma.readProgress.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (lastProgress) {
      const s = sohbetler.find((x) => x.slug === lastProgress.slug);
      if (s) {
        dbDevamEt = {
          slug: lastProgress.slug,
          sectionId: lastProgress.sectionId || "",
          baslik: lastProgress.sectionTitle || "Kaldığınız Bölüm",
          sohbetBaslik: s.baslik,
        };
      }
    }
  }

  return (
    <main className="mx-auto max-w-site px-6">
      {/* Hero */}
      <section className="py-16 text-center sm:py-20">
        <h1 className="mx-auto max-w-3xl font-serif text-4xl font-bold leading-tight text-ink sm:text-5xl">
          İsmail Acarkan Pazartesi Sohbetleri
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Türkçe İslami sohbet kayıtları arşivi. Kavram, ayet ve konuya göre okuyun,
          inceleyin.
        </p>
        <div className="mt-8">
          <HeroArama />
        </div>
      </section>

      {/* Kaldığın yerden devam et (localStorage — kayıt yoksa render edilmez) */}
      <DevamEt
        sohbetler={sohbetler.map((s) => ({ slug: s.slug, baslik: s.baslik }))}
        dbDevamEt={dbDevamEt}
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
