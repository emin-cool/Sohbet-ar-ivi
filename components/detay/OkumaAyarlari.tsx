"use client";

import { useEffect, useRef, useState } from "react";

type Tema = "light" | "sepia" | "dark";
const TEMA_ANAHTAR = "sohbet-arsivi:tema";
const YAZI_ANAHTAR = "sohbet-arsivi:yazi";
const OLCEKLER = [0.9, 1, 1.15, 1.3];

const TEMALAR: Array<{ deger: Tema; etiket: string }> = [
  { deger: "light", etiket: "Açık" },
  { deger: "sepia", etiket: "Sepya" },
  { deger: "dark", etiket: "Koyu" },
];

function temaUygula(t: Tema) {
  document.documentElement.dataset.theme = t;
}
function yaziUygula(olcek: number) {
  document.documentElement.style.setProperty("--reading-scale", String(olcek));
}

export default function OkumaAyarlari() {
  const [acik, setAcik] = useState(false);
  const [tema, setTema] = useState<Tema>("light");
  const [olcekIdx, setOlcekIdx] = useState(1);
  const kutuRef = useRef<HTMLDivElement>(null);

  // Kayıtlı ayarları yükle
  useEffect(() => {
    const t = (localStorage.getItem(TEMA_ANAHTAR) as Tema) || "light";
    const y = Number(localStorage.getItem(YAZI_ANAHTAR));
    const idx = OLCEKLER.indexOf(y);
    setTema(t);
    if (idx >= 0) setOlcekIdx(idx);
  }, []);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!acik) return;
    function onDoc(e: MouseEvent) {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node))
        setAcik(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [acik]);

  function temaSec(t: Tema) {
    setTema(t);
    temaUygula(t);
    localStorage.setItem(TEMA_ANAHTAR, t);
  }
  function olcekDegistir(delta: number) {
    // functional update: ardışık hızlı tıklamalarda güncel değerden hesapla
    setOlcekIdx((prev) => {
      const yeni = Math.min(OLCEKLER.length - 1, Math.max(0, prev + delta));
      yaziUygula(OLCEKLER[yeni]);
      localStorage.setItem(YAZI_ANAHTAR, String(OLCEKLER[yeni]));
      return yeni;
    });
  }

  return (
    <div className="relative" ref={kutuRef}>
      <button
        onClick={() => setAcik((v) => !v)}
        aria-haspopup="true"
        aria-expanded={acik}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
      >
        <SlidersIcon /> Okuma Ayarları
      </button>

      {acik && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-card border border-line bg-surface p-4 shadow-card-hover">
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Yazı Boyutu
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => olcekDegistir(-1)}
                disabled={olcekIdx === 0}
                aria-label="Yazıyı küçült"
                className="flex h-9 flex-1 items-center justify-center rounded-md border border-line text-sm font-medium disabled:opacity-40"
              >
                A−
              </button>
              <button
                onClick={() => olcekDegistir(1)}
                disabled={olcekIdx === OLCEKLER.length - 1}
                aria-label="Yazıyı büyüt"
                className="flex h-9 flex-1 items-center justify-center rounded-md border border-line text-base font-semibold disabled:opacity-40"
              >
                A+
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Tema
            </p>
            <div className="flex gap-2">
              {TEMALAR.map((t) => (
                <button
                  key={t.deger}
                  onClick={() => temaSec(t.deger)}
                  className={`flex-1 rounded-md border py-1.5 text-sm transition-colors ${
                    tema === t.deger
                      ? "border-accent bg-accent-soft font-medium text-accent"
                      : "border-line text-ink hover:border-accent"
                  }`}
                >
                  {t.etiket}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="8" r="2.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="16" r="2.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
