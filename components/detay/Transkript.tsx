"use client";

import { Fragment, useEffect, useState, useRef } from "react";
import AyetTooltip from "./AyetTooltip";

// Gövdeyi ## başlıklara göre bölümlere ayırır.
function bolumlereAyir(govde: string): Array<{ baslik: string; metin: string }> {
  return govde
    .split(/^##\s+/m)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const satirSonu = p.indexOf("\n");
      const baslik = (satirSonu === -1 ? p : p.slice(0, satirSonu)).trim();
      const metin = satirSonu === -1 ? "" : p.slice(satirSonu + 1).trim();
      return { baslik, metin };
    });
}

// Regex: Opsiyonel kelime + sayı + : veya / + sayı -> örn: Zümer 39:29, 39:29, Bakara 2/255
const AYET_REGEX = /([A-Za-zÇĞİÖŞÜçğıöşü]+\s+\d+[:/]\d+|\b\d+[:/]\d+\b)/g;

function formatText(paragraf: string) {
  // Önce *vurgu* split yapıyoruz
  const parcalar = paragraf.split(/(\*[^*]+\*)/g);
  return parcalar.map((parca, i) => {
    if (parca.startsWith("*") && parca.endsWith("*") && parca.length > 2) {
      return (
        <em key={i} className="text-muted">
          {parca.slice(1, -1)}
        </em>
      );
    }
    
    // Vurgu olmayan normal metinde Ayet arıyoruz
    const ayetParcalar = parca.split(AYET_REGEX);
    return (
      <Fragment key={i}>
        {ayetParcalar.map((ap, j) => {
          if (AYET_REGEX.test(ap)) {
            // "Zümer 39:29" -> chapter = 39, verse = 29
            const match = ap.match(/(\d+)[:/](\d+)/);
            if (match) {
              const chapter = parseInt(match[1]);
              const verse = parseInt(match[2]);
              return (
                <AyetTooltip key={j} chapter={chapter} verse={verse}>
                  {ap}
                </AyetTooltip>
              );
            }
          }
          return <Fragment key={j}>{ap}</Fragment>;
        })}
      </Fragment>
    );
  });
}

export default function Transkript({ govde, slug }: { govde: string; slug: string }) {
  const bolumlerMetin = bolumlereAyir(govde);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [highlights, setHighlights] = useState<Set<string>>(new Set());

  // Bookmark & Highlight Yükle
  useEffect(() => {
    try {
      const savedHighlights = localStorage.getItem(`highlights-${slug}`);
      if (savedHighlights) setHighlights(new Set(JSON.parse(savedHighlights)));

      const bookmark = localStorage.getItem("bookmark");
      if (bookmark) {
        const { slug: savedSlug, sectionId } = JSON.parse(bookmark);
        if (savedSlug === slug && window.location.hash === "") {
          const el = document.getElementById(sectionId);
          if (el) {
            setTimeout(() => {
              el.scrollIntoView({ behavior: "smooth" });
            }, 500);
          }
        }
      }
    } catch (e) {}
  }, [slug]);

  // Bookmark Kaydet (Intersection Observer)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            localStorage.setItem(
              "bookmark",
              JSON.stringify({ slug, sectionId: entry.target.id, baslik: (entry.target as any).dataset.baslik })
            );
            // Sadece ilk görünene göre kaydet ve çık
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 } // Sayfanın üst kısmına yakın olanı yakala
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [slug]);

  const toggleHighlight = (pId: string) => {
    const newH = new Set(highlights);
    if (newH.has(pId)) newH.delete(pId);
    else newH.add(pId);
    setHighlights(newH);
    localStorage.setItem(`highlights-${slug}`, JSON.stringify(Array.from(newH)));
  };

  return (
    <div
      className="reading-body max-w-reading"
      style={{ fontSize: "calc(18px * var(--reading-scale, 1))" }}
    >
      {bolumlerMetin.map((b, i) => (
        <section 
          key={i} 
          id={`bolum-${i}`} 
          data-baslik={b.baslik}
          ref={(el) => { sectionRefs.current[i] = el; }}
          className="scroll-mt-24 group/section relative"
        >
          <h2 className="mb-4 mt-10 font-serif text-2xl font-semibold leading-snug text-ink first:mt-0">
            {b.baslik}
          </h2>
          {b.metin
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p, j) => {
              const pId = `p-${i}-${j}`;
              const isHighlighted = highlights.has(pId);
              return (
                <div key={j} className="group/p relative">
                  <button 
                    onClick={() => toggleHighlight(pId)}
                    title="Altını Çiz"
                    className={`absolute -left-8 top-1 opacity-0 transition-opacity group-hover/p:opacity-100 ${isHighlighted ? 'opacity-100 text-yellow-500' : 'text-line hover:text-yellow-500'}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isHighlighted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                  </button>
                  <p className={`mb-5 leading-[1.8] text-ink/90 transition-colors duration-300 rounded ${isHighlighted ? 'bg-yellow-100 px-2 py-1 -mx-2' : ''}`}>
                    {formatText(p)}
                  </p>
                </div>
              );
            })}
        </section>
      ))}
    </div>
  );
}
