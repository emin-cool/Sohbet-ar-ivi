"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Sonuc {
  url: string;
  baslik: string;
  snippet: string; // <mark> içerebilir
}

// Pagefind runtime yalnızca build sonrası `out/pagefind/` içinde bulunur.
// Tip yok (build sırasında üretilir) — dinamik, bundle'a dahil edilmez.
type Pagefind = {
  search: (q: string) => Promise<{ results: Array<{ data: () => Promise<PagefindData> }> }>;
  options?: (o: Record<string, unknown>) => Promise<void>;
};
interface PagefindData {
  url: string;
  excerpt: string;
  meta: { title?: string };
}

function urlTemizle(u: string): string {
  return u.replace(/index\.html$/, "").replace(/\.html$/, "");
}

export default function AramaOverlay({
  acik,
  kapat,
}: {
  acik: boolean;
  kapat: () => void;
}) {
  const [sorgu, setSorgu] = useState("");
  const [sonuclar, setSonuclar] = useState<Sonuc[]>([]);
  const [durum, setDurum] = useState<"bos" | "arıyor" | "hazır" | "yok">("bos");
  const pfRef = useRef<Pagefind | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Açılınca input'a odaklan
  useEffect(() => {
    if (acik) inputRef.current?.focus();
  }, [acik]);

  // Esc ile kapat
  useEffect(() => {
    if (!acik) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") kapat();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [acik, kapat]);

  // Pagefind'ı ilk açılışta tembel yükle
  async function pagefindYukle(): Promise<Pagefind | null> {
    if (pfRef.current) return pfRef.current;
    try {
      // Değişken yol: TS/webpack statik çözümleme yapmasın, runtime'da fetch edilsin.
      const yol = "/pagefind/pagefind.js";
      const mod = (await import(/* webpackIgnore: true */ yol)) as unknown as Pagefind;
      await mod.options?.({ excerptLength: 20 });
      pfRef.current = mod;
      return mod;
    } catch {
      return null;
    }
  }

  // Debounce'lu arama
  useEffect(() => {
    if (!acik) return;
    const q = sorgu.trim();
    if (!q) {
      setSonuclar([]);
      setDurum("bos");
      return;
    }
    setDurum("arıyor");
    const t = setTimeout(async () => {
      const pf = await pagefindYukle();
      if (!pf) {
        setDurum("yok");
        return;
      }
      const arama = await pf.search(q);
      const veriler = await Promise.all(
        arama.results.slice(0, 8).map((r) => r.data()),
      );
      setSonuclar(
        veriler.map((d) => ({
          url: urlTemizle(d.url),
          baslik: d.meta.title ?? d.url,
          snippet: d.excerpt,
        })),
      );
      setDurum("hazır");
    }, 220);
    return () => clearTimeout(t);
  }, [sorgu, acik]);

  if (!acik) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={kapat} />
      <div className="absolute inset-x-0 top-0 mx-auto max-w-2xl px-4 pt-16 sm:pt-24">
        <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card-hover">
          <div className="flex items-center gap-3 border-b border-line px-4">
            <SearchIcon />
            <input
              ref={inputRef}
              type="search"
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              placeholder="Tüm sohbetlerde ara: kavram, konu, transkript..."
              aria-label="Tüm sohbetlerde ara"
              className="flex-1 bg-transparent py-4 text-ink outline-none placeholder:text-muted"
            />
            <button
              onClick={kapat}
              aria-label="Aramayı kapat"
              className="rounded-md px-2 text-sm text-muted hover:text-ink"
            >
              Esc
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {durum === "arıyor" && (
              <p className="p-6 text-sm text-muted">Aranıyor…</p>
            )}
            {durum === "yok" && (
              <p className="p-6 text-sm text-muted">
                Tam metin arama yalnızca yayınlanmış sitede çalışır (build
                gerektirir).
              </p>
            )}
            {durum === "hazır" && sonuclar.length === 0 && (
              <p className="p-6 text-sm text-muted">
                “{sorgu}” için sonuç bulunamadı.
              </p>
            )}
            {sonuclar.length > 0 && (
              <ul className="divide-y divide-line">
                {sonuclar.map((s) => (
                  <li key={s.url}>
                    <Link
                      href={s.url}
                      onClick={kapat}
                      className="block px-5 py-4 transition-colors hover:bg-bg"
                    >
                      <p className="font-serif text-lg font-semibold text-ink">
                        {s.baslik}
                      </p>
                      <p
                        className="mt-1 line-clamp-2 text-sm text-muted [&_mark]:bg-accent-soft [&_mark]:text-accent"
                        dangerouslySetInnerHTML={{ __html: s.snippet }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {durum === "bos" && (
              <p className="p-6 text-sm text-muted">
                Bir kelime yazın. Bu arama transkript içeriğini de kapsar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-muted">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
