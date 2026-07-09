import { notFound } from "next/navigation";
import type { Metadata } from "next";
import KavramChip from "@/components/KavramChip";
import KavramSohbetSatiri from "@/components/KavramSohbetSatiri";
import { getKavram, getKavramlar } from "@/lib/content";

export function generateStaticParams() {
  return getKavramlar().map((k) => ({ slug: k.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const k = getKavram(params.slug);
  if (!k) return {};
  return {
    title: k.ad,
    description: `${k.ad} kavramının geçtiği ${k.adet} sohbet.`,
  };
}

export default function KavramSayfasi({
  params,
}: {
  params: { slug: string };
}) {
  const kavram = getKavram(params.slug);
  if (!kavram) notFound();

  // Kronolojik (yeniden eskiye) — getKavram zaten tarihe göre sıralı döndürür.
  const sohbetler = kavram.sohbetler;

  return (
    <main className="mx-auto max-w-site px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">
          Kavram
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-ink sm:text-5xl">
          {kavram.ad}
        </h1>
        <p className="mt-2 text-muted">{kavram.adet} sohbette geçiyor</p>

        {kavram.ilgili.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
              İlgili Kavramlar
            </h2>
            <div className="flex flex-wrap gap-2">
              {kavram.ilgili.map((k) => (
                <KavramChip key={k.slug} kavram={k} ton="teal" />
              ))}
            </div>
          </div>
        )}
      </header>

      <section className="mt-12">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            Sohbetler
          </h2>
          <span className="text-sm text-muted">Kronolojik</span>
        </div>
        <div>
          {sohbetler.map((s) => (
            <KavramSohbetSatiri key={s.slug} sohbet={s} />
          ))}
        </div>
      </section>
    </main>
  );
}
