import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import KavramChip from "@/components/KavramChip";
import Icindekiler from "@/components/detay/Icindekiler";
import OkumaAyarlari from "@/components/detay/OkumaAyarlari";
import Paylas from "@/components/detay/Paylas";
import Transkript from "@/components/detay/Transkript";
import SohbetEditButton from "@/components/admin/SohbetEditButton";
import ProgressTracker from "@/components/ProgressTracker";
import {
  getBenzerSohbetler,
  getSohbet,
  getSohbetSluglari,
} from "@/lib/content";

export async function generateStaticParams() {
  return (await getSohbetSluglari()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const s = await getSohbet(params.slug);
  if (!s) return {};
  return { title: s.baslik, description: s.ozet };
}

export default async function SohbetDetay({ params }: { params: { slug: string } }) {
  const sohbet = await getSohbet(params.slug);
  if (!sohbet) notFound();
  const benzerler = await getBenzerSohbetler(sohbet.slug, 3);

  return (
    <>
      <ProgressTracker slug={sohbet.slug} />
      <SohbetEditButton slug={sohbet.slug} />
      <main className="mx-auto max-w-site px-6 py-8" data-pagefind-body>

        {/* Breadcrumb */}
        <nav className="text-sm text-muted" aria-label="Breadcrumb" data-pagefind-ignore>
          <Link href="/sohbetler" className="transition-colors hover:text-accent">
            Sohbetler
          </Link>
          <span className="mx-2">›</span>
          <span className="text-ink/70">{sohbet.baslik}</span>
        </nav>

        {/* Başlık + meta */}
        <header className="mt-4">
          <h1 className="font-serif text-4xl font-bold leading-tight text-ink sm:text-5xl">
            {sohbet.baslik}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
            {sohbet.kavramlar.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="flex flex-wrap gap-1.5">
                  {sohbet.kavramlar.map((k) => (
                    <KavramChip key={k.slug} kavram={k} kucukHarf />
                  ))}
                </span>
              </>
            )}
          </div>

        </header>

        {/* Aksiyonlar */}
        <div className="mt-6 flex items-center justify-between border-b border-line pb-6" data-pagefind-ignore>
          <Paylas baslik={sohbet.baslik} />
          <OkumaAyarlari />
        </div>

        {/* İki sütun */}
        <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
          {/* Sol: özet + vurgular + transkript + ayetler */}
          <div className="min-w-0">
            {/* Kısa Özet */}
            {sohbet.ozet && (
              <div className="rounded-card border border-line bg-surface p-6">
                <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold text-ink">
                  <DocIcon /> Kısa Özet
                </h2>
                <p className="leading-relaxed text-ink/85">{sohbet.ozet}</p>
              </div>
            )}

            {/* Öne Çıkan Vurgular */}
            {sohbet.vurgular.length > 0 && (
              <div className="mt-6 rounded-r-card border-l-4 border-accent bg-accent-soft/60 p-6">
                <h2 className="mb-3 font-serif text-xl font-semibold text-accent">
                  Öne Çıkan Vurgular
                </h2>
                <ul className="space-y-3">
                  {sohbet.vurgular.map((v, i) => (
                    <li key={i} className="flex gap-2 text-ink/90">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span className="leading-relaxed">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transkript */}
            <div className="mt-10">
              <Transkript govde={sohbet.govde} slug={sohbet.slug} />
            </div>

            {/* Geçen Ayetler */}
            {(sohbet.ayetler.length > 0 || sohbet.ayetlerNotu) && (
              <div className="mt-10 rounded-card border border-line bg-surface p-6">
                <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold text-ink">
                  <BookIcon /> Geçen Ayetler
                </h2>
                {sohbet.ayetler.length > 0 && (
                  <ul className="mb-4 flex flex-wrap gap-2">
                    {sohbet.ayetler.map((a, i) => (
                      <li key={i}>
                        <Link
                          href={`/ayetler#sure-${a.sureNo}`}
                          className="inline-block rounded-full bg-chip px-3 py-1 text-sm text-chip-fg transition-colors hover:bg-chip/70"
                        >
                          {a.sure} {a.sureNo}:{a.ayet}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {sohbet.ayetlerNotu && (
                  <p className="text-sm leading-relaxed text-muted">
                    <span className="font-medium text-ink/70">
                      Not (tahmini / editör):{" "}
                    </span>
                    {sohbet.ayetlerNotu}
                  </p>
                )}
                {sohbet.ayetler.length > 0 && (
                  <Link
                    href="/ayetler"
                    className="mt-4 inline-block text-sm font-medium text-accent transition-colors hover:text-accent-strong"
                  >
                    Tüm Ayet İndeksi →
                  </Link>
                )}
              </div>
            )}
            {/* Benzer Sohbetler (Sayfa Sonu) */}
            {benzerler.length > 0 && (
              <div className="mt-12 border-t border-line pt-10" data-pagefind-ignore>
                <h2 className="mb-6 font-serif text-2xl font-bold text-ink">
                  İlgili Sohbetler
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {benzerler.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/sohbet/${b.slug}`}
                      className="group flex flex-col justify-between rounded-card border border-line bg-surface p-5 transition-all hover:-translate-y-1 hover:border-accent hover:shadow-card-hover"
                    >
                      <div>
                        <h3 className="font-serif text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-accent line-clamp-2">
                          {b.baslik}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">
                          {b.ozet || "Kısa özet bulunmuyor..."}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sağ: sticky sidebar */}
          <aside className="mt-10 lg:mt-0" data-pagefind-ignore>
            <div className="lg:sticky lg:top-20 space-y-8">
              <Icindekiler bolumler={sohbet.bolumler} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}


function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-accent">
      <path d="M7 3h7l4 4v14H7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v4h4M9.5 12h5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-accent">
      <path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2V5ZM20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
