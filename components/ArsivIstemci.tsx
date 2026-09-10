"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { SohbetMeta } from "@/lib/types";
import SohbetListeKarti from "./SohbetListeKarti";

interface KavramFacet {
  slug: string;
  kisaAd: string;
  adet: number;
}

interface SureFacet {
  sureNo: number;
  sure: string;
  adet: number;
}

interface Props {
  sohbetler: SohbetMeta[];
  kavramFacet: KavramFacet[];

  sureFacet: SureFacet[];
}

const parseList = (s: string | null): string[] =>
  s ? s.split(",").filter(Boolean) : [];

export default function ArsivIstemci({
  sohbetler,
  kavramFacet,

  sureFacet,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const kavram = parseList(sp.get("kavram"));

  const sure = parseList(sp.get("sure"));
  const sirala = sp.get("sirala") ?? "yeni";
  const q = sp.get("q") ?? "";

  const [drawerAcik, setDrawerAcik] = useState(false);
  const [sureArama, setSureArama] = useState("");

  // --- URL güncelleme yardımcıları ---
  function setParam(name: string, values: string[]) {
    const params = new URLSearchParams(sp.toString());
    if (values.length) params.set(name, values.join(","));
    else params.delete(name);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  const toggle = (name: string, deger: string, mevcut: string[]) =>
    setParam(
      name,
      mevcut.includes(deger)
        ? mevcut.filter((x) => x !== deger)
        : [...mevcut, deger],
    );
  function temizle() {
    router.replace(pathname, { scroll: false });
  }

  // --- Filtreleme + sıralama ---
  const filtrelenmis = useMemo(() => {
    const qNorm = q.trim().toLocaleLowerCase("tr");
    let liste = sohbetler.filter((s) => {
      if (kavram.length && !s.kavramSluglari.some((k) => kavram.includes(k)))
        return false;

      if (
        sure.length &&
        !s.sureNolari.some((n) => sure.includes(String(n)))
      )
        return false;
      if (qNorm) {
        const metin = `${s.baslik} ${s.ozet} ${s.konu}`.toLocaleLowerCase("tr");
        if (!metin.includes(qNorm)) return false;
      }
      return true;
    });
    return liste;
  }, [sohbetler, kavram, sure, q]);

  const filtreVar = kavram.length + sure.length > 0 || q !== "";

  const gorunenSureler = sureFacet.filter((s) =>
    s.sure.toLocaleLowerCase("tr").includes(sureArama.toLocaleLowerCase("tr")),
  );

  // Aktif filtre chip etiketleri
  const aktifChipler: Array<{ etiket: string; kaldir: () => void }> = [
    ...kavram.map((slug) => ({
      etiket: kavramFacet.find((k) => k.slug === slug)?.kisaAd ?? slug,
      kaldir: () => toggle("kavram", slug, kavram),
    })),

    ...sure.map((n) => ({
      etiket: sureFacet.find((s) => String(s.sureNo) === n)?.sure ?? n,
      kaldir: () => toggle("sure", n, sure),
    })),
    ...(q ? [{ etiket: `"${q}"`, kaldir: () => setParam("q", []) }] : []),
  ];

  const Sidebar = (
    <div className="space-y-8">
      <FacetBolum baslik="Kavramlar">
        <ul className="space-y-2.5">
          {kavramFacet.map((k) => (
            <CheckSatir
              key={k.slug}
              secili={kavram.includes(k.slug)}
              onToggle={() => toggle("kavram", k.slug, kavram)}
              etiket={k.kisaAd}
              adet={k.adet}
              kucukHarf
            />
          ))}
        </ul>
      </FacetBolum>



      <FacetBolum baslik="Sureler" katlanabilir>
        <input
          type="search"
          value={sureArama}
          onChange={(e) => setSureArama(e.target.value)}
          placeholder="Ara..."
          aria-label="Sure ara"
          className="mb-3 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <ul className="space-y-2.5">
          {gorunenSureler.map((s) => (
            <CheckSatir
              key={s.sureNo}
              secili={sure.includes(String(s.sureNo))}
              onToggle={() => toggle("sure", String(s.sureNo), sure)}
              etiket={`${s.sure} Suresi`}
              adet={s.adet}
            />
          ))}
          {gorunenSureler.length === 0 && (
            <li className="text-sm text-muted">Sonuç yok</li>
          )}
        </ul>
      </FacetBolum>

      {filtreVar && (
        <button
          onClick={temizle}
          className="w-full rounded-card border border-line py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Filtreleri Temizle
        </button>
      )}
    </div>
  );

  return (
    <div className="mt-8 flex flex-col gap-8 lg:flex-row">
      {/* Masaüstü sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{Sidebar}</aside>

      {/* Mobil filtre butonu + drawer */}
      <div className="lg:hidden">
        <button
          onClick={() => setDrawerAcik(true)}
          className="inline-flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2 text-sm font-medium"
        >
          <FilterIcon /> Filtrele
          {filtreVar && (
            <span className="ml-1 rounded-full bg-accent px-1.5 text-xs text-accent-fg">
              {kavram.length + sure.length + (q ? 1 : 0)}
            </span>
          )}
        </button>
        {drawerAcik && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-ink/40"
              onClick={() => setDrawerAcik(false)}
            />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-bg p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-serif text-lg font-semibold">Filtrele</span>
                <button
                  onClick={() => setDrawerAcik(false)}
                  aria-label="Kapat"
                  className="text-2xl leading-none text-muted"
                >
                  ×
                </button>
              </div>
              {Sidebar}
            </div>
          </div>
        )}
      </div>

      {/* Liste alanı */}
      <div className="min-w-0 flex-1">
        {/* Aktif filtreler + sıralama */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {aktifChipler.length > 0 && (
              <span className="text-sm text-muted">Aktif:</span>
            )}
            {aktifChipler.map((c, i) => (
              <button
                key={i}
                onClick={c.kaldir}
                className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-xs font-medium text-chip-fg transition-colors hover:bg-chip/70"
              >
                {c.etiket}
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        </div>



        <p className="mb-4 text-sm text-muted">{filtrelenmis.length} sonuç</p>

        <div className="space-y-4">
          {filtrelenmis.map((s) => (
            <SohbetListeKarti key={s.slug} sohbet={s} />
          ))}
          {filtrelenmis.length === 0 && (
            <div className="rounded-card border border-line bg-surface p-10 text-center text-muted">
              Bu filtrelere uygun sohbet bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Alt bileşenler ---

function FacetBolum({
  baslik,
  katlanabilir,
  children,
}: {
  baslik: string;
  katlanabilir?: boolean;
  children: React.ReactNode;
}) {
  const [acik, setAcik] = useState(true);
  return (
    <section>
      <button
        onClick={() => katlanabilir && setAcik((v) => !v)}
        className="mb-3 flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted"
        aria-expanded={katlanabilir ? acik : undefined}
      >
        {baslik}
        {katlanabilir && (
          <span className={`transition-transform ${acik ? "rotate-180" : ""}`}>
            <ChevronIcon />
          </span>
        )}
      </button>
      {acik && children}
    </section>
  );
}

function CheckSatir({
  secili,
  onToggle,
  etiket,
  adet,
  kucukHarf,
}: {
  secili: boolean;
  onToggle: () => void;
  etiket: string;
  adet: number;
  kucukHarf?: boolean;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={secili}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-accent"
        />
        <span className={`text-ink ${kucukHarf ? "lowercase" : ""}`}>
          {etiket}
        </span>
        <span className="text-muted">({adet})</span>
      </label>
    </li>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
