"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export interface DevamSohbet {
  slug: string;
  baslik: string;
}

interface BookmarkData {
  slug: string;
  sectionId: string;
  baslik: string;
  sohbetBaslik?: string;
}

// "KALDIĞIN YERDEN DEVAM ET" — localStorage'da kayıt varsa render edilir.
export default function DevamEt({ sohbetler }: { sohbetler: DevamSohbet[] }) {
  const [durum, setDurum] = useState<BookmarkData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bookmark");
      if (!raw) return;
      const data = JSON.parse(raw);
      const s = sohbetler.find((x) => x.slug === data.slug);
      if (!s) return;
      setDurum({ ...data, sohbetBaslik: s.baslik });
    } catch (e) {
      console.error(e);
    }
  }, [sohbetler]);

  if (!durum) return null;

  return (
    <section className="border-b border-line pb-10" aria-label="Kaldığın yerden devam et">
      <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted">
        Kaldığın Yerden Devam Et
      </p>
      <div className="flex items-center gap-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            <Link
              href={`/sohbet/${durum.slug}#${durum.sectionId}`}
              className="transition-colors hover:text-accent"
            >
              {durum.sohbetBaslik}
            </Link>
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Kaldığınız bölüm: <span className="font-medium">{durum.baslik}</span>
          </p>
        </div>
        <Link
          href={`/sohbet/${durum.slug}#${durum.sectionId}`}
          aria-label={`${durum.sohbetBaslik} okumaya devam et`}
          className="flex h-12 w-32 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-fg shadow-sm transition-transform hover:scale-105 hover:bg-accent-strong"
        >
          Devam Et &rarr;
        </Link>
      </div>
    </section>
  );
}
