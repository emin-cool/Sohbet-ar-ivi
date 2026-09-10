import { notFound } from "next/navigation";
import type { Metadata } from "next";
import KavramChip from "@/components/KavramChip";
import KavramSohbetSatiri from "@/components/KavramSohbetSatiri";
import KavramEditButton from "@/components/admin/KavramEditButton";
import { getKavram, getKavramlar } from "@/lib/content";
import { Fragment } from "react";

export async function generateStaticParams() {
  return (await getKavramlar()).map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const k = await getKavram(params.slug);
  if (!k) return {};
  return {
    title: k.ad,
    description: `${k.ad} kavramının geçtiği ${k.adet} sohbet.`,
  };
}

export default async function KavramSayfasi({
  params,
}: {
  params: { slug: string };
}) {
  const kavram = await getKavram(params.slug);
  if (!kavram) notFound();

  // Kronolojik (yeniden eskiye) — getKavram zaten tarihe göre sıralı döndürür.
  const sohbetler = kavram.sohbetler;

  return (
    <>
      <KavramEditButton />
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
        <div className="mt-4 flex flex-col gap-4">
          {sohbetler.map((s) => (
            <KavramSohbetSatiri key={s.slug} sohbet={s} />
          ))}
        </div>
      </section>
      </main>
    </>
  );
}
