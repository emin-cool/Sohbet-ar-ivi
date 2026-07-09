"use client";

import { useEffect, useState } from "react";
import type { Bolum } from "@/lib/types";

// Transkript bölüm başlıkları bu id'lerle işaretlidir (Transkript bileşeni).
const bolumId = (i: number) => `bolum-${i}`;

export default function Icindekiler({ bolumler }: { bolumler: Bolum[] }) {
  const [aktif, setAktif] = useState(0);

  // Scroll-spy: en üstteki eşiği geçmiş son bölüm aktif olur.
  useEffect(() => {
    let tik = false;
    function hesapla() {
      tik = false;
      const esik = 140; // sticky navbar payı
      let bulunan = 0;
      for (let i = 0; i < bolumler.length; i++) {
        const el = document.getElementById(bolumId(i));
        if (el && el.getBoundingClientRect().top <= esik) bulunan = i;
      }
      setAktif(bulunan);
    }
    function onScroll() {
      if (!tik) {
        tik = true;
        requestAnimationFrame(hesapla);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    hesapla();
    return () => window.removeEventListener("scroll", onScroll);
  }, [bolumler.length]);

  function tikla(i: number) {
    document
      .getElementById(bolumId(i))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav aria-label="İçindekiler">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
        İçindekiler
      </p>
      <ul className="space-y-0.5">
        {bolumler.map((b, i) => (
          <li key={i}>
            <button
              onClick={() => tikla(i)}
              aria-current={aktif === i ? "true" : undefined}
              className={`flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                aktif === i
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-ink/75 hover:text-accent"
              }`}
            >
              <span className="min-w-0">{b.baslik}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
