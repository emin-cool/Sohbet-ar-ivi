"use client";

import { useEffect, useRef, useState } from "react";

export default function Paylas({ baslik }: { baslik: string }) {
  const [acik, setAcik] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const kutuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    function onDoc(e: MouseEvent) {
      if (kutuRef.current && !kutuRef.current.contains(e.target as Node))
        setAcik(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [acik]);

  function url(): string {
    return typeof window !== "undefined" ? window.location.href : "";
  }
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${baslik} — ${url()}`)}`;

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(url());
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 1800);
    } catch {
      /* izin yok — sessizce geç */
    }
  }

  return (
    <div className="relative" ref={kutuRef}>
      <button
        onClick={() => setAcik((v) => !v)}
        aria-haspopup="true"
        aria-expanded={acik}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
      >
        <ShareIcon /> Paylaş
      </button>

      {acik && (
        <div className="absolute left-0 z-30 mt-2 w-52 rounded-card border border-line bg-surface p-2 shadow-card-hover">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink transition-colors hover:bg-bg"
          >
            <WhatsAppIcon /> WhatsApp'ta paylaş
          </a>
          <button
            onClick={kopyala}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-bg"
          >
            <LinkIcon /> {kopyalandi ? "Kopyalandı ✓" : "Linki kopyala"}
          </button>
          
          <div className="my-1 border-t border-line"></div>
          
          <button
            onClick={() => window.print()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-bg"
          >
            <PrintIcon /> PDF İndir / Yazdır
          </button>
        </div>
      )}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.9.9-.9 2.2-.2 3.4a9 9 0 0 0 3.7 3.4c1.4.6 2 .7 2.7.6.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 14h12v8H6v-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
