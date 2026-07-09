"use client";

import { useState, useRef, useEffect } from "react";

type AyetTooltipProps = {
  chapter: number;
  verse: number;
  children: React.ReactNode;
};

let quranTrCache: any = null;
let quranArCache: any = null;
let fetchPromise: Promise<void> | null = null;

const loadQuran = async () => {
  if (quranTrCache && quranArCache) return;
  if (fetchPromise) return fetchPromise;
  
  fetchPromise = Promise.all([
    fetch("/data/quran.json").then(r => r.json()),
    fetch("/data/quran_ar.json").then(r => r.json())
  ]).then(([tr, ar]) => {
    quranTrCache = tr.quran;
    quranArCache = ar.quran;
  });
  
  return fetchPromise;
};

export default function AyetTooltip({ chapter, verse, children }: AyetTooltipProps) {
  const [data, setData] = useState<{ text_tr: string; text_ar: string; notFound?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAyet = async () => {
    if (data) return; // already fetched
    setLoading(true);
    try {
      await loadQuran();
      const trVerse = quranTrCache.find((q: any) => q.chapter === chapter && q.verse === verse);
      const arVerse = quranArCache.find((q: any) => q.chapter === chapter && q.verse === verse);
      
      if (trVerse && arVerse) {
        setData({ text_tr: trVerse.text, text_ar: arVerse.text });
      } else {
        setData({ text_tr: "", text_ar: "", notFound: true });
      }
    } catch (e) {
      console.error("Ayet fetch error", e);
      setData({ text_tr: "", text_ar: "", notFound: true });
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setVisible(true);
      fetchAyet();
    }, 300); // 300ms delay before showing tooltip to avoid accidental hovers
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <span 
      className="relative inline-block cursor-help text-accent underline decoration-dotted underline-offset-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {visible && (
        <span className="absolute bottom-full left-1/2 mb-2 w-72 -translate-x-1/2 rounded-md bg-ink p-4 text-left text-sm text-surface shadow-lg z-50 pointer-events-none">
          {loading ? (
            <span className="animate-pulse">Ayet yükleniyor...</span>
          ) : data && !data.notFound ? (
            <span className="flex flex-col gap-3">
              <span className="font-serif text-right text-lg text-yellow-300 leading-relaxed" dir="rtl">
                {data.text_ar}
              </span>
              <span className="text-surface/90">
                {data.text_tr}
              </span>
            </span>
          ) : (
            <span className="text-red-300">Ayet bulunamadı.</span>
          )}
          {/* Tooltip oku */}
          <span className="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-ink"></span>
        </span>
      )}
    </span>
  );
}
