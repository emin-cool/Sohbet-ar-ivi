"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SohbetRef {
  slug: string;
  baslik: string;
}
interface AyetSatiri {
  sureNo?: number;
  ayet?: string;
  sure?: string;
  metin?: string;
  not?: string;
  sohbetler: SohbetRef[];
}
interface Grup {
  sure: string;
  sureNo: number;
  sohbetSayisi: number;
  ayetler: AyetSatiri[];
}

export default function AyetAkordeon({ gruplar }: { gruplar: Grup[] }) {
  const [acik, setAcik] = useState<Set<number>>(new Set());

  // URL hash'inden açık sure (paylaşılabilir link) + o sureye kaydır.
  useEffect(() => {
    const m = /^#sure-(\d+)$/.exec(window.location.hash);
    if (m) {
      const no = Number(m[1]);
      setAcik(new Set([no]));
      requestAnimationFrame(() => {
        document
          .getElementById(`sure-${no}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  function toggle(no: number) {
    setAcik((prev) => {
      const y = new Set(prev);
      if (y.has(no)) y.delete(no);
      else {
        y.add(no);
        // Paylaşılabilir: son açılan sureyi hash'e yaz.
        history.replaceState(null, "", `#sure-${no}`);
      }
      return y;
    });
  }

  return (
    <ul className="mt-8 divide-y divide-line border-y border-line">
      {gruplar.map((g) => {
        const isAcik = acik.has(g.sureNo);
        const bolgeId = `sure-panel-${g.sureNo}`;
        return (
          <li key={g.sureNo} id={`sure-${g.sureNo}`} className="scroll-mt-20">
            <button
              onClick={() => toggle(g.sureNo)}
              aria-expanded={isAcik}
              aria-controls={bolgeId}
              className="flex w-full items-center gap-4 py-5 text-left"
            >
              <span className="w-6 shrink-0 text-sm tabular-nums text-muted">
                {g.sureNo}
              </span>
              <span className="font-serif text-xl font-semibold text-ink">
                {g.sure} Suresi
              </span>
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                {g.sohbetSayisi} sohbet
              </span>
              <span
                className={`ml-auto shrink-0 text-muted transition-transform ${
                  isAcik ? "rotate-180" : ""
                }`}
              >
                <ChevronIcon />
              </span>
            </button>

            {isAcik && (
              <div id={bolgeId} className="space-y-6 pb-6 pl-10">
                {g.ayetler.map((a, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-accent">
                        {a.sure} Suresi {a.sureNo}:{a.ayet}
                      </h3>
                      <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-chip-fg">
                        tahmini
                      </span>
                    </div>
                    {a.metin && (
                      <p className="mt-1 italic text-ink/80">“{a.metin}”</p>
                    )}
                    <ul className="mt-2 space-y-1.5">
                      {a.sohbetler.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/sohbet/${s.slug}`}
                            className="inline-flex items-center gap-2 text-sm text-ink/75 transition-colors hover:text-accent"
                          >
                            <HeadphoneIcon />
                            {s.baslik}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeadphoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-muted">
      <path
        d="M4 13a8 8 0 0 1 16 0M4 13v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Zm16 0v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
